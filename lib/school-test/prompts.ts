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
    return `You are given an image of a question paper page. Find EVERY numbered question on this page and return them in the JSON format below. This covers subjective / numerical problems as well as multiple-choice questions — all question types are valid.

OUTPUT FORMAT (return exactly this shape, nothing else):
{
  "questions": [
    {
      "question_number": 17,
      "question_text": "The full prompt the student reads, including sub-parts (i), (ii), (iii), any given values, conditions, references to figures (\\"as shown in the figure\\"), and the final ask.",
      "options": ["(A) ...", "(B) ...", "(C) ...", "(D) ..."]
    }
  ]
}

HARD RULES — read all of these:

1. Extract EVERY numbered question that is at least partially visible on the page. Do not return an empty list if numbered questions are present; a near-empty or truncated question is still a question.
2. question_number is the numeric label of the question itself (e.g., 17, 18). Ignore reference codes printed alongside the question such as "CP0017", "[IIT-JEE 2005]", header text, or page numbers — those are NEVER the question number.
3. question_text must contain the complete problem statement: setup, sub-parts, given data, what to find. Do NOT summarise. Copy the wording.
4. options rules:
   - If the question shows lettered / numbered multiple-choice options such as (A)(B)(C)(D), (a)(b)(c)(d), or (1)(2)(3)(4), extract all of them and normalise every entry to the form "(A) ...", "(B) ...", "(C) ...", "(D) ...".
   - If the question is subjective / numerical / derivation / matrix-match / proof and has NO lettered choice list, return an empty array [].
   - Never invent options that are not printed on the page.
5. For comprehension / passage-based questions, prepend "PASSAGE: <full passage>\\n\\nQUESTION: " to the question_text of every question that belongs to that passage.
6. For mathematical expressions use LaTeX wrapped in \\( ... \\) delimiters. Inside JSON strings, escape every backslash as \\\\.
7. Inside any JSON string, represent line breaks as \\n (two characters). Never emit a raw newline inside a string.
8. Return ONLY the JSON object above. No markdown fences, no prose, no leading or trailing commentary.`;
}
