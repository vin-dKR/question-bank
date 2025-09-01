import prisma from "@/lib/prisma";

async function migrateAnswers() {
    try {
        // Fetch all StudentResponse records with their answers (JSON field)
        const responses = await prisma.studentResponse.findMany({
            select: { id: true, answers: true },
        });

        console.log('Responses before migration:', responses);

        for (const response of responses) {
            // Cast answers as an array of { questionId: string, selectedAnswer: string }
            const answers = response.answers as { questionId: string; selectedAnswer: string }[];
            if (Array.isArray(answers) && answers.length > 0) {
                for (const answer of answers) {
                    // Create a new TestAnswer record
                    await prisma.testAnswer.create({
                        data: {
                            studentResponseId: response.id,
                            questionId: answer.questionId,
                            selectedAnswer: answer.selectedAnswer,
                        },
                    });
                }
            }

            // Remove the answers JSON field from StudentResponse
            // Note: Prisma doesn't allow direct removal of fields, so we set to null or empty array
            await prisma.$runCommandRaw({
                update: 'StudentResponse',
                updates: [
                    {
                        q: { _id: { $oid: response.id } },
                        u: { $unset: { answers: '' } },
                    },
                ],
            });
        }

        console.log('Migration completed');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

migrateAnswers();
