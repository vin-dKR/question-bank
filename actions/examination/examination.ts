'use server';

import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export interface StudentData {
    name: string;
    rollNumber: string;
    className: string;
    email?: string;
}

export interface StudentResponseData {
    testId: string;
    studentId: string;
    answers: { questionId: string; selectedAnswer: string }[];
    timeTaken?: number;
}

export interface TestAnalytics {
    testId: string;
    totalStudents: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    averagePercentage: number;
    questionAnalytics: {
        questionId: string;
        questionNumber: number;
        correctAnswers: number;
        totalAttempts: number;
        accuracy: number;
    }[];
    studentAnalytics: {
        studentId: string;
        studentName: string;
        rollNumber: string;
        className: string;
        score: number;
        percentage: number;
        correctAnswers: number;
        totalQuestions: number;
        timeTaken?: number;
    }[];
}

export const createStudent = async (data: StudentData) => {
    try {
        const student = await prisma.student.create({
            data: {
                name: data.name,
                rollNumber: data.rollNumber,
                className: data.className,
                email: data.email,
            },
        });

        return student;
    } catch (error) {
        console.error('Error creating student:', error);
        throw error instanceof Error ? error : new Error('Failed to create student');
    }
};

export const getStudents = async () => {
    try {
        const students = await prisma.student.findMany({
            orderBy: { name: 'asc' },
        });

        return students;
    } catch (error) {
        console.error('Error fetching students:', error);
        throw error instanceof Error ? error : new Error('Failed to fetch students');
    }
};

export const submitStudentResponse = async (data: StudentResponseData) => {
    try {
        // Get the test and questions with related Question data
        const test = await prisma.test.findUnique({
            where: { id: data.testId },
            include: {
                questions: {
                    orderBy: { questionNumber: 'asc' },
                    include: {
                        question: true, // Include the related Question model
                    },
                },
            },
        });

        if (!test) {
            throw new Error('Test not found');
        }

        // Calculate score
        let score = 0;
        const totalMarks = test.totalMarks;

        for (const answer of data.answers) {
            const testQuestion = test.questions.find(q => q.questionId === answer.questionId);
            if (testQuestion && testQuestion.question.answer === answer.selectedAnswer) {
                score += testQuestion.marks;
            }
        }

        const percentage = (score / totalMarks) * 100;

        // Create or update response
        const response = await prisma.studentResponse.upsert({
            where: {
                testId_studentId: {
                    testId: data.testId,
                    studentId: data.studentId,
                },
            },
            update: {
                answers: data.answers,
                score,
                totalMarks,
                percentage,
                timeTaken: data.timeTaken,
                submittedAt: new Date(),
            },
            create: {
                testId: data.testId,
                studentId: data.studentId,
                answers: data.answers,
                score,
                totalMarks,
                percentage,
                timeTaken: data.timeTaken,
            },
        });

        return response;
    } catch (error) {
        console.error('Error submitting response:', error);
        throw error instanceof Error ? error : new Error('Failed to submit response');
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

        // Verify test ownership and include related Question data
        const test = await prisma.test.findFirst({
            where: {
                id: testId,
                createdBy: user.id,
            },
            include: {
                questions: {
                    orderBy: { questionNumber: 'asc' },
                    include: {
                        question: true, // Include the related Question model
                    },
                },
                responses: {
                    include: {
                        student: true,
                    },
                },
            },
        });

        if (!test) {
            throw new Error('Test not found');
        }

        const responses = test.responses;
        const totalStudents = responses.length;

        if (totalStudents === 0) {
            return {
                testId,
                totalStudents: 0,
                averageScore: 0,
                highestScore: 0,
                lowestScore: 0,
                averagePercentage: 0,
                questionAnalytics: test.questions.map(q => ({
                    questionId: q.questionId,
                    questionNumber: q.questionNumber,
                    correctAnswers: 0,
                    totalAttempts: 0,
                    accuracy: 0,
                })),
                studentAnalytics: [],
            };
        }

        // Calculate overall statistics
        const scores = responses.map(r => r.score);
        const percentages = responses.map(r => r.percentage);

        const averageScore = scores.reduce((a, b) => a + b, 0) / totalStudents;
        const highestScore = Math.max(...scores);
        const lowestScore = Math.min(...scores);
        const averagePercentage = percentages.reduce((a, b) => a + b, 0) / totalStudents;

        // Calculate question analytics
        const questionAnalytics = test.questions.map(testQuestion => {
            let correctAnswers = 0;
            let totalAttempts = 0;

            for (const response of responses) {
                const answer = (response.answers as any[]).find(a => a.questionId === testQuestion.questionId);
                if (answer) {
                    totalAttempts++;
                    if (answer.selectedAnswer === testQuestion.question.answer) {
                        correctAnswers++;
                    }
                }
            }

            const accuracy = totalAttempts > 0 ? (correctAnswers / totalAttempts) * 100 : 0;

            return {
                questionId: testQuestion.questionId,
                questionNumber: testQuestion.questionNumber,
                correctAnswers,
                totalAttempts,
                accuracy,
            };
        });

        // Calculate student analytics
        const studentAnalytics = responses.map(response => {
            const correctAnswers = (response.answers as any[]).filter(answer => {
                const testQuestion = test.questions.find(q => q.questionId === answer.questionId);
                return testQuestion && testQuestion.question.answer === answer.selectedAnswer;
            }).length;

            return {
                studentId: response.studentId,
                studentName: response.student.name,
                rollNumber: response.student.rollNumber,
                className: response.student.className,
                score: response.score,
                percentage: response.percentage,
                correctAnswers,
                totalQuestions: test.questions.length,
                timeTaken: response.timeTaken || undefined,
            };
        });

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

export const getStudentResponses = async (testId: string) => {
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

        const responses = await prisma.studentResponse.findMany({
            where: { testId },
            include: {
                student: true,
            },
            orderBy: { submittedAt: 'desc' },
        });

        return responses;
    } catch (error) {
        console.error('Error fetching student responses:', error);
        throw error instanceof Error ? error : new Error('Failed to fetch student responses');
    }
};
