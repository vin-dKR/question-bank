import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { WebhookEvent } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
    try {
        const evt = await verifyWebhook(req, {
            signingSecret: process.env.CLERK_WEBHOOK_SIGNING_SECRET!
        }) as WebhookEvent

        // Log the webhook details for debugging
        console.log(`Clerk Webhook: ${evt.type}`, evt.data)


        // Handle user events
        if (evt.type === 'user.created' || evt.type === 'user.updated') {
            const { id: clerkUserId, email_addresses, first_name, last_name, image_url } = evt.data
            const email = email_addresses[0]?.email_address
            const name = [first_name, last_name].filter(Boolean).join(' ') || undefined

            const exsistingUser = await prisma.user.findUnique({
                where: { clerkUserId }
            })

            if (exsistingUser) {
                await prisma.user.update({
                    where: { clerkUserId },
                    data: {
                        email,
                        name,
                        profileImage: image_url
                    }
                })
            } else {
                await prisma.user.create({
                    data: {
                        clerkUserId,
                        name,
                        email,
                        profileImage: image_url
                    }
                })
            }

            console.log("-------------------------------uploaded user")
        }

        // Handle user deletion
        if (evt.type === 'user.deleted') {
            const { id } = evt.data
            await prisma.user.delete({
                where: { id: id },
            })
        }

        return NextResponse.json({ success: true })

    } catch (err) {
        console.error('Error processing webhook:', err)
        return NextResponse.json(
            { error: 'Webhook verification failed' },
            { status: 400 }
        )
    }
}
