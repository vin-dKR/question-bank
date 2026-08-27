// Verifies everything in the LaTeX pipeline that does not need Chromium.
import { katexCss, toHtml } from "@/lib/slides/latexRaster";
import { hasLatex } from "@/lib/slides/generate";
import prisma from "@/lib/prisma";

let fail = 0;
const check = (label: string, cond: boolean, extra = "") => {
    console.log(`${cond ? "  PASS" : "  FAIL"}  ${label}${extra ? "  -> " + extra : ""}`);
    if (!cond) fail++;
};

console.log("[katex css]");
const css = katexCss();
check("stylesheet loaded", css.length > 1000, `${(css.length / 1024).toFixed(0)} KB`);
check("fonts inlined as data URIs", css.includes("data:font/woff2;base64,"));
check(
    "no unresolved font paths remain",
    !/url\(fonts\//.test(css),
    (css.match(/url\(fonts\//g) ?? []).length + " left"
);

console.log("\n[markup]");
const cases: [string, string][] = [
    ["inline paren", "Potential of A is \\(5V\\), find B."],
    ["fraction", "\\(\\frac{-q}{1+\\sqrt{2}}\\)"],
    ["display bracket", "\\[\\int_0^1 x^2\\,dx\\]"],
    ["dollar inline", "The value $x^2 + y^2$ holds."],
    ["plain text only", "No mathematics in this sentence."],
];

for (const [label, input] of cases) {
    const html = toHtml(input);
    const rendered = html.includes("katex");
    const expected = hasLatex(input);
    check(`${label}: rendered=${rendered} expected=${expected}`, rendered === expected);
}

console.log("\n[escaping]");
check("html is escaped in text runs", toHtml("a < b & c").includes("&lt;"));
check("newlines become breaks", toHtml("line1\nline2").includes("<br/>"));
check(
    "malformed tex degrades, does not throw",
    typeof toHtml("\\(\\frac{\\)") === "string"
);

console.log("\n[against real records]");
// Prisma's `contains` compiles to a regex on MongoDB, so "\\(" would match a bare
// parenthesis. Pull a plain sample and filter in JS with the real detector.
const sample = await prisma.question.findMany({
    select: { question_text: true },
    take: 600,
});
const withMath = sample.filter((r) => hasLatex(r.question_text ?? ""));
let rendered = 0;
for (const r of withMath) if (toHtml(r.question_text).includes("katex")) rendered++;
check(
    "every question containing math renders",
    rendered === withMath.length,
    `${rendered}/${withMath.length} (of ${sample.length} sampled)`
);

await prisma.$disconnect();
console.log(`\n${fail === 0 ? "ALL PASSED" : fail + " FAILURE(S)"}`);
process.exit(fail === 0 ? 0 : 1);
