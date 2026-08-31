import { NextResponse } from 'next/server';
import { readGeneratedOmrDraftPdf, type OmrDraftInput } from '@/lib/omr/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parseDraftInput(value: unknown): OmrDraftInput {
    if (!value || typeof value !== 'object') throw new Error('Invalid OMR preview request');

    const body = value as Record<string, unknown>;
    if (!Array.isArray(body.questions)) throw new Error('Questions must be an array');

    return {
        paperId: typeof body.paperId === 'string' ? body.paperId : '',
        examName: typeof body.examName === 'string' ? body.examName : '',
        subject: typeof body.subject === 'string' ? body.subject : '',
        durationMin: typeof body.durationMin === 'number' ? Math.trunc(body.durationMin) : 0,
        maxMarks: typeof body.maxMarks === 'number' ? body.maxMarks : 0,
        questions: body.questions.map((value, index) => {
            if (!value || typeof value !== 'object') {
                throw new Error(`Question ${index + 1} is invalid`);
            }
            const question = value as Record<string, unknown>;
            return {
                no: typeof question.no === 'number' ? Math.trunc(question.no) : 0,
                optionCount: typeof question.optionCount === 'number' ? Math.trunc(question.optionCount) : 0,
                questionType: typeof question.questionType === 'string' ? question.questionType : null,
            };
        }),
    };
}

export async function POST(request: Request) {
    try {
        const input = parseDraftInput(await request.json());
        const { pdf, summary } = await readGeneratedOmrDraftPdf(input);

        return new NextResponse(new Uint8Array(pdf), {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'inline; filename="omr-preview.pdf"',
                'Cache-Control': 'no-store',
                'X-OMR-Page-Count': String(summary.page_count),
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to generate OMR preview';
        const status = message === 'Unauthorized' ? 401 : 400;
        return NextResponse.json({ error: message }, { status });
    }
}
