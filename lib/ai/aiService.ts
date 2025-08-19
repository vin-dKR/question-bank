'use server';

import OpenAI from 'openai';
import { z } from 'zod';

const RefineTextInputSchema = z.object({
    text: z.string().min(1, 'Text is required'),
});

interface RefineTextResponse {
    success: boolean;
    refined_text?: string;
    error?: string;
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function refineTextWithAI(text: string): Promise<RefineTextResponse> {
    // Validate input
    const validation = RefineTextInputSchema.safeParse({ text });
    if (!validation.success) {
        return {
            success: false,
            error: validation.error.errors.map((e) => e.message).join(', '),
        };
    }

    const systemPrompt = 'You are a LaTeX formatting expert. Your job is to find and correctly wrap all LaTeX/math expressions using inline LaTeX delimiters.';

    const userPrompt = `
Your task is to format LaTeX expressions in the provided text. Use inline math delimiters only: \\\\(...\\\\)

✅ Rules:
1. Detect all LaTeX or math expressions — such as fractions, square roots, Greek letters, subscripts, superscripts, equations, symbols, trigonometric equations, etc.
2. Wrap ONLY the math expressions using inline math delimiters: \\\\(...\\\\)
3. DO NOT wrap full sentences — only the math parts.
4. Replace any other math delimiters like \`$\`, \`$.....$\`, \`\\\\[....\\\\]\`, \`[....]\`, etc. with \\\\(...\\\\)
5. Do NOT alter or add/remove any text or content — only wrap the math where necessary.
6. Preserve spacing, punctuation, and formatting outside math expressions.
7. do not start with ext when you are updating the trigonometric words.

🧪 Input:
text: "${text}"

🎯 Output format (valid JSON):
{
  "refined_text": "..."
}

Example: For every math expression, wrap it in \\\\(...\\\\). For example:
- Input: The value is 2x + 3.
- Output: The value is \\\\(2x + 3\\\\).

- Input: The answer is 4.12 \\times 10^{-15} V s.
- Output: The answer is \\\\(4.12 \\times 10^{-15} V s\\\\).
    `.trim();

    try {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is not set in environment variables.');
        }

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini', // Using a valid model as of August 2025
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
        });

        const content = response.choices?.[0]?.message?.content;
        if (!content) {
            return {
                success: false,
                error: 'No content returned from OpenAI response.',
            };
        }

        const refinedData = JSON.parse(content);
        if (typeof refinedData.refined_text !== 'string') {
            return {
                success: false,
                error: 'AI response did not contain a valid refined_text string.',
            };
        }

        return {
            success: true,
            refined_text: refinedData.refined_text,
        };
    } catch (error) {
        console.error('Error refining text with AI:', error);
        return {
            success: false,
            error: `Failed to refine text: ${(error as Error).message}`,
        };
    }
}
