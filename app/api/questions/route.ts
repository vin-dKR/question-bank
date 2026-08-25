import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { handleCorsResponse, handleOptionsRequest } from "@/lib/cors";
import { AuthError, requireApiActor } from "@/lib/auth/guard";
import { clientIp, enforceRateLimit, RateLimitError } from "@/lib/ratelimit";
import { audit } from "@/lib/audit";

/**
 * SECURITY (docs/API_SECURITY.md):
 *
 * - GET now requires an actor (session OR Bearer $QUESTION_API_KEY) via
 *   requireApiActor, is org-scoped for user callers, and HARD-CAPS the page
 *   size. Previously it was unauthenticated with an attacker-controlled,
 *   uncapped `limit` — i.e. the whole bank (answers included) was one `curl`
 *   away. That was the product's single largest exfiltration hole.
 * - POST requires an actor too (any caller could otherwise insert rows).
 *
 * Note: CORS on this response is NOT a security control — it only governs
 * browser JS. A direct HTTP client (curl/requests) ignores it entirely, which
 * is exactly why auth + caps live here in the handler, not in the CORS layer.
 */

/** Hard ceiling on rows per request. Bulk pulls are additionally rate-limited. */
const MAX_PAGE_SIZE = 100;

function authFailure(request: NextRequest, error: AuthError) {
    const response = NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
    );
    if (error instanceof RateLimitError) {
        response.headers.set('Retry-After', String(error.retryAfterSeconds));
    }
    return handleCorsResponse(request, response);
}

export async function OPTIONS(request: NextRequest) {
    return handleOptionsRequest(request);
}

export async function GET(request: NextRequest) {
    try {
        const actor = await requireApiActor(request);

        // Rate limit keyed by the actor (user id, else IP for service tools).
        const rateKey =
            actor.kind === 'user' ? `user:${actor.user.userId}` : `svc:${clientIp(request)}`;
        await enforceRateLimit(actor.kind === 'user' ? 'read' : 'service', rateKey);

        const searchParams = request.nextUrl.searchParams;
        const subject = searchParams.get('subject');
        const exam = searchParams.get('exam');
        const type = searchParams.get('type');
        const search = searchParams.get('search');
        const page = Math.max(parseInt(searchParams.get('page') || '1') || 1, 1);
        const limit = Math.min(
            Math.max(parseInt(searchParams.get('limit') || '10') || 10, 1),
            MAX_PAGE_SIZE
        );
        const subject_name = searchParams.get('subject_name');
        const exam_name = searchParams.get('exam_name');
        const chapter = searchParams.get('chapter');
        const file_name = searchParams.get('file_name');

        // Field filters (note: `difficulty` was dropped — Question has no such
        // column, so the old filter could only ever throw at query time).
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filters: any = {};
        if (subject) filters['subject'] = subject;
        if (exam) filters['exam_name'] = exam;
        if (type) filters['question_type'] = type;
        if (subject_name) filters['subject'] = subject_name;
        if (exam_name) filters['exam_name'] = exam_name;
        if (chapter) filters['chapter'] = chapter;
        if (file_name) filters['file_name'] = file_name;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const andClauses: any[] = [filters];

        // Tenancy: a user sees the shared admin bank (organizationId === null)
        // plus their own org's uploads — never another org's private questions.
        // A service-token caller is one of our own tools and is trusted for all.
        if (actor.kind === 'user') {
            andClauses.push({
                OR: [
                    { organizationId: null },
                    ...(actor.user.organizationId
                        ? [{ organizationId: actor.user.organizationId }]
                        : []),
                ],
            });
        }

        // Add text search if provided
        if (search) {
            andClauses.push({
                OR: [
                    { question_text: { contains: search, mode: 'insensitive' } },
                    { options: { has: search } },
                ],
            });
        }

        const query = { AND: andClauses };

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Get questions with pagination
        const [questions, total] = await Promise.all([
            prisma.question.findMany({
                where: query,
                skip,
                take: limit,
                orderBy: { question_number: 'asc' }
            }),
            prisma.question.count({ where: query })
        ]);

        audit({
            event: 'question.read',
            actorType: actor.kind === 'user' ? 'user' : 'service',
            actorId: actor.kind === 'user' ? actor.user.userId : null,
            organizationId: actor.kind === 'user' ? actor.user.organizationId : null,
            ip: clientIp(request),
            endpoint: 'GET /api/questions',
            count: questions.length,
            meta: { page, limit, search: search ?? undefined },
        });

        const response = NextResponse.json({
            success: true,
            data: {
                questions,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit)
                }
            }
        });
        
        return handleCorsResponse(request, response);
    } catch (error) {
        if (error instanceof AuthError) return authFailure(request, error);

        console.error('Error fetching questions:', error);
        const response = NextResponse.json(
            { success: false, error: 'Failed to fetch questions' },
            { status: 500 }
        );

        return handleCorsResponse(request, response);
    }
}

export async function POST(request: NextRequest) {
    try {
        await requireApiActor(request);

        const body = await request.json();

        // Check if we're receiving an array of questions
        if (Array.isArray(body)) {
            const questions = [];
            const errors = [];

            // Process each question in the array
            for (const questionData of body) {
                try {
                    const {
                        question_number,
                        file_name,
                        question_text,
                        isQuestionImage,
                        question_image,
                        isOptionImage,
                        options,
                        option_images,
                        section_name,
                        question_type,
                        topic,
                        exam_name,
                        subject,
                        chapter,
                        answer
                    } = questionData;

                    // Validate required fields
                    if (!question_text) {
                        errors.push(`Question ${question_number}: Question text is required`);
                        continue;
                    }

                    const newQuestion = await prisma.question.create({
                        data: {
                            question_number,
                            file_name,
                            question_text,
                            isQuestionImage,
                            question_image,
                            isOptionImage,
                            options,
                            option_images,
                            section_name,
                            question_type,
                            topic,
                            exam_name,
                            subject,
                            chapter,
                            answer,
                            flagged: false
                        }
                    });

                    questions.push(newQuestion);

                    // eslint-disable-next-line
                } catch (err: any) {
                    errors.push(`Error processing question ${questionData.question_number || 'unknown'}: ${err.message}`);
                }
            }

            const response = NextResponse.json({
                success: true,
                count: questions.length,
                questions,
                errors: errors.length > 0 ? errors : undefined
            }, { status: 201 });
            
            return handleCorsResponse(request, response);
        } else {
            // Single question creation
            const {
                question_number,
                file_name,
                question_text,
                isQuestionImage,
                question_image,
                isOptionImage,
                options,
                option_images,
                section_name,
                question_type,
                topic,
                exam_name,
                subject,
                chapter,
                answer
            } = body;

            // Validate required fields
            if (!question_text) {
                const response = NextResponse.json(
                    { success: false, error: 'Question text is required' },
                    { status: 400 }
                );
                
                return handleCorsResponse(request, response);
            }

            const question = await prisma.question.create({
                data: {
                    question_number,
                    file_name,
                    question_text,
                    isQuestionImage,
                    question_image,
                    isOptionImage,
                    options,
                    option_images,
                    section_name,
                    question_type,
                    topic,
                    exam_name,
                    subject,
                    chapter,
                    answer,
                    flagged: false
                }
            });

            const response = NextResponse.json({ success: true, data: question }, { status: 201 });
            
            return handleCorsResponse(request, response);
        }
    } catch (error) {
        if (error instanceof AuthError) return authFailure(request, error);

        console.error('Error creating question:', error);
        const response = NextResponse.json(
            { success: false, error: 'Failed to create question' },
            { status: 500 }
        );
        
        return handleCorsResponse(request, response);
    }
} 
