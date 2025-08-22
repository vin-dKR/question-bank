import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

interface FetchEmailSuccess {
  success: true;
  data: { email: string } | null
}

interface FetchEmailError {
  success: false;
  err: string;
}

export type FetchEmailResponse = FetchEmailSuccess | FetchEmailError;

export const fetchEmail = async (): Promise<FetchEmailResponse> => {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized user");
    }

    const email = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: {
        email: true,
      },
    });

    return {
      success: true,
      data: email,
    };
  } catch (e) {
    return {
      success: false,
      err: e instanceof Error ? e.message : "Unknown error",
    };
  }
}