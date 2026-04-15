/**
 * Prompts ported verbatim from the Python projects:
 *   - image-auto-cropper/backend/services/openai_detector.py
 *   - image-auto-cropper/backend/services/ai_detector.py  (Gemini variant)
 *   - question-extractor-tool/backend/prompts/base_prompt.py
 *
 * Keep these byte-for-byte identical to the Python source. The Python project
 * ships TWO separate detector prompts — one for each provider — that differ
 * in their OUTPUT FORMAT section and final "RESPOND WITH ONLY..." nudge.
 * Don't collapse them into one; vision models are sensitive to wording.
 */

import type { Provider } from "./types";

export function detectorPrompt(imgW: number, imgH: number, provider: Provider): string {
    return provider === "gemini"
        ? detectorPromptGemini(imgW, imgH)
        : detectorPromptOpenAI(imgW, imgH);
}

function detectorPromptOpenAI(imgW: number, imgH: number): string {
    return `You are an expert OCR and layout-analysis system for scanned examination papers.

The attached image is a question paper. Its pixel dimensions are ${imgW} px wide × ${imgH} px tall.

=============================
TASK: DETECT DIAGRAMS
=============================
1. Identify every question by its number (1, 2, 3 … or Q1, Q2 …).
2. For each question, detect if there is an associated GRAPHICAL ELEMENT (diagram, figure, graph, illustration, or shape).
3. Provide a TIGHT bounding box around only the visual/graphical pixels of that element.

⚠️  CORE RULES:
  1. The bbox MUST correspond to the ACTUAL POSITION of the diagram/drawing in the image.
  2. The bbox must NOT include question text, numbers, or option labels unless they are integral parts of the drawing.
  3. Do NOT simply box the question label area; you must find the graphic itself wherever it is located in the original image.
  4. If a question has no diagram or graphic, set has_image=false and bbox=null.
  5. If a question has a diagram, set has_image=true and provide the bbox.

=============================
BOUNDING BOX FORMAT
=============================
[x, y, width, height]  — integers, pixel coords relative to the full image
  x      = left  edge  (0 … ${imgW})
  y      = top   edge  (0 … ${imgH})
  width  = box width   (x + width  ≤ ${imgW})
  height = box height  (y + height ≤ ${imgH})

=============================
OUTPUT FORMAT
=============================
Please structure your response as a valid JSON array matching this format (you can include markdown formatting if needed, but the core must be JSON):
[
  {"q_no": 1, "has_image": false, "bbox": null},
  {"q_no": 2, "has_image": true,  "bbox": [x, y, w, h]}
]
`;
}

function detectorPromptGemini(imgW: number, imgH: number): string {
    return `You are an expert OCR and layout-analysis system for scanned examination papers.

The attached image is a question paper. Its pixel dimensions are ${imgW} px wide × ${imgH} px tall.

=============================
TASK: DETECT DIAGRAMS
=============================
1. Identify every question by its number (1, 2, 3 … or Q1, Q2 …).
2. For each question, detect if there is an associated GRAPHICAL ELEMENT (diagram, figure, graph, illustration, or shape).
3. Provide a TIGHT bounding box around only the visual/graphical pixels of that element.

⚠️  CORE RULES:
  1. The bbox MUST correspond to the ACTUAL POSITION of the diagram/drawing in the image.
  2. The bbox must NOT include question text, numbers, or option labels unless they are integral parts of the drawing.
  3. Do NOT simply box the question label area; you must find the graphic itself wherever it is located in the original image.
  4. If a question has no diagram or graphic, set has_image=false and bbox=null.
  5. If a question has a diagram, set has_image=true and provide the bbox.

=============================
BOUNDING BOX FORMAT
=============================
[x, y, width, height]  — integers, pixel coords relative to the full image
  x      = left  edge  (0 … ${imgW})
  y      = top   edge  (0 … ${imgH})
  width  = box width   (x + width  ≤ ${imgW})
  height = box height  (y + height ≤ ${imgH})

=============================
OUTPUT FORMAT
=============================
Return ONLY a raw JSON array — no markdown, no explanation:
[
  {"q_no": 1, "has_image": false, "bbox": null},
  {"q_no": 2, "has_image": true,  "bbox": [x, y, w, h]}
]

RESPOND WITH ONLY THE JSON ARRAY. NOTHING ELSE.`;
}

export function extractionPrompt(): string {
    return `You are given an image of a question paper page.
Extract ONLY the core information for each question in the simplified JSON format below.

{
  "questions": [
    {
      "question_number": 1,
      "question_text": "Extract the complete question text here",
      "options": ["(A) Option A text", "(B) Option B text", "(C) Option C text", "(D) Option D text"]
    }
  ]
}

EXTRACTION RULES:
1. ONLY extract these 3 fields: question_number, question_text, options
2. question_number: Extract the question number from the image (e.g., 1, 2, 3, etc.)
3. question_text: Extract the complete question text including any mathematical expressions or diagrams descriptions
4. options: Extract all answer options as an array of strings with proper formatting
5. CRITICAL: Format options with labels: "(A) option text", "(B) option text", "(C) option text", "(D) option text"
6. For multiple choice questions, always include the (A), (B), (C), (D) prefixes
7. If the image contains a comprehension passage, include the passage text at the beginning of question_text
8. For mathematical expressions, use LaTeX formatting when possible (e.g., "\\( \\sqrt{3} \\)" for square root)
9. If a question spans multiple lines, include the complete text
10. Do not include any other fields or metadata - only these 3 core fields
11. Do not add placeholders or null values for other fields

JSON FORMATTING REQUIREMENTS:
11. CRITICAL: Always return valid, complete JSON that can be parsed by JSON.parse()
12. Use double quotes for all string values and keys
13. Escape special characters in strings (quotes, backslashes, etc.)
14. Do not include trailing commas in arrays or objects
15. Ensure all opening braces/brackets have matching closing braces/brackets
16. If a string contains quotes, escape them with backslashes: \\"
17. For mathematical expressions, use LaTeX formatting without breaking JSON
18. Never truncate the JSON response - always complete the structure
19. If text contains line breaks, use \\n instead of actual line breaks
20. Return only the JSON structure above - no additional text or explanations

FOCUS ON ACCURACY:
- Extract question text exactly as it appears
- Don't miss any options - include all available options
- MANDATORY: Always format options as "(A) text", "(B) text", "(C) text", "(D) text"
- Preserve mathematical notation and formatting (use LaTeX when needed)
- Don't add interpretations or assumptions
- For subjective questions with no options, use empty array []

AUTO-DETECT QUESTION TYPE:
- Single correct: exactly 4 options (A)(B)(C)(D). Normalize any (1)(2)(3)(4) into (A)(B)(C)(D).
- Multiple correct: same 4-option shape, usually flagged by "select all that apply" or "more than one option is correct".
- Matrix match: two columns (Column I/II). Put the full table structure in question_text and the combination choices in options.
- Comprehension: prepend "PASSAGE: <passage>\\n\\nQUESTION: " to question_text for every question sharing the passage; 4 options.
- Subjective: no options — options array MUST be [].
- If the type is ambiguous, prefer the base shape above and leave options empty when no MCQ is visible.`;
}
