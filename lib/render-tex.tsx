import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { JSX } from 'react';

type StringPart = TextPart | LatexPart;

const toMixedLatex = (text: string | null | undefined): StringPart[] => {
    text = text ?? "";
    try {

        const parts: StringPart[] = [];
        let current = '';
        let i = 0;

        while (i < text.length) {
            // Check for inline LaTeX: \( ... \)
            if (text.slice(i).startsWith('\\(')) {
                const endIndex = text.indexOf('\\)', i + 2);
                if (endIndex !== -1) {
                    const latexContent = text.slice(i + 2, endIndex);
                    if (current) {
                        parts.push({ type: 'text', value: current });
                        current = '';
                    }
                    parts.push({ type: 'latex', value: latexContent });
                    i = endIndex + 2;
                } else {
                    current += text[i];
                    i++;
                }
            } else {
                current += text[i];
                i++;
            }
        }

        if (current) {
            parts.push({ type: 'text', value: current });
        }

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
                // Ensure proper LaTeX syntax
                return `$${part.value}$`;
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
            return <InlineMath key={index}>{part.value}</InlineMath>;
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
