'use client';

function filenameFromDisposition(disposition: string | null, fallback: string): string {
    if (!disposition) return fallback;

    const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1].replace(/"/g, ''));

    const asciiMatch = disposition.match(/filename="?([^";]+)"?/i);
    return asciiMatch?.[1] ?? fallback;
}

async function responseErrorMessage(response: Response): Promise<string> {
    const fallback = `OMR sheet download failed (${response.status})`;
    const contentType = response.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
        try {
            const payload = (await response.json()) as { error?: string };
            return payload.error || fallback;
        } catch {
            return fallback;
        }
    }

    const text = await response.text().catch(() => '');
    return text.trim().slice(0, 240) || fallback;
}

export async function fetchOmrSheet(testId: string, fallbackName = 'omr-sheet.pdf') {
    const response = await fetch(`/api/omr/tests/${testId}/sheet`, {
        cache: 'no-store',
    });

    if (!response.ok) {
        throw new Error(await responseErrorMessage(response));
    }

    return {
        blob: await response.blob(),
        filename: filenameFromDisposition(response.headers.get('content-disposition'), fallbackName),
    };
}

export async function downloadOmrSheet(testId: string, fallbackName = 'omr-sheet.pdf') {
    const { blob, filename } = await fetchOmrSheet(testId, fallbackName);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_200);
}
