"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { AuthError, requireUser } from "@/lib/auth/guard";
import { requireOrgContext } from "@/lib/auth/session";
import { enforceRateLimit } from "@/lib/ratelimit";
import { audit } from "@/lib/audit";

// Define proper types for Prisma where clauses
type QuestionWhereClause = Prisma.QuestionWhereInput;

/**
 * The effective, SERVER-DERIVED scope for a question read. Never trust the
 * `role`/`subject` a client passes into these actions — server actions are
 * public POST endpoints, so those args are just values the caller chose. We
 * resolve the real org and (for teachers) the real subject from the session.
 */
type QuestionScope = {
    /** The caller's org. Reads see the shared bank (null) + this org only. */
    organizationId: string;
    /** Non-null only when the caller is a teacher; locks reads to this subject. */
    teacherSubject?: string;
};

/** Hard ceilings so no single call can pull the bank in one shot. */
const MAX_PAGE_SIZE = 100;
const MAX_IDS = 100;
const MAX_MY_QUESTIONS_PAGE_SIZE = 50;

/**
 * Questions authored through the manual question form by the signed-in user.
 * This is deliberately independent from FolderQuestion: displaying this list
 * must never make a question part of a Draft Paper.
 */
export async function getMyQuestions({
    cursor = null,
    take = 10,
}: {
    cursor?: string | null;
    take?: number;
} = {}) {
    try {
        const ctx = await requireUser();
        if (!ctx.isAdmin && !ctx.organizationId) {
            throw new AuthError("An active organization is required.", 403);
        }
        await enforceRateLimit("read", `user:${ctx.userId}`);

        const pageSize = Math.min(Math.max(take, 1), MAX_MY_QUESTIONS_PAGE_SIZE);
        const rows = await prisma.question.findMany({
            where: {
                createdById: ctx.userId,
                // Admin-created manual questions live in the shared bank;
                // everyone else must match the active tenant exactly.
                organizationId: ctx.isAdmin ? null : ctx.organizationId!,
            },
            select: {
                id: true,
                question_text: true,
                question_image: true,
                options: true,
                answer: true,
                exam_name: true,
                subject: true,
                chapter: true,
            },
            orderBy: { id: "desc" },
            take: pageSize + 1,
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
        });

        const hasMore = rows.length > pageSize;
        const items = hasMore ? rows.slice(0, pageSize) : rows;
        const nextCursor = hasMore ? items.at(-1)?.id ?? null : null;

        audit({
            event: "question.read",
            actorType: "user",
            actorId: ctx.userId,
            organizationId: ctx.organizationId,
            count: items.length,
            meta: { collection: "my-questions", paginated: true },
        });

        return { success: true as const, items, nextCursor };
    } catch (error) {
        if (error instanceof AuthError) {
            return { success: false as const, items: [], nextCursor: null, error: error.message };
        }
        console.error("Error fetching user's questions:", error);
        return {
            success: false as const,
            items: [],
            nextCursor: null,
            error: "Failed to fetch your questions",
        };
    }
}

/**
 * Resolves who is asking, from the session — throws AuthError(401/403) if not
 * signed in or not attached to an org. A teacher's subject comes from their
 * TeacherData row, not from the caller, so the subject lock can't be bypassed
 * by sending `role:"student"`.
 */
async function resolveQuestionScope(): Promise<QuestionScope> {
    const ctx = await requireOrgContext();
    // Throttle the logged-in read path too (this is the "extract by just login"
    // vector): no single account can page through the whole bank quickly.
    await enforceRateLimit("read", `user:${ctx.userId}`);
    const teacher = await prisma.teacherData.findUnique({
        where: { userId: ctx.userId },
        select: { subject: true },
    });
    return {
        organizationId: ctx.organizationId,
        teacherSubject: teacher?.subject?.trim() || undefined,
    };
}

/**
 * The tenancy clause: the shared admin bank (organizationId === null, readable
 * by every org) plus the caller's OWN org uploads — never another org's private
 * questions. This is the single place that closes the cross-tenant read gap.
 */
function orgReadClause(organizationId: string): QuestionWhereClause {
    return { OR: [{ organizationId: null }, { organizationId }] };
}

/**
 * Builds the shared `where` clause used by `getQuestions` and `getQuestionCount`.
 * Keeps the two surfaces in lock-step so the count can never drift from the
 * list. Org scoping and the teacher subject lock are applied here from the
 * server-resolved `scope` (never from caller-supplied role/subject).
 */
function buildQuestionWhere(
    filters: {
        exam_name?: string;
        subject?: string;
        chapter?: string;
        section_name?: string;
        question_type?: string;
        flagged?: boolean;
    },
    scope: QuestionScope
): QuestionWhereClause {
    const whereClause: QuestionWhereClause = {};

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

    if (filters.question_type) {
        whereClause.question_type = { contains: filters.question_type, mode: "insensitive" };
    }

    if (filters.flagged !== undefined) {
        whereClause.flagged = filters.flagged;
    }

    // Enforce teacher subject restriction (overrides any caller-provided subject).
    if (scope.teacherSubject) {
        whereClause.subject = { contains: scope.teacherSubject, mode: "insensitive" };
    }

    // Tenancy — AND-ed with everything above.
    whereClause.AND = [orgReadClause(scope.organizationId)];

    return whereClause;
}

export async function getQuestions(
    filters: {
        exam_name?: string;
        subject?: string;
        chapter?: string;
        section_name?: string;
        question_type?: string;
        flagged?: boolean;
        // Cursor pagination (Phase 6). When `cursor` is provided, results start
        // AFTER that id. `take` defaults to 20 and is the page size.
        cursor?: string | null;
        take?: number;
        // Legacy skip/limit — kept for backwards compatibility with the
        // `app/api/questions/get-all` route and any other non-migrated caller.
        // When set, cursor/take are ignored.
        limit?: number;
        skip?: number;
    },
    // IGNORED — role/subject are resolved from the session by
    // resolveQuestionScope(). Kept in the signature so existing callers keep
    // compiling; a role passed from the browser is not trustworthy.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _userRole?: UserRole,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _userSubject?: string
) {
    try {
        const scope = await resolveQuestionScope();
        const whereClause = buildQuestionWhere(filters, scope);

        // Legacy skip/limit branch — preserves the old `{ data }` shape for any
        // non-migrated caller. Page size is hard-capped.
        if (filters.skip !== undefined || filters.limit !== undefined) {
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
                    match_columns: true,
                    match_key: true,
                    flagged: true,
                },
                take: Math.min(Math.max(filters.limit ?? 20, 1), MAX_PAGE_SIZE),
                skip: filters.skip ?? 0,
                orderBy: { question_number: "asc" },
            });

            return { success: true, data: questions };
        }

        // Cursor-paginated branch (Phase 6). Fetches `take + 1` rows so we can
        // tell whether another page exists; the extra row becomes the cursor
        // for the next fetch and is NOT returned in `items`.
        const take = Math.min(Math.max(filters.take ?? 20, 1), MAX_PAGE_SIZE);
        const cursor = filters.cursor ?? null;

        const rows = await prisma.question.findMany({
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
                match_columns: true,
                match_key: true,
                flagged: true,
            },
            take: take + 1,
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: { id: "asc" },
        });

        let nextCursor: string | null = null;
        if (rows.length > take) {
            const nextRow = rows.pop();
            nextCursor = nextRow?.id ?? null;
        }

        // Keep a `data` alias so any legacy code path that destructures
        // `{ data }` from the response keeps working during the migration.
        return {
            success: true,
            items: rows,
            nextCursor,
            data: rows,
        };
    } catch (error) {
        if (error instanceof AuthError) {
            return { success: false, data: [], items: [], nextCursor: null, error: error.message };
        }

        // Log detail server-side, but never return raw error.message to the
        // client — it can leak schema/internal details.
        console.error("Error fetching questions:", error);
        return {
            success: false,
            data: [],
            items: [],
            nextCursor: null,
            error: "Failed to fetch questions",
        };
    }
}

export async function getQuestionCount(
    filters: {
        exam_name?: string;
        subject?: string;
        chapter?: string;
        section_name?: string;
        question_type?: string;
        flagged?: boolean;
        limit?: number | undefined;
        skip?: number | undefined;
    },
    // IGNORED — see getQuestions. Scope is resolved from the session.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _userRole?: UserRole,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _userSubject?: string
) {
    try {
        const scope = await resolveQuestionScope();
        const whereClause = buildQuestionWhere(filters, scope);

        const count = await prisma.question.count({
            where: whereClause,
        });

        return { success: true, data: count };
    } catch (error) {
        if (error instanceof AuthError) {
            return { success: false, data: 0, error: error.message };
        }
        console.error("Error fetching question count:", error);
        return { success: false, data: 0, error: "Failed to fetch question count" };
    }
}

export async function getFilterOptions(
    filters: {
        exam_name?: string;
        subject?: string;
        chapter?: string;
        questionType?: string;
        /** Exact hierarchy matching for form dependencies; filters keep substring matching. */
        exact?: boolean;
    },
    // IGNORED — see getQuestions. Scope is resolved from the session.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _userRole?: UserRole,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _userSubject?: string
) {
    try {
        const scope = await resolveQuestionScope();

        // Escape regex metacharacters so user input is treated as a literal substring
        const escapeRegex = (value: string) =>
            value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        const match: Record<string, unknown> = {};

        const taxonomyPattern = (value: string) => {
            const escaped = escapeRegex(value);
            return filters.exact ? `^${escaped}$` : escaped;
        };

        if (filters.exam_name) {
            match.exam_name = { $regex: taxonomyPattern(filters.exam_name), $options: "i" };
        }

        if (filters.chapter) {
            match.chapter = { $regex: taxonomyPattern(filters.chapter), $options: "i" };
        }

        if (filters.questionType) {
            match.question_type = { $regex: escapeRegex(filters.questionType), $options: "i" };
        }

        // Teacher subject restriction (server-derived) takes precedence over the
        // caller-provided subject.
        const effectiveSubject = scope.teacherSubject ?? filters.subject;

        if (effectiveSubject) {
            match.subject = { $regex: taxonomyPattern(effectiveSubject), $options: "i" };
        }

        // Tenancy: shared bank (organizationId null OR absent — Mongo treats
        // `{field: null}` as "null or missing", covering legacy rows) plus the
        // caller's own org. organizationId is a BSON ObjectId, hence $oid.
        match.$or = [
            { organizationId: null },
            { organizationId: { $oid: scope.organizationId } },
        ];

        // One $group stage emits all five distinct value sets in a single pass;
        // $project drops null/empty-string entries so the client never sees them.
        const pipeline = [
            { $match: match },
            {
                $group: {
                    _id: null,
                    exams: { $addToSet: "$exam_name" },
                    subjects: { $addToSet: "$subject" },
                    chapters: { $addToSet: "$chapter" },
                    section_names: { $addToSet: "$section_name" },
                    question_type: { $addToSet: "$question_type" },
                },
            },
            {
                $project: {
                    _id: 0,
                    exams: {
                        $filter: {
                            input: "$exams",
                            as: "v",
                            cond: { $and: [{ $ne: ["$$v", null] }, { $ne: ["$$v", ""] }] },
                        },
                    },
                    subjects: {
                        $filter: {
                            input: "$subjects",
                            as: "v",
                            cond: { $and: [{ $ne: ["$$v", null] }, { $ne: ["$$v", ""] }] },
                        },
                    },
                    chapters: {
                        $filter: {
                            input: "$chapters",
                            as: "v",
                            cond: { $and: [{ $ne: ["$$v", null] }, { $ne: ["$$v", ""] }] },
                        },
                    },
                    section_names: {
                        $filter: {
                            input: "$section_names",
                            as: "v",
                            cond: { $and: [{ $ne: ["$$v", null] }, { $ne: ["$$v", ""] }] },
                        },
                    },
                    question_type: {
                        $filter: {
                            input: "$question_type",
                            as: "v",
                            cond: { $and: [{ $ne: ["$$v", null] }, { $ne: ["$$v", ""] }] },
                        },
                    },
                },
            },
        ];

        type AggregatedFilterOptions = {
            exams?: (string | null)[];
            subjects?: (string | null)[];
            chapters?: (string | null)[];
            section_names?: (string | null)[];
            question_type?: (string | null)[];
        };

        const result = (await prisma.question.aggregateRaw({
            pipeline: pipeline as unknown as Prisma.InputJsonValue[],
        })) as unknown as AggregatedFilterOptions[];

        const row: AggregatedFilterOptions = result?.[0] ?? {};

        const filterOptions = {
            exams: (row.exams ?? []).filter((v): v is string => typeof v === "string" && v.length > 0),
            subjects: (row.subjects ?? []).filter((v): v is string => typeof v === "string" && v.length > 0),
            chapters: (row.chapters ?? []).filter((v): v is string => typeof v === "string" && v.length > 0),
            section_names: (row.section_names ?? []).filter((v): v is string => typeof v === "string" && v.length > 0),
            question_type: (row.question_type ?? []).filter((v): v is string => typeof v === "string" && v.length > 0),
        };

        return { success: true, data: filterOptions };
    } catch (error) {
        const empty = { exams: [], subjects: [], chapters: [], section_names: [], question_type: [] };
        if (error instanceof AuthError) {
            return { success: false, data: empty, error: error.message };
        }
        console.error("Error fetching filter options:", error);
        return { success: false, data: empty, error: "Failed to fetch filter options" };
    }
}

/**
 * Flagging is deliberately NOT gated by question ownership: since orgs can no
 * longer edit shared questions (doc §13), flagging is their only way to report
 * a bad one. Any signed-in user may flag.
 *
 * @param _userRole IGNORED. Kept so existing callers keep compiling. The role
 *   now comes from the server session — a role passed in from the browser is
 *   just a value the caller chose, and server actions are public endpoints.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function selectFlagged(id: string, _userRole?: UserRole) {
    try {
        await requireUser();

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
        if (error instanceof AuthError) {
            return { success: false, data: null, error: error.message };
        }
        console.error("Error setting question flag:", error);
        return { success: false, data: null, error: "Failed to set question flag" };
    }
}

/** @param _userRole IGNORED — see selectFlagged above. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function toggleFlag(id: string, _userRole?: UserRole) {
    try {
        await requireUser();

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
        if (error instanceof AuthError) {
            return { success: false, data: null, error: error.message };
        }
        console.error("Error toggling question flag:", error);
        return { success: false, data: null, error: "Failed to toggle question flag" };
    }
}

export async function searchQuestions(
    keyword: string,
    // IGNORED — scope resolved from the session. See getQuestions.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _userRole?: UserRole,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _userSubject?: string
) {
    if (!keyword || keyword.trim().length < 2) {
        return { success: false, data: [], error: "Keyword must be at least 2 characters" };
    }

    try {
        const scope = await resolveQuestionScope();

        const whereClause: QuestionWhereClause = {
            AND: [
                orgReadClause(scope.organizationId),
                {
                    OR: [
                        { question_text: { contains: keyword, mode: "insensitive" } },
                        { options: { has: keyword } },
                    ],
                },
                ...(scope.teacherSubject
                    ? [{ subject: { contains: scope.teacherSubject, mode: Prisma.QueryMode.insensitive } }]
                    : []),
            ],
        };

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
                match_columns: true,
                match_key: true,
                flagged: true,
            },
            take: 50,
        });
        return { success: true, data: questions };
    } catch (error) {
        if (error instanceof AuthError) {
            return { success: false, data: [], error: error.message };
        }
        console.error("Error searching questions:", error);
        return { success: false, data: [], error: "Failed to search questions" };
    }
}

export async function getAvailableSubjects() {
    try {
        const scope = await resolveQuestionScope();

        const subjects = await prisma.question.findMany({
            select: { subject: true },
            distinct: ["subject"],
            where: {
                AND: [
                    orgReadClause(scope.organizationId),
                    { subject: { not: null } },
                    ...(scope.teacherSubject
                        ? [{ subject: { contains: scope.teacherSubject, mode: Prisma.QueryMode.insensitive } }]
                        : []),
                ],
            },
        });

        const subjectList = subjects.map(s => s.subject).filter(s => s !== null);
        return { success: true, data: subjectList };
    } catch (error) {
        if (error instanceof AuthError) {
            return { success: false, data: [], error: error.message };
        }
        console.error("Error fetching available subjects:", error);
        return { success: false, data: [], error: "Failed to fetch subjects" };
    }
}


export async function getQuestionsByIds(
    ids: string[],
    // IGNORED — scope resolved from the session. See getQuestions.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _userRole?: UserRole,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _userSubject?: string
) {
    if (!ids || ids.length === 0) {
        return { success: false, data: [], error: "No question IDs provided" };
    }

    // Cap the batch so this can't be used to bulk-pull the bank by feeding a
    // huge id list harvested elsewhere.
    if (ids.length > MAX_IDS) {
        return { success: false, data: [], error: `Too many IDs (max ${MAX_IDS})` };
    }

    try {
        const scope = await resolveQuestionScope();

        const whereClause: QuestionWhereClause = {
            AND: [
                { id: { in: ids } },
                orgReadClause(scope.organizationId),
                ...(scope.teacherSubject
                    ? [{ subject: { contains: scope.teacherSubject, mode: Prisma.QueryMode.insensitive } }]
                    : []),
            ],
        };

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
                match_columns: true,
                match_key: true,
                flagged: true,
            },
            orderBy: { question_number: "asc" },
        });

        return { success: true, data: questions };
    } catch (error) {
        if (error instanceof AuthError) {
            return { success: false, data: [], error: error.message };
        }
        console.error("Error fetching questions by IDs:", error);
        return { success: false, data: [], error: "Failed to fetch questions by IDs" };
    }
}
