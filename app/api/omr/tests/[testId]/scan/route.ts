import { NextResponse } from 'next/server';
import { detectOmrScans, gradeOmrDetection, saveDetectedOmrResponse } from '@/lib/omr/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
    params: Promise<{ testId: string }>;
}

function formBoolean(value: FormDataEntryValue | null): boolean {
    return typeof value === 'string' && ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function formNumber(value: FormDataEntryValue | null): number | undefined {
    if (typeof value !== 'string' || value.trim() === '') return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
}

export async function POST(req: Request, context: RouteContext) {
    let testId = 'unknown';
    let fileCount = 0;
    let shouldSave = false;

    try {
        ({ testId } = await context.params);
        const form = await req.formData();
        const files = [...form.getAll('files'), ...form.getAll('file'), ...form.getAll('image')].filter(
            (entry): entry is File => entry instanceof File,
        );
        fileCount = files.length;

        if (files.length === 0) {
            return NextResponse.json({ error: 'Upload OMR scan images as form field "files", "file", or "image".' }, { status: 400 });
        }

        const includeImages = formBoolean(form.get('includeImages'));
        shouldSave = formBoolean(form.get('save'));
        const scans = await Promise.all(
            files.map(async (file) => ({
                image: Buffer.from(await file.arrayBuffer()),
                filename: file.name,
            })),
        );
        const { generated, detections, combinedDetection } = await detectOmrScans(testId, scans, includeImages);
        const grading = gradeOmrDetection(generated.test, combinedDetection);
        const detectedPages = new Set(detections.map((detection) => detection.page).filter((page): page is number => typeof page === 'number'));

        if (!shouldSave) {
            return NextResponse.json({
                message: 'OMR scan processed',
                data: {
                    detection: combinedDetection,
                    detections,
                    pageCount: generated.summary.page_count,
                    grading,
                },
            });
        }

        if (generated.summary.page_count > detectedPages.size) {
            return NextResponse.json(
                {
                    error: `This OMR sheet has ${generated.summary.page_count} page(s). Upload every page before saving.`,
                    data: { detection: combinedDetection, detections, pageCount: generated.summary.page_count, grading },
                },
                { status: 422 },
            );
        }

        const name = String(form.get('name') ?? '').trim();
        const className = String(form.get('className') ?? '').trim();
        const rollNumber = String(form.get('rollNumber') ?? combinedDetection.quality.roll_number ?? '').trim();

        if (!name || !className || !rollNumber) {
            return NextResponse.json(
                {
                    error: 'name, className, and rollNumber are required when save=true.',
                    data: { detection: combinedDetection, detections, pageCount: generated.summary.page_count, grading },
                },
                { status: 400 },
            );
        }

        const response = await saveDetectedOmrResponse(generated.test, combinedDetection, {
            name,
            className,
            rollNumber,
            timeTaken: formNumber(form.get('timeTaken')),
        });

        return NextResponse.json({
            message: 'OMR response saved',
            data: {
                detection: combinedDetection,
                detections,
                pageCount: generated.summary.page_count,
                grading,
                response,
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to process OMR scan';
        const status = message === 'Unauthorized'
            ? 401
            : message === 'Test not found'
                ? 404
                : message.includes('manual review') || message.includes('unreadable')
                    ? 422
                    : 500;

        console.error('OMR scan failed', { testId, fileCount, shouldSave, message, error });

        return NextResponse.json({ error: message }, { status });
    }
}
