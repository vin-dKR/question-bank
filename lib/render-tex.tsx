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

// Utility function to convert math parts of a string to LaTeX, preserving plain text
const toMixedLatex = (text: string): StringPart[] => {
    try {
        // If the string is already fully LaTeX (starts with \), return as-is
        if (text.match(/^\s*\\[a-zA-Z|begin|end|left|right|frac|sqrt|sum|int|lim|infty]/)) {
            return [{ type: 'latex', value: text }];
        }

        // Split string into parts, identifying math expressions
        const parts: StringPart[] = [];
        let current = '';
        let i = 0;
        while (i < text.length) {
            // Look for potential math expression
            let match: RegExpMatchArray | null = null;
            let matched = false;

            // Check for common math patterns
            for (const pattern of [
                /(\w+)\^(\d+)/, // e.g., x^2
                /(\w+)\^(\w+)/, // e.g., x^y
                /(\d+)\/(\d+)/, // e.g., 1/2
                /sqrt\s*(\w+)/, // e.g., sqrt x
                /(sin|cos|tan|ln)\s*(\w+)/, // e.g., sin x, ln x
                /(\w+)_(\d+)/, // e.g., x_2
                /\d+\s*[+\-*\/]\s*\d+/, // e.g., 2 + 3
                /lim\s*(\w+)\s*->\s*([0-9]+|infty)\s*([^\s]+)/, // e.g., lim x->0 1/x
                /int\s*([^\s]+)\s*dx/, // e.g., int x dx
                /\|\s*([^\s|]+)\s*\|/, // e.g., |x|
                /\(\s*([^\s()]+)\s*\)\^(\d+)/, // e.g., (x + 1)^2
                /(\w+)\s*(>|<|>=|<=|=)\s*(\d+)/, // e.g., x > 2
                /(\w+)\!/, // e.g., n!
                /sum\s*(\w+)=(\d+)\s*to\s*(\w+)\s*([^\s]+)/, // e.g., sum i=1 to n i
            ]) {
                match = text.slice(i).match(pattern);
                if (match && match.index === 0) {
                    matched = true;
                    break;
                }
            }

            if (matched && match) {
                // Add text before the match
                if (current) {
                    parts.push({ type: 'text', value: current });
                    current = '';
                }

                // Convert matched math to LaTeX
                let latex = match[0];
                if (match[0].match(/\w+\^\d+/)) {
                    latex = `${match[1]}^{${match[2]}}`;
                } else if (match[0].match(/\w+\^\w+/)) {
                    latex = `${match[1]}^{${match[2]}}`;
                } else if (match[0].match(/\d+\/\d+/)) {
                    latex = `\\frac{${match[1]}}{${match[2]}}`;
                } else if (match[0].match(/sqrt\s*\w+/)) {
                    latex = `\\sqrt{${match[1]}}`;
                } else if (match[0].match(/(sin|cos|tan|ln)\s*\w+/)) {
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
                // Add character to current text
                current += text[i];
                i++;
            }
        }

        // Add remaining text
        if (current) {
            parts.push({ type: 'text', value: current });
        }

        return parts;
    } catch (error) {
        console.log(error)
        return [{ type: 'text', value: text }];
    }
};

// Helper function to render mixed LaTeX and text
const renderMixedLatex = (text: string): JSX.Element[] => {
    const parts = toMixedLatex(text);
    return parts.map((part, index) => (
        <span key={index}>
            {part.type === 'latex' ? <InlineMath math={part.value} /> : part.value}
        </span>
    ));
};

export default renderMixedLatex;
