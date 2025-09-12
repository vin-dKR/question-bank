'use server'

import prisma from '@/lib/prisma'

export async function getUserRole(clerkUserId: string): Promise<UserRole> {
    try {
        const user = await prisma.user.findUnique({
            where: { clerkUserId },
            select: { role: true }
        });

        if (!user?.role) {
            throw new Error('User or role not found')
        }

        if (!['teacher', 'student', 'coaching'].includes(user.role)) {
            throw new Error(`Invalid role: ${user.role}`);
        }
        return user.role as UserRole
    } catch (error) {
        console.error('Error fetching user role:', error);
        throw error instanceof Error ? error : new Error('Failed to fetch user role');
    }
}
