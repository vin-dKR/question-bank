'use server';

import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { htmlTopdfBlob } from '@/actions/htmlToPdf/htmlToPdf';

export const createTest = async (data: CreateTestData): Promise<Partial<ExaminationTest>> => {
    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) {
            throw new Error('Unauthorized');
        }

        const user = await prisma.user.findUnique({
            where: { clerkUserId },
            select: { id: true },
        });

        if (!user) {
            throw new Error('User not found');
        }

        console.log('------------DATA', data);

        const test = await prisma.test.create({
            data: {
                title: data.title,
                description: data.description,
                subject: data.subject,
                duration: typeof data.duration === 'string' ? parseInt(data.duration) : data.duration,
                totalMarks: data.totalMarks,
                createdBy: user.id,
                questions: {
                    create: await Promise.all(
                        data.questions.map(async (q) => {
                            const question = await prisma.question.create({
                                data: {
                                    question_text: q.questionText,
                                    options: q.options,
                                    answer: q.answer, // Stored as string
                                    question_number: q.questionNumber,
                                    isQuestionImage: false,
                                    isOptionImage: false,
                                    option_images: [],
                                },
                            });
                            return {
                                questionId: question.id,
                                marks: q.marks,
                                questionNumber: q.questionNumber,
                            };
                        })
                    ),
                },
            },
            include: {
                questions: {
                    orderBy: { questionNumber: 'asc' },
                    include: {
                        question: {
                            select: {
                                id: true,
                                question_text: true,
                                options: true,
                                answer: true,
                            },
                        },
                    },
                },
                _count: {
                    select: { responses: true },
                },
            },
        });

        return {
            ...test,
            description: test.description,
            questions: test.questions.map((tq) => ({
                id: tq.id,
                questionText: tq.question.question_text,
                options: tq.question.options,
                answer: tq.question.answer || '', // Default to empty string
                marks: tq.marks,
                questionNumber: tq.questionNumber,
            })),
            _count: test._count,
        };
    } catch (error) {
        console.error('Error creating test:', error);
        throw error instanceof Error ? error : new Error('Failed to create test');
    }
};

export const getTests = async (): Promise<Partial<ExaminationTest>[]> => {
    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) {
            throw new Error('Unauthorized');
        }

        const user = await prisma.user.findUnique({
            where: { clerkUserId },
            select: { id: true },
        });

        if (!user) {
            throw new Error('User not found');
        }

        const tests = await prisma.test.findMany({
            where: { createdBy: user.id },
            include: {
                questions: {
                    orderBy: { questionNumber: 'asc' },
                    include: {
                        question: {
                            select: {
                                id: true,
                                question_text: true,
                                options: true,
                                answer: true,
                            },
                        },
                    },
                },
                _count: {
                    select: { responses: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return tests.map((test) => ({
            ...test,
            description: test.description,
            questions: test.questions.map((tq) => ({
                id: tq.id,
                questionText: tq.question.question_text,
                options: tq.question.options,
                answer: tq.question.answer || '',
                marks: tq.marks,
                questionNumber: tq.questionNumber,
            })),
            _count: test._count,
        }));
    } catch (error) {
        console.error('Error fetching tests:', error);
        throw error instanceof Error ? error : new Error('Failed to fetch tests');
    }
};

export const getTestById = async (testId: string): Promise<Partial<ExaminationTest> | null> => {
    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) {
            throw new Error('Unauthorized');
        }

        const user = await prisma.user.findUnique({
            where: { clerkUserId },
            select: { id: true },
        });

        if (!user) {
            throw new Error('User not found');
        }

        const test = await prisma.test.findFirst({
            where: {
                id: testId,
                createdBy: user.id,
            },
            include: {
                questions: {
                    orderBy: { questionNumber: 'asc' },
                    include: {
                        question: {
                            select: {
                                id: true,
                                question_text: true,
                                options: true,
                                answer: true,
                            },
                        },
                    },
                },
                _count: {
                    select: { responses: true },
                },
            },
        });

        if (!test) {
            return null;
        }

        return {
            ...test,
            description: test.description,
            questions: test.questions.map((tq) => ({
                id: tq.id,
                questionText: tq.question.question_text,
                options: tq.question.options,
                answer: tq.question.answer || '',
                marks: tq.marks,
                questionNumber: tq.questionNumber,
            })),
            _count: test._count,
        };
    } catch (error) {
        console.error('Error fetching test:', error);
        throw error instanceof Error ? error : new Error('Failed to fetch test');
    }
};

export const deleteTest = async (testId: string): Promise<void> => {
    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) {
            throw new Error('Unauthorized');
        }

        const user = await prisma.user.findUnique({
            where: { clerkUserId },
            select: { id: true },
        });

        if (!user) {
            throw new Error('User not found');
        }

        await prisma.test.deleteMany({
            where: {
                id: testId,
                createdBy: user.id,
            },
        });
    } catch (error) {
        console.error('Error deleting test:', error);
        throw error instanceof Error ? error : new Error('Failed to delete test');
    }
};

export const getTestAnalytics = async (testId: string): Promise<TestAnalytics> => {
    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) {
            throw new Error('Unauthorized');
        }

        const user = await prisma.user.findUnique({
            where: { clerkUserId },
            select: { id: true },
        });

        if (!user) {
            throw new Error('User not found');
        }

        const test = await prisma.test.findFirst({
            where: {
                id: testId,
                createdBy: user.id,
            },
            include: {
                questions: {
                    orderBy: { questionNumber: 'asc' },
                    include: {
                        question: {
                            select: {
                                id: true,
                                question_text: true,
                                options: true,
                                answer: true,
                            },
                        },
                    },
                },
                responses: {
                    include: {
                        student: true,
                        answers: {
                            select: {
                                questionId: true,
                                selectedAnswer: true,
                            },
                        },
                    },
                },
            },
        });

        if (!test) {
            throw new Error('Test not found');
        }

        const responses = test.responses;
        console.log('responses -----------------', responses);
        const totalStudents = responses.length;

        if (totalStudents === 0) {
            return {
                testId,
                totalStudents: 0,
                averageScore: 0,
                highestScore: 0,
                lowestScore: 0,
                averagePercentage: 0,
                questionAnalytics: test.questions.map((q) => ({
                    questionId: q.id,
                    questionNumber: q.questionNumber,
                    questionText: q.question.question_text,
                    correctAnswers: 0,
                    totalAttempts: 0,
                    accuracy: 0,
                })),
                studentAnalytics: [],
            };
        }

        const scores = responses.map((r) => r.score);
        const percentages = responses.map((r) => r.percentage);

        const averageScore = scores.reduce((a, b) => a + b, 0) / totalStudents;
        const highestScore = Math.max(...scores);
        const lowestScore = Math.min(...scores);
        const averagePercentage = percentages.reduce((a, b) => a + b, 0) / totalStudents;

        const questionAnalytics: QuestionAnalytics[] = test.questions.map((question) => {
            let correctAnswers = 0;
            let totalAttempts = 0;

            for (const response of responses) {
                const answer = response.answers?.find((a) => a.questionId === question.questionId);
                if (answer) {
                    totalAttempts++;
                    if (answer.selectedAnswer === question.question.answer) {
                        correctAnswers++;
                    }
                }
            }

            const accuracy = totalAttempts > 0 ? (correctAnswers / totalAttempts) * 100 : 0;

            return {
                questionId: question.id,
                questionNumber: question.questionNumber,
                questionText: question.question.question_text,
                correctAnswers,
                totalAttempts,
                accuracy,
            };
        });

        const studentAnalytics: StudentAnalytics[] = responses.map((response) => {
            // Calculate correct answers and score based on individual question marks
            let correctAnswers = 0;
            let calculatedScore = 0;

            for (const answer of response.answers || []) {
                const question = test.questions.find((q) => q.questionId === answer.questionId);
                if (question && answer.selectedAnswer === question.question.answer) {
                    correctAnswers++;
                    calculatedScore += question.marks; // Add marks for correct answer
                }
            }

            return {
                studentId: response.studentId,
                studentName: response.student.name,
                rollNumber: response.student.rollNumber,
                className: response.student.className,
                score: calculatedScore, // Use calculated score instead of stored score
                percentage: test.totalMarks > 0 ? (calculatedScore / test.totalMarks) * 100 : 0,
                correctAnswers,
                totalQuestions: test.questions.length,
                timeTaken: response.timeTaken,
            };
        });

        console.log(testId,
            totalStudents,
            averageScore,
            highestScore,
            lowestScore,
            averagePercentage,
            questionAnalytics,
            studentAnalytics,
        )

        return {
            testId,
            totalStudents,
            averageScore,
            highestScore,
            lowestScore,
            averagePercentage,
            questionAnalytics,
            studentAnalytics,
        };
    } catch (error) {
        console.error('Error fetching test analytics:', error);
        throw error instanceof Error ? error : new Error('Failed to fetch test analytics');
    }
};

export const generateStudentAnalyticsPdf = async (
    testId: string,
    studentId: string
): Promise<{ data: Uint8Array; filename: string }> => {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
        throw new Error('Unauthorized');
    }

    const user = await prisma.user.findUnique({
        where: { clerkUserId },
        select: { id: true },
    });

    if (!user) {
        throw new Error('User not found');
    }

    // Local payload types matching schema.prisma and types/index.d.ts
    interface TestQuestionWithQuestion {
        id: string;
        questionId: string;
        marks: number;
        questionNumber: number;
        question: {
            id: string;
            question_text: string;
            options: string[];
            answer: string | null;
            topic: string | null;
        };
    }
    interface ResponseAnswerSelect { questionId: string; selectedAnswer: string }
    interface StudentMinimal { id: string; name: string; rollNumber: string; className: string }
    interface StudentResponseWithAnswers {
        studentId: string;
        timeTaken: number | null;
        student: StudentMinimal;
        answers: ResponseAnswerSelect[];
    }
    interface TestWithRelations {
        id: string;
        title: string;
        totalMarks: number;
        questions: TestQuestionWithQuestion[];
        responses: StudentResponseWithAnswers[];
    }

    const test = (await prisma.test.findFirst({
        where: { id: testId, createdBy: user.id },
        include: {
            questions: {
                orderBy: { questionNumber: 'asc' },
                include: {
                    question: {
                        select: { id: true, question_text: true, options: true, answer: true, topic: true },
                    },
                },
            },
            responses: {
                where: { studentId },
                include: {
                    student: true,
                    answers: { select: { questionId: true, selectedAnswer: true } },
                },
            },
        },
    })) as TestWithRelations | null;

    if (!test) {
        throw new Error('Test not found');
    }

    const response = test.responses[0];
    if (!response) {
        throw new Error('Student response not found');
    }

    let correctAnswers = 0;
    let calculatedScore = 0;
    type PerQuestion = {
        questionNumber: number;
        questionText: string;
        selectedAnswer: string | null;
        correctAnswer: string | null;
        isCorrect: boolean;
        marks: number;
        timeSpent: number | null;
        topic: string;
    };
    const perQuestion: PerQuestion[] = test.questions.map((q: TestQuestionWithQuestion) => {
        const ans = response.answers?.find((a: ResponseAnswerSelect) => a.questionId === q.questionId);
        const isCorrect = ans && ans.selectedAnswer === q.question.answer;
        if (isCorrect) {
            correctAnswers += 1;
            calculatedScore += q.marks;
        }
        return {
            questionNumber: q.questionNumber,
            questionText: q.question.question_text,
            selectedAnswer: ans?.selectedAnswer ?? null,
            correctAnswer: q.question.answer ?? null,
            isCorrect: Boolean(isCorrect),
            marks: q.marks,
            timeSpent: null,
            topic: q.question.topic ?? 'General',
        };
    });

    const percentage = test.totalMarks > 0 ? (calculatedScore / test.totalMarks) * 100 : 0;
    const incorrect = perQuestion.filter((q: PerQuestion) => !q.isCorrect && q.selectedAnswer !== null).length;
    const unanswered = perQuestion.filter((q: PerQuestion) => q.selectedAnswer === null).length;

    const topicBuckets: Record<string, { total: number; correct: number }> = {};
    for (const q of perQuestion) {
        if (!topicBuckets[q.topic]) topicBuckets[q.topic] = { total: 0, correct: 0 };
        topicBuckets[q.topic].total += 1;
        if (q.isCorrect) topicBuckets[q.topic].correct += 1;
    }

    const pieData = {
        correct: correctAnswers,
        incorrect,
        unanswered,
    };

    const topics = Object.entries(topicBuckets).map(([topic, v]) => ({
        topic,
        accuracy: v.total ? (v.correct / v.total) * 100 : 0,
        total: v.total,
        correct: v.correct,
    }));

    const strongest = topics.sort((a, b) => b.accuracy - a.accuracy)[0]?.topic ?? 'N/A';
    const weakest = topics.sort((a, b) => a.accuracy - b.accuracy)[0]?.topic ?? 'N/A';

    const style = `
        <style>
            body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial; margin: 24px; }
            h1 { font-size: 22px; margin: 0 0 6px; }
            h2 { font-size: 16px; margin: 16px 0 8px; }
            .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
            .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
            .kv { font-size: 14px; }
            .kv b { font-size: 18px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; text-align: left; }
            .charts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
            .muted { color: #6b7280; font-size: 12px; }
            .bar { background:#4f46e5; height: 10px; border-radius: 4px; }
        </style>
    `;

    const pieTotal = pieData.correct + pieData.incorrect + pieData.unanswered || 1;
    const pieAngles = [pieData.correct, pieData.incorrect, pieData.unanswered].map((v) => (v / pieTotal) * 360);
    const [a1, a2] = [pieAngles[0], pieAngles[0] + pieAngles[1]];
    const svgPie = `
        <svg viewBox="0 0 32 32" width="160" height="160">
          <circle r="16" cx="16" cy="16" fill="#e5e7eb"/>
          <circle r="16" cx="16" cy="16" fill="transparent" stroke="#22c55e" stroke-width="32" stroke-dasharray="${(pieAngles[0] / 360) * 100} ${100 - (pieAngles[0] / 360) * 100}" transform="rotate(-90 16 16)"/>
          <circle r="16" cx="16" cy="16" fill="transparent" stroke="#ef4444" stroke-width="32" stroke-dasharray="${(pieAngles[1] / 360) * 100} ${100 - (pieAngles[1] / 360) * 100}" stroke-dashoffset="-${(pieAngles[0] / 360) * 100}" transform="rotate(-90 16 16)"/>
          <circle r="16" cx="16" cy="16" fill="transparent" stroke="#f59e0b" stroke-width="32" stroke-dasharray="${(pieAngles[2] / 360) * 100} ${100 - (pieAngles[2] / 360) * 100}" stroke-dashoffset="-${((pieAngles[0] + pieAngles[1]) / 360) * 100}" transform="rotate(-90 16 16)"/>
        </svg>`;

    const topicBars = topics
        .map((t) => `<div>
            <div class="muted">${t.topic} (${t.accuracy.toFixed(0)}%)</div>
            <div class="bar" style="width:${t.accuracy}%"></div>
        </div>`)
        .join('');

    const timeSeries = perQuestion
        .map((q: PerQuestion) => ({ x: q.questionNumber, y: typeof q.timeSpent === 'number' ? q.timeSpent : 0 }))
        .map((p: { x: number; y: number }) => `<div style="display:inline-block;width:8px;height:${Math.max(2, Math.min(120, p.y))}px;background:#06b6d4;margin-right:2px"></div>`) // simple bar proxy for time
        .join('');

    const detailRows = perQuestion
        .map((q: PerQuestion) => `<tr>
            <td>Q${q.questionNumber}</td>
            <td>${q.questionText}</td>
            <td>${q.selectedAnswer ?? '-'}</td>
            <td>${q.correctAnswer ?? '-'}</td>
            <td>${q.isCorrect ? '✔' : q.selectedAnswer === null ? '—' : '✖'}</td>
            <td>${q.marks}</td>
            <td>${q.topic}</td>
            <td>${q.timeSpent ?? '-'}</td>
        </tr>`)
        .join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>${style}</head><body>
        <h1>Student Performance Report</h1>
        <div class="muted">Test: ${test.title} • Student: ${response.student.name} (${response.student.rollNumber})</div>

        <div class="grid" style="margin-top:12px;">
            <div class="card kv">Score<br/><b>${calculatedScore}/${test.totalMarks}</b></div>
            <div class="card kv">Percentage<br/><b>${percentage.toFixed(1)}%</b></div>
            <div class="card kv">Correct Answers<br/><b>${correctAnswers}</b></div>
            <div class="card kv">Time Taken<br/><b>${response.timeTaken ?? '—'}</b></div>
        </div>

        <h2>Performance Visuals</h2>
        <div class="charts">
            <div class="card">
                <div class="muted">Correct vs Incorrect vs Unanswered</div>
                ${svgPie}
                <div class="muted" style="margin-top:6px;">Correct: ${pieData.correct} • Incorrect: ${pieData.incorrect} • Unanswered: ${pieData.unanswered}</div>
            </div>
            <div class="card">
                <div class="muted">Performance by Topic</div>
                ${topicBars}
            </div>
            <div class="card">
                <div class="muted">Time spent per question</div>
                <div style="height:140px; display:flex; align-items:flex-end;">${timeSeries}</div>
            </div>
        </div>

        <h2>Detailed Question Analysis</h2>
        <table>
            <thead><tr><th>Question</th><th>Text</th><th>Chosen</th><th>Correct</th><th>Status</th><th>Marks</th><th>Topic</th><th>Time</th></tr></thead>
            <tbody>${detailRows}</tbody>
        </table>

        <h2>Topic/Skill-Wise Performance</h2>
        <table>
            <thead><tr><th>Topic</th><th>Total</th><th>Correct</th><th>Accuracy %</th></tr></thead>
            <tbody>
                ${topics
                    .map(
                        (t) => `<tr><td>${t.topic}</td><td>${t.total}</td><td>${t.correct}</td><td>${t.accuracy.toFixed(1)}%</td></tr>`
                    )
                    .join('')}
            </tbody>
        </table>

        <h2>Key Insights</h2>
        <div class="card">
            <div class="muted">Strongest Topic: <b>${strongest}</b></div>
            <div class="muted">Weakest Topic: <b>${weakest}</b></div>
            <div class="muted">Focus Areas: Review questions from <b>${weakest}</b> and practice similar types.</div>
        </div>
    </body></html>`;

    const pdf = await htmlTopdfBlob(html);
    if (!pdf.data) {
        throw new Error(pdf.errorMessage || 'Failed to generate PDF');
    }
    return { data: pdf.data, filename: `${response.student.name}-${test.title}-report.pdf` };
};
