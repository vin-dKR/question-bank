import { NextRequest, NextResponse } from 'next/server'
import { getWorkOS } from '@workos-inc/authkit-nextjs'
import prisma from '@/lib/prisma'

/**
 * WorkOS event receiver.
 *
 * This is RECONCILIATION, not the primary provisioning path (doc §7). Users,
 * organizations and memberships are created lazily in `getAuthContext()` on the
 * first authenticated request; this endpoint exists to catch changes that
 * happen while nobody is browsing — a name change, a membership revoked from
 * the WorkOS dashboard, a deletion.
 *
 * That inversion is what kills the two bugs the Clerk webhook had:
 *   - the race where a user landed on the app before the webhook fired and
 *     `completeOnboarding` threw "User not found in database"
 *   - the double-create where concurrent created/updated events both missed the
 *     `findUnique` and both inserted
 *
 * Everything below is an upsert or a no-op-if-missing, so replays are safe.
 * WorkOS also offers a cursor-based Events API for gap-free replay; this
 * endpoint handles the latency path and that would handle the durability one.
 */

/** Events we act on. Anything else is acknowledged and ignored. */
type HandledEvent =
    | 'user.created'
    | 'user.updated'
    | 'user.deleted'
    | 'organization.updated'
    | 'organization.deleted'
    | 'organization_membership.created'
    | 'organization_membership.updated'
    | 'organization_membership.deleted'

export async function POST(req: NextRequest) {
    const secret = process.env.WORKOS_WEBHOOK_SECRET
    if (!secret) {
        console.error('[workos webhook] WORKOS_WEBHOOK_SECRET is not set')
        return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
    }

    const sigHeader = req.headers.get('workos-signature')
    if (!sigHeader) {
        return NextResponse.json({ error: 'Missing WorkOS-Signature header' }, { status: 400 })
    }

    let event
    try {
        event = await getWorkOS().webhooks.constructEvent({
            payload: await req.json(),
            sigHeader,
            secret,
        })
    } catch (err) {
        console.error('[workos webhook] signature verification failed', err)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    try {
        await handle(event.event as HandledEvent, event.data as Record<string, unknown>)
    } catch (err) {
        // Return 500 so WorkOS retries. Every handler is idempotent, so a retry
        // of a partially-applied event is safe.
        console.error(`[workos webhook] handler failed for ${event.event}`, err)
        return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}

async function handle(type: HandledEvent, data: Record<string, unknown>) {
    switch (type) {
        case 'user.created':
        case 'user.updated': {
            const workosUserId = data.id as string
            const email = (data.email as string)?.toLowerCase()
            const name =
                (data.firstName as string | null) || (data.lastName as string | null)
                    ? [data.firstName, data.lastName].filter(Boolean).join(' ')
                    : null
            if (!email) return

            // Upsert on EMAIL, matching getAuthContext(): email is the identifier
            // that survives the Clerk -> WorkOS cutover, and `workosUserId` is
            // not @unique so it cannot be an upsert key (see the schema comment).
            const existing = await prisma.user.findUnique({
                where: { email },
                select: { id: true },
            })

            if (existing) {
                await prisma.user.update({
                    where: { id: existing.id },
                    data: {
                        workosUserId,
                        name: name || undefined,
                        profileImage: (data.profilePictureUrl as string | null) ?? undefined,
                        deletedAt: null, // re-created in WorkOS: un-tombstone
                    },
                })
            } else {
                await prisma.user.create({
                    data: {
                        email,
                        workosUserId,
                        name,
                        profileImage: (data.profilePictureUrl as string | null) ?? null,
                        clerkUserId: `workos:${workosUserId}`,
                        role: '',
                    },
                })
            }
            return
        }

        case 'user.deleted': {
            // TOMBSTONE, never delete (doc §11). This row is the author of
            // questions, folders, tests and paper history; deleting it would
            // cascade real content away. Nulling workosUserId also means a
            // future sign-in can't silently re-adopt the identity.
            const workosUserId = data.id as string
            const user = await prisma.user.findFirst({
                where: { workosUserId },
                select: { id: true },
            })
            if (!user) return

            await prisma.user.update({
                where: { id: user.id },
                data: { deletedAt: new Date(), workosUserId: null },
            })
            await prisma.membership.updateMany({
                where: { userId: user.id },
                data: { status: 'inactive' },
            })
            return
        }

        case 'organization.updated': {
            const workosOrgId = data.id as string
            await prisma.organization.updateMany({
                where: { workosOrgId },
                data: { name: data.name as string },
            })
            return
        }

        case 'organization.deleted': {
            // Soft-delete only. Marks data is exactly what a school comes back
            // for months later (doc §11) — deactivate access, keep the rows.
            const workosOrgId = data.id as string
            const org = await prisma.organization.findUnique({
                where: { workosOrgId },
                select: { id: true },
            })
            if (!org) return
            await prisma.membership.updateMany({
                where: { organizationId: org.id },
                data: { status: 'inactive' },
            })
            return
        }

        case 'organization_membership.created':
        case 'organization_membership.updated': {
            const workosMembershipId = data.id as string
            const workosUserId = data.userId as string
            const workosOrgId = data.organizationId as string
            const roleSlug =
                (data.role as { slug?: string } | undefined)?.slug ?? 'member'
            const status = (data.status as string) ?? 'active'

            const [user, org] = await Promise.all([
                prisma.user.findFirst({ where: { workosUserId }, select: { id: true } }),
                prisma.organization.findUnique({
                    where: { workosOrgId },
                    select: { id: true },
                }),
            ])
            // Either side may not exist locally yet if the event beat the user's
            // first request. Lazy provisioning will create it; drop this event.
            if (!user || !org) return

            await prisma.membership.upsert({
                where: {
                    userId_organizationId: { userId: user.id, organizationId: org.id },
                },
                update: { workosMembershipId, role: roleSlug, status },
                create: {
                    workosMembershipId,
                    userId: user.id,
                    organizationId: org.id,
                    role: roleSlug,
                    status,
                },
            })
            return
        }

        case 'organization_membership.deleted': {
            const workosMembershipId = data.id as string
            await prisma.membership.deleteMany({ where: { workosMembershipId } })
            return
        }

        default:
            return
    }
}
