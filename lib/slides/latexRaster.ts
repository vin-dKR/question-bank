/**
 * Renders LaTeX-bearing text to a PNG for the .pptx exporter.
 *
 * Server-side only — it drives headless Chromium and reads from node_modules.
 * Reachable solely through the "use server" action and the CLI scripts; do not
 * import it from a client component.
 *
 * PowerPoint has no way to typeset TeX, so any field containing math has to be
 * baked into an image. This renders with the same KaTeX build the app uses on
 * screen, so a deck matches its preview.
 *
 * The KaTeX stylesheet is inlined with its fonts as data URIs: the page is loaded
 * via setContent, so it has no base URL for `url(fonts/…)` to resolve against, and
 * file:// font requests are blocked by CORS.
 */
import { readFileSync } from "fs";
import path from "path";
import katex from "katex";
import { getBrowser } from "@/lib/pdf/browserSingleton";
import { FONTS } from "@/types/slides";
import type { RasterizeLatex } from "./pptx";

/** Rendered at this multiple of the slide size, so text stays crisp when projected. */
const SCALE = 2;
/** Auto-shrink will not go below this fraction of the requested size. */
const MIN_SHRINK = 0.45;

let cachedCss: string | null = null;

/** KaTeX CSS with every woff2 face inlined; the woff/ttf fallbacks are dropped. */
export function katexCss(): string {
    if (cachedCss) return cachedCss;

    const dist = path.join(process.cwd(), "node_modules", "katex", "dist");
    const css = readFileSync(path.join(dist, "katex.min.css"), "utf8");

    cachedCss = css.replace(
        /src:url\(fonts\/([^)]+)\.woff2\)\s*format\("woff2"\)[^}]*/g,
        (whole, name: string) => {
            try {
                const buf = readFileSync(path.join(dist, "fonts", `${name}.woff2`));
                return `src:url(data:font/woff2;base64,${buf.toString("base64")}) format("woff2")`;
            } catch {
                return whole;
            }
        }
    );
    return cachedCss;
}

const escapeHtml = (s: string) =>
    s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

interface Part {
    tex: string | null;
    text: string;
    display: boolean;
}

/**
 * Split mixed content into text and math runs. Delimiters match the MathJax config
 * in lib/jax/jaxUtils.ts — the bank uses \( \) far more often than $ $.
 */
function split(input: string): Part[] {
    const parts: Part[] = [];
    const re = /\\\(([\s\S]+?)\\\)|\\\[([\s\S]+?)\\\]|\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;

    let last = 0;
    let m: RegExpExecArray | null;

    while ((m = re.exec(input)) !== null) {
        if (m.index > last) {
            parts.push({ tex: null, text: input.slice(last, m.index), display: false });
        }
        const inline = m[1] ?? m[4];
        const display = m[2] ?? m[3];
        parts.push({ tex: (inline ?? display) as string, text: "", display: display !== undefined });
        last = m.index + m[0].length;
    }

    if (last < input.length) parts.push({ tex: null, text: input.slice(last), display: false });
    return parts;
}

/** Exported for testing: mixed text/math to the HTML that gets screenshotted. */
export function toHtml(input: string): string {
    return split(input)
        .map((p) => {
            if (p.tex === null) return escapeHtml(p.text).replace(/\n/g, "<br/>");
            try {
                return katex.renderToString(p.tex, {
                    throwOnError: false,
                    displayMode: p.display,
                    output: "html",
                    // Physics questions routinely carry μ, Å and en-dashes. KaTeX
                    // still renders them; "warn" would just flood the server log.
                    strict: "ignore",
                });
            } catch {
                // A malformed expression should degrade to its source, not break the slide.
                return escapeHtml(p.tex);
            }
        })
        .join("");
}

export interface LatexRasterizer {
    rasterize: RasterizeLatex;
    close: () => Promise<void>;
}

/**
 * One page is reused for the whole export — launching per field would dominate
 * the runtime on a deck with dozens of equations.
 */
export async function createLatexRasterizer(): Promise<LatexRasterizer> {
    const browser = await getBrowser();
    const page = await browser.newPage();

    const rasterize: RasterizeLatex = async ({ text, widthPx, heightPx, color, fontSizePx }) => {
        const html = `<!doctype html><html><head><meta charset="utf-8"><style>
            ${katexCss()}
            html,body{margin:0;padding:0;background:transparent}
            #box{
                width:${widthPx}px;height:${heightPx}px;
                display:flex;flex-direction:column;justify-content:flex-start;
                color:${color};
                font-family:${JSON.stringify(FONTS[0])},system-ui,sans-serif;
                font-size:${fontSizePx}px;
                line-height:1.4;
                overflow:hidden;
                box-sizing:border-box;
            }
            #box .katex{font-size:1em}
        </style></head><body><div id="box"><div id="inner">${toHtml(text)}</div></div></body></html>`;

        await page.setViewport({
            width: Math.ceil(widthPx),
            height: Math.ceil(heightPx),
            deviceScaleFactor: SCALE,
        });
        await page.setContent(html, { waitUntil: "load" });

        // Auto-shrink to fit, mirroring the shrinkText behaviour applied to plain
        // text boxes — otherwise a long derivation is simply cropped.
        await page.evaluate(
            (minShrink: number, base: number) => {
                const box = document.getElementById("box");
                const inner = document.getElementById("inner");
                if (!box || !inner) return;
                let size = base;
                while (inner.scrollHeight > box.clientHeight && size > base * minShrink) {
                    size -= Math.max(1, base * 0.04);
                    box.style.fontSize = `${size}px`;
                }
            },
            MIN_SHRINK,
            fontSizePx
        );

        const el = await page.$("#box");
        if (!el) return "";

        const shot = await el.screenshot({
            omitBackground: true,
            type: "png",
            encoding: "base64",
        });

        return `data:image/png;base64,${shot as unknown as string}`;
    };

    return {
        rasterize,
        // Close the page only. The browser is a shared singleton — see browserSingleton.
        close: async () => {
            try {
                await page.close();
            } catch {
                /* already gone */
            }
        },
    };
}
