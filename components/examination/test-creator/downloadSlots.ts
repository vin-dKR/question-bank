'use client';

export type TestPdfKind = 'questions' | 'answers' | 'omr';

export interface ReservedDownloadSlot {
    kind: TestPdfKind;
    popup: Window;
}

const LABELS: Record<TestPdfKind, string> = {
    questions: 'Questions',
    answers: 'Answer Key',
    omr: 'OMR Sheet',
};

function preparePopup(popup: Window, kind: TestPdfKind) {
    const document = popup.document;
    document.title = `Preparing ${LABELS[kind]}`;
    document.body.replaceChildren();
    document.body.style.cssText = [
        'margin:0',
        'min-height:100vh',
        'display:grid',
        'place-items:center',
        'background:#fafafa',
        'color:#3f3f46',
        'font:14px/1.5 ui-sans-serif,system-ui,sans-serif',
    ].join(';');

    const message = document.createElement('p');
    message.textContent = `Preparing ${LABELS[kind]}…`;
    document.body.appendChild(message);
}

/**
 * Reserve one browser context per file while the click still has user
 * activation. A later async server action cannot reliably open download tabs,
 * and sending three downloads through one context triggers automatic-download
 * restrictions in several browsers.
 */
export function reserveDownloadSlots(kinds: TestPdfKind[]): ReservedDownloadSlot[] {
    const slots: ReservedDownloadSlot[] = [];

    try {
        for (const kind of kinds) {
            const popup = window.open('', `test-pdf-${kind}-${Date.now()}`, 'popup,width=420,height=220');
            if (!popup) {
                throw new Error('Allow pop-ups for this site, then try again. No test was created.');
            }
            preparePopup(popup, kind);
            slots.push({ kind, popup });
        }
        window.focus();
        return slots;
    } catch (error) {
        closeDownloadSlots(slots);
        throw error;
    }
}

export function closeDownloadSlots(slots: ReservedDownloadSlot[]) {
    for (const slot of slots) {
        if (!slot.popup.closed) slot.popup.close();
    }
}

function wait(milliseconds: number) {
    return new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));
}

/**
 * Dispatch one file through its pre-authorized window, then revoke its object
 * URL only after the browser has had time to accept the download navigation.
 */
export async function deliverReservedDownload(
    slot: ReservedDownloadSlot,
    blob: Blob,
    filename: string,
): Promise<void> {
    if (slot.popup.closed) {
        throw new Error(`The ${LABELS[slot.kind]} download window was closed. Retry the remaining downloads.`);
    }

    const url = URL.createObjectURL(blob);
    try {
        const document = slot.popup.document;
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        anchor.textContent = `Download ${LABELS[slot.kind]}`;
        document.body.replaceChildren(anchor);
        anchor.click();

        // Revoking in the same task can cancel downloads in WebKit. Keep the
        // context alive briefly, then clean up deterministically.
        await wait(1_200);
    } finally {
        URL.revokeObjectURL(url);
        if (!slot.popup.closed) slot.popup.close();
    }
}
