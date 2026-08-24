import prisma from "@/lib/prisma";
import { getAuthContext } from '@/lib/auth/session';
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
    const ctx = await getAuthContext();

    if (!ctx) {
      throw new Error("Unauthorized user");
    }

    const email = await prisma.user.findUnique({
      where: { id: ctx.userId },
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