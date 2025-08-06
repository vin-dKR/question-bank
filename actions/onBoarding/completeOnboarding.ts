'use server'

import prisma from '@/lib/prisma'
import { useOnboardingStore } from '@/store/userInitialSelectedState'
import { auth, clerkClient } from '@clerk/nextjs/server'

export const completeOnboarding = async (formData: FormData) => {
    const { userId } = await auth()

    if (!userId) {
        return { message: 'No Logged In User' }
    }

    const client = await clerkClient()
    const onboarding = useOnboardingStore((state) => state.onboarding);

    try {

        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) {
            throw new Error("Unauthorized");
        }

        const user = await prisma.user.findUnique({
            where: { clerkUserId },
            select: { id: true },
        });

        if (!user) {
            throw new Error("User not found in database");
        }

        await prisma.user.update({
            where: { clerkUserId },
            data: { role: onboarding?.role }
        });

        const res = await client.users.updateUser(userId, {
            publicMetadata: {
                onboardingComplete: true,
                applicationName: formData.get('applicationName'),
                applicationType: formData.get('applicationType'),
            },
        })
        return { message: res.publicMetadata }
    } catch (err) {
        return { error: 'There was an error updating the user metadata.' }
    }
}
