import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { JSX } from 'react';

type StringPart = TextPart | LatexPart;

const toMixedLatex = (text: string | null | undefined): StringPart[] => {
    text = text ?? "";
    try {
        const parts: StringPart[] = [];
        const math = /\\\(([\s\S]+?)\\\)|\\\[([\s\S]+?)\\\]|\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
        let cursor = 0;
        let match: RegExpExecArray | null;

        while ((match = math.exec(text)) !== null) {
            if (match.index > cursor) {
                parts.push({ type: 'text', value: text.slice(cursor, match.index) });
            }

            const inline = match[1] ?? match[4];
            const display = match[2] ?? match[3];
            parts.push({
                type: 'latex',
                value: (inline ?? display) as string,
                display: display !== undefined,
            });
            cursor = match.index + match[0].length;
        }

        if (cursor < text.length) parts.push({ type: 'text', value: text.slice(cursor) });

        return parts;
    } catch (error) {
        console.error('Error in toMixedLatex:', error);
        return [{ type: 'text', value: text }];
    }
};

const extractRawLatex = (text: string): string => {
    const parts = toMixedLatex(text);
    return parts
        .map((part) => {
            if (part.type === 'latex') {
                return part.display ? `$$${part.value}$$` : `$${part.value}$`;
            }
            // Escape special LaTeX characters
            return part.value
                .replace(/&/g, '\\&')
                .replace(/%/g, '\\%')
                .replace(/\$/g, '\\$')
                .replace(/#/g, '\\#')
                .replace(/_/g, '\\_')
                .replace(/{/g, '\\{')
                .replace(/}/g, '\\}');
        })
        .join('');
}

const renderMixedLatex = (text: string): JSX.Element[] => {
    const parts = toMixedLatex(text);
    return parts.map((part, index) => {
        if (part.type === 'latex') {
            return part.display ? (
                <span key={index} className="my-2 block overflow-x-auto">
                    <BlockMath>{part.value}</BlockMath>
                </span>
            ) : (
                <InlineMath key={index}>{part.value}</InlineMath>
            );
        }
        // Split text by \n and map each part to a span with a line break
        return part.value.split('\n').map((line, lineIndex, array) => (
            <span key={`${index}-${lineIndex}`}>
                {line}
                {lineIndex < array.length - 1 && <br />}
            </span>
        ));
    }).flat();
};

export { renderMixedLatex, extractRawLatex };
