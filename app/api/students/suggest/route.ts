import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AuthError } from '@/lib/auth/session';
import { requireApiActor } from '@/lib/auth/guard';
import { normalizeClassName } from '@/lib/examination/studentRoster';

/**
 * Roster lookup, used to fill in a student while scanning OMR sheets.
 *
 * SECURITY: this route had NO authentication and NO organization scoping. It ran
 * `findMany({ where: { name: { contains: query } } })` across the ENTIRE Student
 * table, so any unauthenticated caller could enumerate every student name, roll
 * number and class of every school on the platform. That is a straight PII leak,
 * and it gets materially worse the moment there is a second customer.
 *
 * It now requires a session (or the service token) and only ever returns rows
 * belonging to the caller's own organization.
 *
 * Two query shapes:
 *   ?query=...              fuzzy match on name (autocomplete)
 *   ?className=10A          the whole roster for a class, for roster-driven entry
 */
export async function GET(request: Request) {
    try {
        const actor = await requireApiActor(request);

        // A service token has no organization of its own, so it gets nothing
        // here rather than everything — this endpoint is roster PII.
        if (actor.kind !== 'user' || !actor.user.organizationId) {
            return NextResponse.json({ students: [] }, { status: 200 });
        }
        const organizationId = actor.user.organizationId;

        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query')?.trim();
        const className = searchParams.get('className')?.trim();

        if (!query && !className) {
            return NextResponse.json({ students: [] }, { status: 200 });
        }

        const students = await prisma.student.findMany({
            where: {
                organizationId,
                ...(className ? { className: normalizeClassName(className) } : {}),
                ...(query ? { name: { contains: query, mode: 'insensitive' } } : {}),
            },
            select: {
                id: true,
                name: true,
                rollNumber: true,
                className: true,
            },
            orderBy: { rollNumber: 'asc' },
            // A full class roster is the point of the className query, so it
            // needs more headroom than an autocomplete dropdown.
            take: className ? 200 : 10,
        });

        return NextResponse.json({ students }, { status: 200 });
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error('Error fetching student suggestions:', error);
        return NextResponse.json({ error: 'Failed to fetch student suggestions' }, { status: 500 });
    }
}
