'use server'

import prisma from '@/lib/prisma'
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

        await prisma.user.update({
            where: { clerkUserId },
            data: { role: role }
        });

        const res = await client.users.updateUser(clerkUserId, {
            publicMetadata: {
                onboardingComplete: true,
                applicationName: formData.get('applicationName'),
                applicationType: formData.get('applicationType'),
            },
        })
        return { message: res.publicMetadata }
    } catch (err) {
        console.error("CompleteOnboarding error:", err);
        return { error: 'There was an error updating the user metadata.' }
    }
}
