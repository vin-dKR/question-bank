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
        // If the string is fully LaTeX (starts with \), return as-is
        if (text.match(/^\s*\\[a-zA-Z|begin|end|left|right|frac|sqrt|sum|int|lim|infty|propto]/)) {
            return [{ type: 'latex', value: text }];
        }

        const parts: StringPart[] = [];
        let current = '';
        let i = 0;

        while (i < text.length) {
            let match: RegExpMatchArray | null = null;
            let matched = false;

            // Define patterns with higher specificity first
            const patterns = [
                // Proportionality with fraction: e.g., T_n \propto \frac{1}{n^2}
                /(\w+_\w+\s*\\propto\s*\\frac\{([^{}]+)\}\{([^{}]+)\})/,
                // LaTeX fraction: e.g., \frac{1}{n^2}
                /\\frac\{([^{}]+)\}\{([^{}]+)\}/,
                // Proportionality with expression: e.g., r_n \propto n^2
                /(\w+_\w+\s*\\propto\s*\w+\^\d+)/,
                // Sub/superscript: e.g., x^2, x^y
                /(\w+)\^(\w+|\d+)/,
                // Fraction: e.g., 1/2
                /(\d+)\/(\d+)/,
                // Square root: e.g., sqrt x
                /sqrt\s*(\w+)/,
                // Trig functions with word boundaries: e.g., sin x, but not in "increasing"
                /\b(sin|cos|tan|ln)\s+(\w+)/,
                // Subscript: e.g., x_2
                /(\w+)_(\d+)/,
                // Basic arithmetic: e.g., 2 + 3
                /\d+\s*[+\-*\/]\s*\d+/,
                // Limit: e.g., lim x->0 1/x
                /lim\s*(\w+)\s*->\s*([0-9]+|infty)\s*([^\s]+)/,
                // Integral: e.g., int x dx
                /int\s*([^\s]+)\s*dx/,
                // Absolute value: e.g., |x|
                /\|\s*([^\s|]+)\s*\|/,
                // Parentheses with superscript: e.g., (x + 1)^2
                /\(\s*([^\s()]+)\s*\)\^(\d+)/,
                // Inequalities: e.g., x > 2
                /(\w+)\s*(>|<|>=|<=|=)\s*(\d+)/,
                // Factorial: e.g., n!
                /(\w+)\!/,
                // Summation: e.g., sum i=1 to n i
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
                // Add text before the match
                if (current) {
                    parts.push({ type: 'text', value: current });
                    current = '';
                }

                // Convert matched math to LaTeX
                let latex = match[0];
                if (match[0].match(/\w+_\w+\s*\\propto\s*\\frac\{[^{}]+\}\{[^{}]+\}/)) {
                    latex = match[0]; // Already in LaTeX form
                } else if (match[0].match(/\\frac\{[^{}]+\}\{[^{}]+\}/)) {
                    latex = match[0]; // Already in LaTeX form
                } else if (match[0].match(/\w+_\w+\s*\\propto\s*\w+\^\d+/)) {
                    latex = `${match[1]} \\propto ${match[2]}`;
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
        console.error('Error in toMixedLatex:', error);
        return [{ type: 'text', value: text }];
    }
};

const renderMixedLatex = (text: string): JSX.Element[] => {
    const parts = toMixedLatex(text);
    return parts.map((part, index) => (
        <span key={index}>
            {part.type === 'latex' ? <InlineMath math={part.value} /> : part.value}
        </span>
    ));
};

export default renderMixedLatex;
