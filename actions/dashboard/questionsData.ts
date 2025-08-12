"use server"

import prisma from "@/lib/prisma"

export const getQuestionsData = async () => {
    const totalQuestions = await prisma.question.count()
    console.log(totalQuestions)

    return {
        totalQuestions,
    }
}
