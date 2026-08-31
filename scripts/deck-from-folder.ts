/**
 * Builds a .pptx from a real folder of questions — the CLI form of the feature.
 * Useful for checking layouts against live records before any UI exists.
 *
 *   bun run scripts/deck-from-folder.ts                      # lists folders
 *   bun run scripts/deck-from-folder.ts "reso 12"
 *   bun run scripts/deck-from-folder.ts "reso 12" diagram paper
 *
 * Args: [folderNameOrId] [presetId] [themeId]
 */
import { writeFileSync } from "fs";
import prisma from "@/lib/prisma";
import { PRESETS, getTheme } from "@/lib/slides/presets";
import { templateToSlides, hasLatex, resolveImage } from "@/lib/slides/generate";
import { slidesToPptxBuffer } from "@/lib/slides/pptx";
import { createLatexRasterizer } from "@/lib/slides/latexRaster";
import { closeBrowser } from "@/lib/pdf/browserSingleton";

const [target, presetArg = "practice", themeArg = "midnight"] = process.argv.slice(2);

async function listFolders() {
    const folders = await prisma.folder.findMany({
        select: { id: true, name: true, _count: { select: { questionRelations: true } } },
        orderBy: { createdAt: "desc" },
        take: 40,
    });
    console.log("folders:\n");
    for (const f of folders) {
        console.log(`  ${f.name.padEnd(34)} ${String(f._count.questionRelations).padStart(4)}q   ${f.id}`);
    }
    console.log("\npass a folder name or id as the first argument.");
}

async function main() {
    if (!target) return listFolders();

    // Mongo rejects a non-ObjectId string for `id` even inside an OR, so only
    // include the id branch when the argument actually looks like one.
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(target);

    const folder = await prisma.folder.findFirst({
        where: isObjectId ? { id: target } : { name: target },
        select: {
            id: true,
            name: true,
            questionRelations: {
                orderBy: { position: "asc" },
                select: { question: true },
            },
        },
    });

    if (!folder) {
        console.error(`no folder matching "${target}"\n`);
        return listFolders();
    }

    const questions = folder.questionRelations.map((r) => r.question) as unknown as Question[];
    if (!questions.length) {
        console.error(`folder "${folder.name}" has no questions`);
        return;
    }

    const theme = getTheme(themeArg);
    const preset = PRESETS(theme).find((p) => p.id === presetArg);
    if (!preset) {
        console.error(`unknown preset "${presetArg}"`);
        return;
    }

    // What the layouts are actually up against in this folder.
    const latex = questions.filter((q) => hasLatex(q.question_text ?? "")).length;
    const noOptions = questions.filter((q) => !q.options?.length).length;
    // Split these apart: a row can name an image that cannot be fetched, and
    // reporting those as diagrams hides why the deck comes out without figures.
    const claimsImage = questions.filter((q) => q.question_image).length;
    const usableImage = questions.filter((q) => resolveImage(q.question_image)).length;
    const longest = Math.max(...questions.map((q) => (q.question_text ?? "").length));

    console.log(`folder    ${folder.name}  (${questions.length} questions)`);
    console.log(`preset    ${preset.name} / ${theme.name}`);
    console.log(`latex     ${latex}/${questions.length} questions`);
    console.log(`nooptions ${noOptions}/${questions.length}`);
    console.log(`diagrams  ${usableImage}/${questions.length} usable` +
        (claimsImage > usableImage ? `  (${claimsImage - usableImage} unusable — bare filename, no bucket path)` : ""));
    console.log(`longest   ${longest} chars of question text`);

    const slides = templateToSlides(preset.slides, questions);

    const renderer = await createLatexRasterizer();
    let buf: Buffer;
    try {
        buf = await slidesToPptxBuffer(slides, {
            title: folder.name,
            subject: questions[0]?.subject ?? "Question bank",
            rasterizeLatex: renderer.rasterize,
        });
    } finally {
        await renderer.close();
    }

    const safe = folder.name.replace(/[^\w.-]+/g, "-").toLowerCase();
    const out = `deck-${safe}-${preset.id}.pptx`;
    writeFileSync(out, buf);
    console.log(`\nwrote ${out}  —  ${slides.length} slides, ${(buf.length / 1024).toFixed(1)} KB`);
}

// The browser singleton deliberately outlives a single PDF/deck render, so a CLI
// run has to close it explicitly or the process hangs after writing the file.
async function shutdown() {
    await closeBrowser();
    await prisma.$disconnect();
}

main()
    .then(shutdown)
    .catch(async (e) => {
        console.error(e);
        await shutdown();
        process.exit(1);
    });
