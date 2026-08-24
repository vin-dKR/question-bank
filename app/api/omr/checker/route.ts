import { normalizeChoiceKey } from "@/lib/examination/answerKey";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth/session";
import { requireApiActor } from "@/lib/auth/guard";
import { resolveOrCreateStudent } from "@/lib/examination/studentRoster";

/**
 * SECURITY: this route had NO authentication of any kind. It took a testId from
 * the request body and wrote StudentResponse + TestAnswer rows for it, and it
 * is CORS-enabled for the omr-checker satellite — so anyone who could guess or
 * observe a testId could inject or overwrite any student's marks. Same class of
 * hole as the question routes in docs/WORKOS_MIGRATION_APPROACH.md §14.
 *
 * It now requires either a signed-in session or the QUESTION_API_KEY bearer
 * token, and it verifies the test belongs to the caller's organization before
 * writing anything.
 */

export async function POST(request: Request) {
    try {
        const body = await request.json()

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

        const actor = await requireApiActor(request);

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

        // Look the test up FIRST, then check ownership, then write. A service
        // token (the OMR satellite) is trusted for any test; a user may only
        // post marks against a test their own organization owns.
        const organizationId =
            actor.kind === "user" ? actor.user.organizationId : test.organizationId;

        if (actor.kind === "user" && test.organizationId !== actor.user.organizationId) {
            return NextResponse.json(
                { error: "That test belongs to another organization." },
                { status: 403 }
            );
        }

        // Identity is (org, class, roll), never the name — see
        // lib/examination/studentRoster.ts for why matching on name duplicated
        // a child's roster row on every differently-spelled scan.
        const student = await resolveOrCreateStudent({
            organizationId,
            name,
            className,
            rollNumber,
            // See lib/examination/studentRoster.ts — resolves via Enrollment
            // when the test has a class, falls back to the string match when not.
            classId: test.classId,
        });

        const studentId = student.id

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
        // An auth failure must answer 401/403, not 500 — the satellite tools
        // branch on the status to decide whether to re-authenticate or retry.
        if (error instanceof AuthError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error('Error saving verified answers:', error);
        return NextResponse.json(
            { error: 'Failed to save verified answers' },
            { status: 500 }
        );
    }
}
