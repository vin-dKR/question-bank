"use server";

/**
 * Whitens the paper behind one diagram during review, before anything is saved.
 *
 * The Verifier holds crops in memory as {bbox, dataUrl} against the page's
 * sourceDataUrl, so there is no row to address yet — cleanCropBackground works on
 * saved SchoolTestQuestion rows and is the post-save counterpart to this.
 *
 * The page is sent rather than the crop on purpose. whiten_paper estimates the
 * paper colour from a pixel's surroundings, and a tight crop is mostly ink, so
 * cleaning it in isolation reads the ink as paper and washes the drawing out
 * (bg-remover spec §10). Cutting a padded region from the page here and trimming
 * back afterwards keeps the estimate honest.
 */
import sharp from "sharp";
import { requireUser } from "@/lib/auth/guard";
import { cleanPage } from "@/lib/school-test/clean";

/** Extra paper around the bbox, as a fraction of its size. See cleanCropBackground. */
const PAD_RATIO = 0.35;

export interface CleanCropRegionInput {
    /** The full page, as held by the Verifier. */
    pageDataUrl: string;
    /** [x, y, w, h] in the page's pixel coordinates. */
    bbox: [number, number, number, number];
    strength?: number;
}

type Result =
    | {
          success: true;
          dataUrl: string;
          /**
           * What the touch-up brush restores from: the same crop levelled and
           * sharpened, but with separation skipped so nothing is missing. Restoring
           * from the raw crop instead pastes the original paper cast back in as a
           * coloured smear.
           */
          restoreDataUrl: string;
      }
    | { success: false; error: string };

function parseDataUrl(dataUrl: string): Buffer | null {
    const m = /^data:([^;,]+)(;base64)?,([\s\S]*)$/.exec(dataUrl);
    if (!m) return null;
    return m[2] ? Buffer.from(m[3], "base64") : Buffer.from(decodeURIComponent(m[3]), "utf8");
}

export async function cleanCropRegion(input: CleanCropRegionInput): Promise<Result> {
    try {
        await requireUser();

        const page = parseDataUrl(input.pageDataUrl);
        if (!page) return { success: false, error: "Could not read the page image." };

        const meta = await sharp(page).metadata();
        const pw = meta.width ?? 0;
        const ph = meta.height ?? 0;
        if (!pw || !ph) return { success: false, error: "The page image could not be read." };

        const [bx, by, bw, bh] = input.bbox.map((n) => Math.max(0, Math.round(Number(n) || 0)));
        if (bw <= 0 || bh <= 0) return { success: false, error: "That crop has no area." };

        const padX = Math.round(bw * PAD_RATIO);
        const padY = Math.round(bh * PAD_RATIO);

        const left = Math.max(0, bx - padX);
        const top = Math.max(0, by - padY);
        const right = Math.min(pw, bx + bw + padX);
        const bottom = Math.min(ph, by + bh + padY);

        const region = await sharp(page)
            .extract({ left, top, width: right - left, height: bottom - top })
            .png()
            .toBuffer();

        const result = await cleanPage(region, {
            strength: input.strength ?? 1.0,
            withRestoreCopy: true,
        });

        // Trim back to exactly the bbox the user drew — the padding existed only
        // so the estimator had paper to measure. Both copies are cut identically
        // so the brush lines up pixel for pixel.
        const innerLeft = bx - left;
        const innerTop = by - top;
        const window = {
            left: innerLeft,
            top: innerTop,
            width: Math.max(1, Math.min(bw, right - left - innerLeft)),
            height: Math.max(1, Math.min(bh, bottom - top - innerTop)),
        };

        const cleaned = await sharp(result.cleaned).extract(window).png().toBuffer();
        const restore = result.restore
            ? await sharp(result.restore).extract(window).png().toBuffer()
            : cleaned;

        return {
            success: true,
            dataUrl: `data:image/png;base64,${cleaned.toString("base64")}`,
            restoreDataUrl: `data:image/png;base64,${restore.toString("base64")}`,
        };
    } catch (err) {
        console.error("[cleanCropRegion]", err);
        return {
            success: false,
            error: err instanceof Error ? err.message : "Could not clean the diagram.",
        };
    }
}
