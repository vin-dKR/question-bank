'use server'

import prisma from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

export async function getUserRole(clerkUserId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { clerkUserId },
            select: { role: true }
        });

        return user?.role || null;
    } catch (error) {
        console.error('Error fetching user role:', error);
        return null;
    }
}