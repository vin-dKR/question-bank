'use server'

import prisma from '@/lib/prisma'
import { getAuthContext } from '@/lib/auth/session'

/** The signed-in teacher's subject, or null. See getUserRole for why this takes no id. */
export async function getUserSubject() {
    try {
        const ctx = await getAuthContext();
        if (!ctx) return null;

        const user = await prisma.user.findUnique({
            where: { id: ctx.userId },
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
