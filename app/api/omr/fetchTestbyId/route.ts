import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        if (!body || !body.testId) {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        const { testId } = body;

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
        // eslint-disable-next-line
    } catch (error: any) {
        console.error('Error saving student responses:', error);
        return NextResponse.json({ error: 'Failed to save student responses', details: error.message }, { status: 500 });
    }
}
