/**
 * Paper whitening for school-test diagrams.
 *
 * A photographed page is never evenly lit, so a diagram cut out of it carries
 * the paper's colour cast and lighting gradient — it reads as a tinted rectangle
 * pasted into the test paper. `whiten_paper` estimates the paper colour at every
 * pixel and divides it out, which removes the cast and the gradient together.
 *
 * Runs Python the same two ways lib/omr/service.ts does: spawned locally, or
 * POSTed to the Vercel function when a service URL is configured. Keeping both
 * matters — Netlify hosts the Next.js app and does not execute api/*.py, but a
 * developer machine has no service URL and should still work.
 *
 * See integrations/bg-remover/EDUENTSS_INTEGRATION.md.
 */
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const BG_ROOT = path.join(process.cwd(), "integrations", "bg-remover");
const WORK_ROOT = path.join(os.tmpdir(), "question-bank-bgclean");

// Same venv the OMR service uses; both packages share requirements.txt.
const LOCAL_PYTHON =
    process.platform === "win32"
        ? path.join(process.cwd(), ".venv-omr", "Scripts", "python.exe")
        : path.join(process.cwd(), ".venv-omr", "bin", "python");

/** Mirrors getRemoteOmrBaseUrls: explicit URL first, then the Vercel defaults. */
function remoteBaseUrls(): string[] {
    const urls: string[] = [];
    const configured = process.env.OMR_SERVICE_URL?.trim();
    if (configured) urls.push(configured.replace(/\/+$/, ""));

    const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
    if (production) urls.push(`https://${production.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`);

    const vercel = process.env.VERCEL_URL?.trim();
    if (vercel) urls.push(`https://${vercel.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`);

    return [...new Set(urls)];
}

interface CleanResponse {
    ok: boolean;
    image_b64?: string;
    restore_b64?: string;
    error?: string;
}

/**
 * Which stages of the pipeline to run. All on by default — the flags exist so a
 * stage can be dropped for a scan that does better without it, without a code
 * change. See integrations/bg-remover/bgremove/pipeline.py for the order.
 */
export interface CleanOptions {
    /** Cut the drawing out and repaint whatever surrounds it white. */
    removeBg?: boolean;
    /** Level the lighting and colour cast. */
    whiten?: boolean;
    /** Sharpen strokes and deepen the ink. */
    enhance?: boolean;
    /** Passed to whiten_paper: 0 leaves tone alone, 1 corrects fully. */
    strength?: number;
    /**
     * Also return a copy with separation skipped, for the touch-up brush to
     * restore from. It is levelled and sharpened like the main result, so a
     * restored patch lands on white paper rather than pasting the original
     * paper cast back as a coloured smear.
     */
    withRestoreCopy?: boolean;
}

export interface CleanResult {
    cleaned: Buffer;
    /** Present only when withRestoreCopy was set. */
    restore?: Buffer;
}

const DEFAULTS: Required<CleanOptions> = {
    removeBg: true,
    whiten: true,
    enhance: true,
    strength: 1.0,
    withRestoreCopy: false,
};

async function cleanRemote(png: Buffer, opts: Required<CleanOptions>): Promise<CleanResult> {
    const token = process.env.OMR_SERVICE_TOKEN?.trim();
    let lastError = "No OMR service URL configured.";

    for (const base of remoteBaseUrls()) {
        try {
            const res = await fetch(`${base}/api/bg-clean`, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    ...(token ? { "x-omr-service-token": token } : {}),
                },
                body: JSON.stringify({
                    // JPEG would halve the request body (see spec §12), but the
                    // input here is a crop region, not a full page, so PNG stays
                    // well inside Vercel's 4.5MB limit and avoids artefacts.
                    image_b64: png.toString("base64"),
                    strength: opts.strength,
                    remove_bg: opts.removeBg,
                    whiten: opts.whiten,
                    enhance: opts.enhance,
                    with_restore: opts.withRestoreCopy,
                }),
            });

            const body = (await res.json()) as CleanResponse;
            if (!res.ok || !body.ok || !body.image_b64) {
                // `error` is TYPED as a string but arrives from another service,
                // so it is only a string by agreement. FastAPI validation errors
                // come back as `detail: [...]`, and a proxy or platform error
                // page can put anything here. An object reaching
                // `new Error(...)` below stringifies to the literal text
                // "[object Object]", which is exactly what a user saw in a toast
                // after clicking "Clean background" — a message that says
                // nothing at all about what went wrong.
                lastError =
                    typeof body?.error === "string" && body.error.trim()
                        ? body.error
                        : `bg-clean at ${base} returned ${res.status}`;
                continue;
            }
            return {
                cleaned: Buffer.from(body.image_b64, "base64"),
                restore: body.restore_b64
                    ? Buffer.from(body.restore_b64, "base64")
                    : undefined,
            };
        } catch (err) {
            // Covers the case the service isn't there at all: Netlify does not
            // execute `api/*.py`, so the fetch lands on an HTML page and
            // `res.json()` throws a parse error rather than returning anything
            // shaped like CleanResponse.
            lastError = `bg-clean at ${base}: ${err instanceof Error ? err.message : String(err)}`;
        }
    }

    // `lastError` is a string on every path above, so this can never produce
    // an Error whose message is "[object Object]".
    throw new Error(lastError);
}

async function cleanLocal(png: Buffer, opts: Required<CleanOptions>): Promise<CleanResult> {
    const python = existsSync(LOCAL_PYTHON)
        ? LOCAL_PYTHON
        : process.platform === "win32"
          ? "python"
          : "python3";

    const dir = await mkdtemp(path.join(WORK_ROOT, "job-"));
    const src = path.join(dir, "in.png");
    const dst = path.join(dir, "out.png");
    const restoreDst = path.join(dir, "restore.png");

    try {
        await writeFile(src, png);

        const args = ["-m", "bgremove.cli", "--in", src, "--out", dst, "--strength", String(opts.strength)];
        if (!opts.removeBg) args.push("--no-remove-bg");
        if (!opts.whiten) args.push("--no-whiten");
        if (!opts.enhance) args.push("--no-enhance");
        if (opts.withRestoreCopy) args.push("--out-restore", restoreDst);

        const { stdout } = await execFileAsync(
            python,
            args,
            {
                cwd: BG_ROOT,
                env: { ...process.env, PYTHONPATH: BG_ROOT },
                timeout: 120_000,
                maxBuffer: 4 * 1024 * 1024,
            }
        );

        const result = JSON.parse(stdout.trim() || "{}") as CleanResponse;
        if (!result.ok) throw new Error(result.error ?? "Cleaning failed.");

        return {
            cleaned: await readFile(dst),
            restore: opts.withRestoreCopy ? await readFile(restoreDst) : undefined,
        };
    } finally {
        await rm(dir, { recursive: true, force: true }).catch(() => {});
    }
}

/**
 * Run the cleaning pipeline over a PNG: background removal, then paper
 * levelling, then ink strengthening.
 *
 * Throws on failure — callers that treat cleaning as cosmetic should catch and
 * fall back to the original buffer rather than failing the whole operation.
 */
export async function cleanPage(png: Buffer, options: CleanOptions = {}): Promise<CleanResult> {
    const { mkdir } = await import("node:fs/promises");
    await mkdir(WORK_ROOT, { recursive: true });

    const opts = { ...DEFAULTS, ...options };

    return remoteBaseUrls().length > 0
        ? cleanRemote(png, opts)
        : cleanLocal(png, opts);
}
