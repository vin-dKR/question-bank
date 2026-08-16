const OPTION_LABELS = 'ABCDEFGH';

function optionLabels(optionCount: number): string[] {
    const count = optionCount > 0 ? Math.min(optionCount, OPTION_LABELS.length) : OPTION_LABELS.length;
    return OPTION_LABELS.slice(0, count).split('');
}

function normalizeChoiceText(value: string): string {
    return value
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

function orderedUnique(labels: string[], allowedLabels: string[]): string {
    const selected = new Set(labels.filter((label) => allowedLabels.includes(label)));
    return allowedLabels.filter((label) => selected.has(label)).join('');
}

export function normalizeChoiceKey(answer: string | null | undefined, options: string[] = []): string {
    const raw = (answer ?? '').trim();
    if (!raw) return '';

    const labels = optionLabels(options.length);
    const compact = raw.toUpperCase().replace(/[\s,.;:/()\[\]{}_-]+/g, '');

    if (/^[A-H]+$/.test(compact)) {
        return orderedUnique(compact.split(''), labels);
    }

    if (/^[1-8]+$/.test(compact)) {
        return orderedUnique(
            compact
                .split('')
                .map((digit) => labels[Number(digit) - 1])
                .filter((label): label is string => Boolean(label)),
            labels,
        );
    }

    if (options.length === 0) return '';

    const normalizedRaw = normalizeChoiceText(raw);
    const matchedLabels = options.flatMap((option, index) =>
        normalizeChoiceText(option) === normalizedRaw ? [labels[index]] : [],
    );

    return orderedUnique(matchedLabels.filter((label): label is string => Boolean(label)), labels);
}

export function choicesMatch(selectedAnswer: string | null | undefined, correctAnswer: string | null | undefined, options: string[] = []): boolean {
    const selectedKey = normalizeChoiceKey(selectedAnswer, options);
    const correctKey = normalizeChoiceKey(correctAnswer, options);
    return Boolean(selectedKey && correctKey && selectedKey === correctKey);
}
