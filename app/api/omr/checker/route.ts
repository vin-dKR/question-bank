import { normalizeChoiceKey } from "@/lib/examination/answerKey";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json()

        if (
            !body ||
            !body.testId ||
            !body.answers ||
            !Array.isArray(body.answers) ||
            !body.name ||
            !body.rollNumber ||
            !body.className
        ) {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        const { testId, name, rollNumber, className } = body;
        const answers = body.answers as { questionId: string; selectedAnswer: string }[];

        let student = await prisma.student.findFirst({
            where: {
                name,
                rollNumber,
                className
            }
        })

        if (!student) {
            student = await prisma.student.create({
                data: {
                    name,
                    rollNumber,
                    className
                }
            })
        }

        const studentId = student.id

        const test = await prisma.test.findUnique({
            where: {
                id: testId
            },
            include: {
                questions: {
                    include: {
                        question: true,
                        schoolTestQuestion: true,
                    }
                }
            }
        })

        if (!test) {
            return NextResponse.json({ error: 'Test not found' }, { status: 404 });
        }

        //Calculation Data

        let score = 0
        const totalMarks = test.totalMarks
        const answerByQuestionId = new Map(
            answers.map((answer: { questionId: string; selectedAnswer: string }) => [
                answer.questionId,
                answer.selectedAnswer,
            ]),
        );
        const answersToSave: { questionId: string; selectedAnswer: string }[] = [];

        for (const testQuestion of test.questions) {
            const source = testQuestion.question ?? testQuestion.schoolTestQuestion;
            const sourceQuestionId = testQuestion.questionId ?? testQuestion.schoolTestQuestionId;

            if (!source || !sourceQuestionId) {
                continue;
            }

            const selectedAnswer = answerByQuestionId.get(sourceQuestionId);
            if (selectedAnswer == null) {
                continue;
            }

            answersToSave.push({
                questionId: sourceQuestionId,
                selectedAnswer,
            });

            const selectedKey = normalizeChoiceKey(selectedAnswer, source.options ?? []);
            const correctKey = normalizeChoiceKey(source.answer, source.options ?? []);
            if (selectedKey && correctKey && selectedKey === correctKey) {
                score += testQuestion.marks;
            }
        }

        const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;

        const existingResponse = await prisma.studentResponse.findUnique({
            where: {
                testId_studentId: {
                    testId,
                    studentId,
                },
            },
            select: { id: true },
        });

        let studentRes;

        if (existingResponse) {
            await prisma.testAnswer.deleteMany({
                where: { studentResponseId: existingResponse.id },
            });

            studentRes = await prisma.studentResponse.update({
                where: { id: existingResponse.id },
                data: {
                    score,
                    totalMarks,
                    percentage,
                    answers: {
                        create: answersToSave,
                    },
                },
            });
        } else {
            studentRes = await prisma.studentResponse.create({
                data: {
                    testId,
                    studentId,
                    score,
                    totalMarks,
                    percentage,
                    answers: {
                        create: answersToSave,
                    },
                },
            }
            );
        }

        const headers = {
            "Access-Control-Allow-Origin": "https://omr-checker.vercel.app", // Or specify your origin: "http://localhost:5173"
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        };
        return NextResponse.json({
            message: 'Verified answers saved successfully',
            status: 200,
            data: studentRes,
        }, { headers });

    } catch (error) {
        console.error('Error saving verified answers:', error);
        return NextResponse.json(
            { error: 'Failed to save verified answers', details: error },
            { status: 500 }
        );
    }
}
