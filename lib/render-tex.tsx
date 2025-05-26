import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { JSX } from 'react';

interface TextPart {
    type: 'text';
    value: string;
}

interface LatexPart {
    type: 'latex';
    value: string;
}

type StringPart = TextPart | LatexPart;

const toMixedLatex = (text: string): StringPart[] => {
    try {
        const parts: StringPart[] = [];
        let current = '';
        let i = 0;

        while (i < text.length) {
            let match: RegExpMatchArray | null = null;
            let matched = false;

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
                    matched = true;
                }
            }

            if (!matched) {
                const patterns = [
                    /(\w+_\w+\s*\\propto\s*\\frac\{([^{}]+)\}\{([^{}]+)\})/,
                    /(\w+_\w+\s*\\propto\s*\w+(\^\d+)?)/,
                    /\\frac\{([^{}]+)\}\{([^{}]+)\}/,
                    /√(\[[^\]]+\])_(\d+)/,
                    /(\w+)_\((\d+\/\d+)\)/,
                    /(\d+)\^-\s*(\d+)/,
                    /(\[[^\]]+\]|\w+)\^\((-?\d+\/\d+|-\d+)\)/,
                    /(\w+)\^(\w+|\d+)/,
                    /(\d+)\/(\d+)/,
                    /sqrt\s*(\w+)/,
                    /\b(sin|cos|tan|ln)\s+(\w+)/,
                    /(\w+)_(\d+|\d)/,
                    /\d+\s*[+\-*\/]\s*\d+/,
                    /lim\s*(\w+)\s*->\s*([0-9]+|infty)\s*([^\s]+)/,
                    /int\s*([^\s]+)\s*dx/,
                    /\|\s*([^\s|]+)\s*\|/,
                    /\(\s*([^\s()]+)\s*\)\^(\d+)/,
                    /(\w+)\s*(>|<|>=|<=|=)\s*(\d+)/,
                    /(\w+)\!/,
                    /sum\s*(\w+)=(\d+)\s*to\s*(\w+)\s*([^\s]+)/,
                ];

                for (const pattern of patterns) {
                    match = text.slice(i).match(pattern);
                    if (match && match.index === 0) {
                        matched = true;
                        break;
                    }
                }

                if (matched && match) {
                    if (current) {
                        parts.push({ type: 'text', value: current });
                        current = '';
                    }

                    let latex = match[0];
                    if (match[0].match(/\w+_\w+\s*\\propto\s*\\frac\{[^{}]+\}\{[^{}]+\}/)) {
                        latex = match[0];
                    } else if (match[0].match(/\w+_\w+\s*\\propto\s*\w+(\^\d+)?/)) {
                        latex = `${match[1]} \\propto ${match[2]}`;
                    } else if (match[0].match(/\\frac\{[^{}]+\}\{[^{}]+\}/)) {
                        latex = match[0];
                    } else if (match[0].match(/√(\[[^\]]+\])_(\d+)/)) {
                        latex = `\\sqrt{${match[1]}}_{${match[2]}}`;
                    } else if (match[0].match(/(\w+)_\((\d+\/\d+)\)/)) {
                        latex = `${match[1]}_{${match[2]}}`;
                    } else if (match[0].match(/\d+\^-\s*\d+/)) {
                        latex = `${match[1]}^{-${match[2]}}`;
                    } else if (match[0].match(/(\[[^\]]+\]|\w+)\^\((-?\d+\/\d+|-\d+)\)/)) {
                        latex = `${match[1]}^{${match[2]}}`;
                    } else if (match[0].match(/\w+\^(\w+|\d+)/)) {
                        latex = `${match[1]}^{${match[2]}}`;
                    } else if (match[0].match(/\d+\/\d+/)) {
                        latex = `\\frac{${match[1]}}{${match[2]}}`;
                    } else if (match[0].match(/sqrt\s*\w+/)) {
                        latex = `\\sqrt{${match[1]}}`;
                    } else if (match[0].match(/\b(sin|cos|tan|ln)\s+\w+/)) {
                        latex = `\\${match[1]}{${match[2]}}`;
                    } else if (match[0].match(/\w+_\d+/)) {
                        latex = `${match[1]}_{${match[2]}}`;
                    } else if (match[0].match(/\d+\s*[+\-*\/]\s*\d+/)) {
                        latex = match[0].replace('*', '\\times').replace('/', '\\div');
                    } else if (match[0].match(/lim\s*\w+\s*->\s*([0-9]+|infty)\s*[^\s]+/)) {
                        latex = `\\lim_{${match[1]} \\to ${match[2]}} ${match[3]}`;
                    } else if (match[0].match(/int\s*[^\s]+\s*dx/)) {
                        latex = `\\int ${match[1]} \\, dx`;
                    } else if (match[0].match(/\|[^\s|]+\|/)) {
                        latex = `\\left| ${match[1]} \\right|`;
                    } else if (match[0].match(/\([^\s()]+\)\^\d+/)) {
                        latex = `\\left( ${match[1]} \\right)^{${match[2]}}`;
                    } else if (match[0].match(/\w+\s*(>|<|>=|<=|=)\s*\d+/)) {
                        latex = `${match[1]} ${match[2]} ${match[3]}`;
                    } else if (match[0].match(/\w+\!/)) {
                        latex = `${match[1]}!`;
                    } else if (match[0].match(/sum\s*\w+=(\d+)\s*to\s*\w+\s*[^\s]+/)) {
                        latex = `\\sum_{${match[1]} = ${match[2]}}^{${match[3]}} ${match[4]}`;
                    }

                    parts.push({ type: 'latex', value: latex });
                    i += match[0].length;
                } else {
                    current += text[i];
                    i++;
                }
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
    console.log(parts)

    return parts.map((part, index) => (
        <span key={index}>
            {part.type === 'latex' ? <InlineMath math={part.value} /> : part.value}
        </span>
    ));
};

export { renderMixedLatex, extractRawLatex };
