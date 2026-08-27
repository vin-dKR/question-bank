/**
 * Generates a sample .pptx from stub questions so the slide layouts can be eyeballed
 * without a database connection. Needs only `bun install` — no .env, no prisma.
 *
 *   bun run scripts/generate-sample-deck.ts
 *   bun run scripts/generate-sample-deck.ts practice-answer paper
 *
 * Args: [presetId] [themeId]
 *   presetId  practice | practice-answer | diagram   (default: practice)
 *   themeId   midnight | paper                       (default: midnight)
 */
import { writeFileSync } from "fs";
import { PRESETS, getTheme } from "@/lib/slides/presets";
import { templateToSlides, slideCount } from "@/lib/slides/generate";
import { slidesToPptxBuffer } from "@/lib/slides/pptx";
import { validateTemplate } from "@/types/slides";

const [presetArg = "practice", themeArg = "midnight"] = process.argv.slice(2);

// Stand-ins for real records — deliberately awkward: one plain MCQ, one numeric
// with LaTeX and no options, one with pre-lettered options and a figure.
const questions = [
    {
        id: "1",
        question_number: 7,
        question_text: "Which of the following is a vector quantity?",
        options: ["Speed", "Distance", "Momentum", "Work"],
        answer: "Momentum",
        subject: "Physics",
        topic: "Kinematics",
        exam_name: "JEE Main",
    },
    {
        id: "2",
        question_number: 8,
        question_text: "Evaluate $\\int_0^1 x^2\\,dx$ and give the value to two decimals.",
        options: [],
        answer: "0.33",
        subject: "Maths",
        topic: "Integration",
    },
    {
        id: "3",
        question_number: 9,
        question_text: "Identify the circuit element shown in the figure.",
        options: ["(a) Resistor", "(b) Capacitor", "(c) Inductor", "(d) Diode"],
        answer: "(b) Capacitor",
        subject: "Physics",
        topic: "Current Electricity",
    },
] as unknown as Question[];

async function main() {
    const theme = getTheme(themeArg);
    const preset = PRESETS(theme).find((p) => p.id === presetArg);

    if (!preset) {
        console.error(
            `unknown preset "${presetArg}". available: ${PRESETS(theme)
                .map((p) => p.id)
                .join(", ")}`
        );
        process.exit(1);
    }

    const errors = validateTemplate(preset.slides);
    if (errors.length) {
        console.error("template is invalid:");
        for (const e of errors) console.error("  - " + e);
        process.exit(1);
    }

    const slides = templateToSlides(preset.slides, questions);
    const out = `sample-deck-${preset.id}-${theme.id}.pptx`;

    console.log(`preset   ${preset.name}`);
    console.log(`theme    ${theme.name}`);
    console.log(`slides   ${slides.length} (expected ${slideCount(preset.slides, questions.length)})`);
    console.log(`slots    ${preset.slots.map((s) => s.label).join(", ")}`);

    const buf = await slidesToPptxBuffer(slides, {
        title: `${preset.name} — sample`,
        subject: "Question bank",
    });
    writeFileSync(out, buf);

    console.log(`\nwrote ${out}  (${(buf.length / 1024).toFixed(1)} KB)`);
    console.log("LaTeX renders as raw $...$ until rasterizeLatex is wired up.");
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
