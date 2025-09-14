'use server'

import prisma from '@/lib/prisma'

export async function getUserSubject(clerkUserId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { clerkUserId },
            include: {
                teacherData: true,
            }
        });

        if (user?.role === 'teacher' && user.teacherData) {
            return user.teacherData.subject;
        }

        return null;
    } catch (error) {
        console.error('Error fetching user subject:', error);
        return null;
    }
} 
