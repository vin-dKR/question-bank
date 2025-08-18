"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";

// Define proper types for Prisma where clauses
type QuestionWhereClause = Prisma.QuestionWhereInput;

export async function getQuestions(
    filters: {
        exam_name?: string;
        subject?: string;
        chapter?: string;
        section_name?: string;
        flagged?: boolean;
        limit?: number;
        skip?: number;
    },
    userRole: UserRole,
    userSubject?: string
) {
    try {
        let whereClause: QuestionWhereClause = {};

        if (filters.exam_name) {
            whereClause.exam_name = { contains: filters.exam_name, mode: "insensitive" };
        }

        if (filters.subject) {
            whereClause.subject = { equals: filters.subject, mode: "insensitive" };
        }

        if (filters.chapter) {
            whereClause.chapter = { contains: filters.chapter, mode: "insensitive" };
        }

        if (filters.section_name) {
            whereClause.section_name = { equals: filters.section_name };
        }

        if (filters.flagged !== undefined) {
            whereClause.flagged = filters.flagged;
        }

        // Enforce teacher subject restriction
        if (userRole === "teacher" && userSubject) {
            whereClause.subject = { contains: userSubject, mode: "insensitive" };
        }

        {/*
            console.log('getQuestions - Filters received:', filters);
            console.log('getQuestions - User role:', userRole, 'userSubject:', userSubject);
            console.log('getQuestions - Final whereClause:', JSON.stringify(whereClause, null, 2));
        */}


        const questions = await prisma.question.findMany({
            where: whereClause,
            select: {
                id: true,
                question_text: true,
                question_image: true,
                options: true,
                option_images: true,
                answer: true,
                isOptionImage: true,
                exam_name: true,
                subject: true,
                chapter: true,
                section_name: true,
                flagged: true,
            },
            take: filters.limit || 20,
            skip: filters.skip || 0,
            orderBy: { question_number: "asc" },
        });

        console.log('getQuestions - Query result count:', questions.length);
        if (questions.length > 0) {
            console.log('getQuestions - Sample question section_name:', questions[0].section_name);
        }

        return { success: true, data: questions };
    } catch (error) {
        console.error("Error fetching questions:", error);

        // Provide more detailed error information
        let errorMessage = "Failed to fetch questions";
        if (error instanceof Error) {
            errorMessage = `Failed to fetch questions: ${error.message}`;
        } else if (typeof error === 'string') {
            errorMessage = `Failed to fetch questions: ${error}`;
        } else if (error && typeof error === 'object' && 'message' in error) {
            errorMessage = `Failed to fetch questions: ${(error as any).message}`;
        }

        console.error("Detailed error info:", {
            error,
            errorType: typeof error,
            errorMessage,
            filters,
            userRole,
            userSubject
        });

        return { success: false, data: [], error: errorMessage };
    }
}

export async function getQuestionCount(
    filters: {
        exam_name?: string;
        subject?: string;
        chapter?: string;
        section_name?: string;
        flagged?: boolean;
    },
    userRole: UserRole,
    userSubject?: string
) {
    try {
        let whereClause: QuestionWhereClause = {};

        if (filters.exam_name) {
            whereClause.exam_name = { contains: filters.exam_name, mode: "insensitive" };
        }

        if (filters.subject) {
            whereClause.subject = { contains: filters.subject, mode: "insensitive" };
        }

        if (filters.chapter) {
            whereClause.chapter = { contains: filters.chapter, mode: "insensitive" };
        }

        if (filters.section_name) {
            whereClause.section_name = { equals: filters.section_name };
        }

        if (filters.flagged !== undefined) {
            whereClause.flagged = filters.flagged;
        }

        // Enforce teacher subject restriction
        if (userRole === "teacher" && userSubject) {
            whereClause.subject = { contains: userSubject, mode: "insensitive" };
        }

        {/*
        console.log('getQuestionCount - Filters received:', filters);
        console.log('getQuestionCount - User role:', userRole, 'userSubject:', userSubject);
        console.log('getQuestionCount - Final whereClause:', JSON.stringify(whereClause, null, 2));
        */}

        const count = await prisma.question.count({
            where: whereClause,
        });

        console.log('getQuestionCount - Count result:', count);

        return { success: true, data: count };
    } catch (error) {
        console.error("Error fetching question count:", error);

        // Provide more detailed error information
        let errorMessage = "Failed to fetch question count";
        if (error instanceof Error) {
            errorMessage = `Failed to fetch question count: ${error.message}`;
        } else if (typeof error === 'string') {
            errorMessage = `Failed to fetch question count: ${error}`;
        } else if (error && typeof error === 'object' && 'message' in error) {
            errorMessage = `Failed to fetch question count: ${(error as any).message}`;
        }

        console.error("Detailed error info for count:", {
            error,
            errorType: typeof error,
            errorMessage,
            filters,
            userRole,
            userSubject
        });

        return { success: false, data: 0, error: errorMessage };
    }
}

export async function getFilterOptions(
    filters: {
        exam_name?: string;
        subject?: string;
        chapter?: string;
    },
    userRole: UserRole,
    userSubject?: string
) {
    try {
        let whereClause: QuestionWhereClause = {};

        if (filters.exam_name) {
            whereClause.exam_name = { contains: filters.exam_name, mode: "insensitive" };
        }

        if (filters.subject) {
            whereClause.subject = { contains: filters.subject, mode: "insensitive" };
        }

        if (filters.chapter) {
            whereClause.chapter = { contains: filters.chapter, mode: "insensitive" };
        }

        // Enforce teacher subject restriction
        if (userRole === "teacher" && userSubject) {
            whereClause.subject = { contains: userSubject, mode: "insensitive" };
        }

        const [exams, subjects, chapters, sections] = await Promise.all([
            prisma.question.findMany({
                where: whereClause,
                select: { exam_name: true },
                distinct: ["exam_name"],
            }),
            prisma.question.findMany({
                where: whereClause,
                select: { subject: true },
                distinct: ["subject"],
            }),
            prisma.question.findMany({
                where: whereClause,
                select: { chapter: true },
                distinct: ["chapter"],
            }),
            prisma.question.findMany({
                where: whereClause,
                select: { section_name: true },
                distinct: ["section_name"],
            }),
        ]);

        const filterOptions = {
            exams: exams.map((e) => e.exam_name).filter(Boolean) as string[],
            subjects: subjects.map((s) => s.subject).filter(Boolean) as string[],
            chapters: chapters.map((c) => c.chapter).filter(Boolean) as string[],
            section_names: sections.map((s) => s.section_name).filter(Boolean) as string[],
        };

        console.log("filterOptions----------------", filterOptions)

        return { success: true, data: filterOptions };
    } catch (error) {
        console.error("Error fetching filter options:", error);
        return {
            success: false,
            data: { exams: [], subjects: [], chapters: [], section_names: [] },
            error: "Failed to fetch filter options",
        };
    }
}

export async function selectFlagged(id: string, userRole: UserRole) {
    try {
        if (userRole !== "coaching") {
            return { success: false, data: null, error: "Only coaching can flag questions" };
        }

        const question = await prisma.question.update({
            where: { id },
            data: { flagged: true },
            select: {
                id: true,
                flagged: true,
            },
        });
        return { success: true, data: question };
    } catch (error) {
        console.error("Error setting question flag:", error);
        return { success: false, data: null, error: "Failed to set question flag" };
    }
}

export async function toggleFlag(id: string, userRole: UserRole) {
    try {
        if (userRole !== "coaching") {
            return { success: false, data: null, error: "Only coaching can toggle question flags" };
        }
        const question = await prisma.question.findUnique({
            where: { id },
            select: { flagged: true },
        });

        if (!question) {
            throw new Error("Question not found");
        }

        const updatedQuestion = await prisma.question.update({
            where: { id },
            data: {
                flagged: !question.flagged,
            },
            select: {
                id: true,
                flagged: true,
            },
        });
        return { success: true, data: updatedQuestion };
    } catch (error) {
        console.error("Error toggling question flag:", error);
        return { success: false, data: null, error: "Failed to toggle question flag" };
    }
}

export async function searchQuestions(keyword: string, userRole: UserRole, userSubject?: string) {
    if (!keyword || keyword.trim().length < 2) {
        return { success: false, data: [], error: "Keyword must be at least 2 characters" };
    }

    try {
        let whereClause: QuestionWhereClause = {
            OR: [
                { question_text: { contains: keyword, mode: "insensitive" } },
                { options: { has: keyword } },
            ],
        };

        if (userRole === "teacher" && userSubject) {
            whereClause.subject = { contains: userSubject, mode: "insensitive" };
        }

        const questions = await prisma.question.findMany({
            where: whereClause,
            select: {
                id: true,
                question_text: true,
                question_image: true,
                options: true,
                option_images: true,
                answer: true,
                isOptionImage: true,
                exam_name: true,
                subject: true,
                chapter: true,
                section_name: true,
                flagged: true,
            },
            take: 50,
        });
        return { success: true, data: questions };
    } catch (error) {
        console.error("Error searching questions:", error);
        return { success: false, data: [], error: "Failed to search questions" };
    }
}

export async function getAvailableSubjects() {
    try {
        const subjects = await prisma.question.findMany({
            select: { subject: true },
            distinct: ["subject"],
            where: {
                subject: { not: null },
            },
        });

        const subjectList = subjects.map(s => s.subject).filter(s => s !== null);
        console.log('Debug - Available subjects in database:', subjectList);
        return { success: true, data: subjectList };
    } catch (error) {
        console.error("Error fetching available subjects:", error);
        return { success: false, data: [], error: "Failed to fetch subjects" };
    }
}


export async function getQuestionsByIds(ids: string[], userRole: UserRole, userSubject?: string) {
    if (!ids || ids.length === 0) {
        return { success: false, data: [], error: "No question IDs provided" };
    }

    try {
        let whereClause: QuestionWhereClause = {
            id: { in: ids },
        };

        // Enforce teacher subject restriction
        if (userRole === "teacher" && userSubject) {
            whereClause.subject = { contains: userSubject, mode: "insensitive" };
        }

        const questions = await prisma.question.findMany({
            where: whereClause,
            select: {
                id: true,
                question_text: true,
                question_image: true,
                options: true,
                option_images: true,
                answer: true,
                isOptionImage: true,
                exam_name: true,
                subject: true,
                chapter: true,
                section_name: true,
                flagged: true,
            },
            orderBy: { question_number: "asc" },
        });

        return { success: true, data: questions };
    } catch (error) {
        console.error("Error fetching questions by IDs:", error);
        return { success: false, data: [], error: "Failed to fetch questions by IDs" };
    }
}
