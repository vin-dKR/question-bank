import { NextResponse } from 'next/server';
import { readGeneratedOmrPdf } from '@/lib/omr/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
    params: Promise<{ testId: string }>;
}

export async function GET(_req: Request, context: RouteContext) {
    try {
        const { testId } = await context.params;
        const { test, spec, summary, pdf } = await readGeneratedOmrPdf(testId);
        const filename = `${test.title.replace(/[^A-Za-z0-9._-]+/g, '_') || 'omr_sheet'}_omr_v${spec.version}.pdf`;

        return new NextResponse(new Uint8Array(pdf), {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Cache-Control': 'no-store',
                'X-OMR-Paper-Id': summary.paper_id,
                'X-OMR-Version': String(summary.version),
                'X-OMR-Page-Count': String(summary.page_count),
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to generate OMR sheet';
        const status = message === 'Unauthorized' ? 401 : message === 'Test not found' ? 404 : 500;

        return NextResponse.json({ error: message }, { status });
    }
}
