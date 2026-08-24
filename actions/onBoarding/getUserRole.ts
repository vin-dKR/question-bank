'use server'

import prisma from '@/lib/prisma'
import { getAuthContext } from '@/lib/auth/session'

/**
 * The caller's role.
 *
 * Takes no argument on purpose. It used to accept a Clerk user id passed in
 * from the browser, which is not an identity claim — server actions compile to
 * public HTTP endpoints, so anyone could have asked for anyone's role. The id
 * now comes from the session.
 *
 * Note this is still the LEGACY global `User.role`. Role is properly a property
 * of a membership, not a person (doc §4) — once the org UI ships, read
 * `AuthContext.role` instead and delete this.
 */
export async function getUserRole(): Promise<UserRole> {
    const ctx = await getAuthContext();
    if (!ctx) throw new Error('Unauthorized');

    const user = await prisma.user.findUnique({
        where: { id: ctx.userId },
        select: { role: true }
    });

    if (!user?.role) {
        throw new Error('User or role not found')
    }

    if (!['teacher', 'student', 'coaching'].includes(user.role)) {
        throw new Error(`Invalid role: ${user.role}`);
    }
    return user.role as UserRole
}
