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

        const { testId, answers, name, rollNumber, className } = body;

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
                        question: true
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

        for (const answer of answers) {
            console.log('User answer:-----------------------------------------------------', answer);
            const question = test.questions.find((q) => q.questionId === answer.questionId);
            if (question && question.question.answer === answer.selectedAnswer) {
                score += question.marks;
            }
        }

        const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;

        const studentRes = await prisma.studentResponse.create({
            data: {
                testId: testId,
                studentId: studentId,
                score: score,
                totalMarks: totalMarks,
                percentage: percentage,
                answers: {
                    create: answers.map((answer: { questionId: string; selectedAnswer: string }) => ({
                        questionId: answer.questionId,
                        selectedAnswer: answer.selectedAnswer,
                    })),
                },
            }
        })

        console.log("studentResponse ----------------------------------------", studentRes)

        return NextResponse.json({
            message: 'Verified answers saved successfully',
            status: 200,
            data: studentRes,
        });

    } catch (error) {
        console.error('Error saving verified answers:', error);
        return NextResponse.json(
            { error: 'Failed to save verified answers', details: error },
            { status: 500 }
        );
    }
}
