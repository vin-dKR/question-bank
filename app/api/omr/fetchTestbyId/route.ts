import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AuthError } from '@/lib/auth/session';
import { requireApiActor } from '@/lib/auth/guard';

/**
 * Returns a test with its questions for the OMR checker satellite.
 *
 * SECURITY: this route had NO authentication. It took a testId from the request
 * body and returned the entire test INCLUDING every question and its answer key
 * (`testAnswers: true`) to any caller at all. Post a test id, get the answers —
 * for any test belonging to any teacher at any school.
 *
 * It now requires a session or the QUESTION_API_KEY bearer token, verifies the
 * test belongs to the caller's organization, and no longer returns answer keys
 * to session callers who don't own the test.
 */

export async function POST(request: Request) {
    try {
        const body = await request.json();
        if (!body || !body.testId) {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        const { testId } = body;

        const actor = await requireApiActor(request);

        const testObject = await prisma.test.findUnique({
            where: {
                id: testId
            },
            include: {
                questions: {
                    include: {
                        question: {
                            include: {
                                testAnswers: true
                            }
                        }
                    }
                }
            }
        })

        if (!testObject) {
            return NextResponse.json({ error: 'Test not found' }, { status: 404 });
        }

        // Tenancy check. A service token (the OMR satellite) is trusted for any
        // test; a signed-in user may only read a test their own organization
        // owns. Without this, one teacher can pull another school's answer key.
        if (actor.kind === 'user' && testObject.organizationId !== actor.user.organizationId) {
            return NextResponse.json(
                { error: 'That test belongs to another organization.' },
                { status: 403 }
            );
        }

        const headers = {
            "Access-Control-Allow-Origin": "https://omr-checker.vercel.app", // Or specify your origin: "http://localhost:5173"
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        };
        return NextResponse.json({
            message: 'Student responses saved successfully',
            status: 200,
            data: testObject
        }, { headers });
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error('Error fetching test:', error);
        return NextResponse.json({ error: 'Failed to fetch test' }, { status: 500 });
    }
}
