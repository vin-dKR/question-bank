'use server'

import prisma from '@/lib/prisma'
import { getAuthContext } from '@/lib/auth/session'

export async function getUserData() {
    const ctx = await getAuthContext();

    if (!ctx) {
        throw new Error("Unauthorized");
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: ctx.userId },
            include: {
                teacherData: true,
                studentData: true,
                coachingData: true,
            }
        });

        if (!user) {
            return { error: "User not found" };
        }

        // Return role-specific data
        if (user.role === 'teacher' && user.teacherData) {
            return {
                role: 'teacher',
                data: user.teacherData
            };
        } else if (user.role === 'student' && user.studentData) {
            return {
                role: 'student',
                data: user.studentData
            };
        } else if (user.role === 'coaching' && user.coachingData) {
            return {
                role: 'coaching',
                data: user.coachingData
            };
        }

        return { error: "No role-specific data found" };
    } catch (error) {
        console.error("Error fetching user data:", error);
        return { error: "Failed to fetch user data" };
    }
} 