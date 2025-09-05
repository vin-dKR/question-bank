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

        return NextResponse.json({
            message: 'Student responses saved successfully',
            status: 200,
            data: testObject
        });
    } catch (error: any) {
        console.error('Error saving student responses:', error);
        return NextResponse.json({ error: 'Failed to save student responses', details: error.message }, { status: 500 });
    }
}
