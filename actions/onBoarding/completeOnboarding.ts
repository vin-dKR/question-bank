'use server'

import prisma from '@/lib/prisma';
import { auth, clerkClient } from '@clerk/nextjs/server'

export const completeOnboarding = async (formData: FormData) => {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
        throw new Error("Unauthorized");
    }

    const client = await clerkClient()

    const rawRole = formData.get("role");
    const role = typeof rawRole === "string" ? rawRole : null;

    if (!role) {
        return { error: "Role is missing or invalid." };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { clerkUserId },
            select: { id: true },
        });

        if (!user) {
            throw new Error("User not found in database");
        }

        // Update user role
        await prisma.user.update({
            where: { clerkUserId },
            data: { role: role }
        });

        // Save role-specific data
        if (role === 'teacher') {
            await prisma.teacherData.upsert({
                where: { userId: user.id },
                update: {
                    name: formData.get('name') as string,
                    email: formData.get('email') as string,
                    school: formData.get('school') as string,
                    subject: formData.get('subject') as string,
                    experience: formData.get('experience') as string || null,
                    studentCount: formData.get('studentCount') as string || null,
                },
                create: {
                    userId: user.id,
                    name: formData.get('name') as string,
                    email: formData.get('email') as string,
                    school: formData.get('school') as string,
                    subject: formData.get('subject') as string,
                    experience: formData.get('experience') as string || null,
                    studentCount: formData.get('studentCount') as string || null,
                }
            });
        } else if (role === 'student') {
            await prisma.studentData.upsert({
                where: { userId: user.id },
                update: {
                    name: formData.get('name') as string,
                    email: formData.get('email') as string,
                    grade: formData.get('grade') as string,
                    targetExam: formData.get('targetExam') as string,
                    subjects: (formData.get('subjects') as string)?.split(',') || [],
                },
                create: {
                    userId: user.id,
                    name: formData.get('name') as string,
                    email: formData.get('email') as string,
                    grade: formData.get('grade') as string,
                    targetExam: formData.get('targetExam') as string,
                    subjects: (formData.get('subjects') as string)?.split(',') || [],
                }
            });
        } else if (role === 'coaching') {
            await prisma.coachingData.upsert({
                where: { userId: user.id },
                update: {
                    centerName: formData.get('centerName') as string,
                    contactPerson: formData.get('contactPerson') as string,
                    email: formData.get('email') as string,
                    phone: formData.get('phone') as string,
                    location: formData.get('location') as string,
                    teacherCount: formData.get('teacherCount') as string || null,
                    studentCount: formData.get('studentCount') as string || null,
                    targetExams: (formData.get('targetExams') as string)?.split(',') || [],
                },
                create: {
                    userId: user.id,
                    centerName: formData.get('centerName') as string,
                    contactPerson: formData.get('contactPerson') as string,
                    email: formData.get('email') as string,
                    phone: formData.get('phone') as string,
                    location: formData.get('location') as string,
                    teacherCount: formData.get('teacherCount') as string || null,
                    studentCount: formData.get('studentCount') as string || null,
                    targetExams: (formData.get('targetExams') as string)?.split(',') || [],
                }
            });
        }

        const res = await client.users.updateUser(clerkUserId, {
            publicMetadata: {
                onboardingComplete: true,
                applicationName: formData.get('applicationName'),
                applicationType: formData.get('applicationType'),
            },
        })
        console.log("res", res)
        return { message: res.publicMetadata }
    } catch (err) {
        console.error("CompleteOnboarding error:", err);
        return { error: 'There was an error updating the user metadata.' }
    }
}
