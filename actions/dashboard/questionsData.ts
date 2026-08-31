"use server"

import prisma from "@/lib/prisma"
import { AuthError } from "@/lib/auth/guard"
import { requireOrgContext } from "@/lib/auth/session"

/**
 * Dashboard tile: how many questions the caller can see. Requires a session and
 * is org-scoped (shared bank + own org) — it previously counted the ENTIRE
 * global collection with no auth, leaking the bank's total size to anyone.
 */
export const getQuestionsData = async () => {
    try {
        const ctx = await requireOrgContext()
        const totalQuestions = await prisma.question.count({
            where: { OR: [{ organizationId: null }, { organizationId: ctx.organizationId }] },
        })
        return { totalQuestions }
    } catch (error) {
        if (error instanceof AuthError) {
            return { totalQuestions: 0, error: error.message }
        }
        console.error("Error fetching question count:", error)
        return { totalQuestions: 0, error: "Failed to fetch question count" }
    }
}
