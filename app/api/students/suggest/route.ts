import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('query');

        if (!query) {
            return NextResponse.json({ students: [] }, { status: 200 });
        }

        const students = await prisma.student.findMany({
            where: {
                name: {
                    contains: query,
                    mode: 'insensitive',
                },
            },
            select: { // Explicitly select the fields you need
                id: true,
                name: true,
                rollNumber: true,
                className: true,
            },
            take: 10, // Limit the number of suggestions
        });

        return NextResponse.json({ students }, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching student suggestions:', error);
        return NextResponse.json({ error: 'Failed to fetch student suggestions', details: error.message }, { status: 500 });
    }
}
