"use server";

/**
 * Background artwork for slide templates.
 *
 * Two ways in, because institutes hold their branding in two forms:
 *
 *   - an image they already have (PNG/JPG), used as-is
 *   - their existing .pptx template, from which we lift the embedded artwork
 *
 * A .pptx is a zip of OOXML, so its pictures sit in `ppt/media/`. That is enough
 * for the common case, where the design is a full-bleed background image. It is
 * NOT enough when the design is drawn with vector shapes and text boxes — there is
 * no picture to extract then, and the caller is told so rather than being handed a
 * silently empty result. Reproducing arbitrary OOXML layouts is a different and
 * much larger job; pptxgenjs writes decks but cannot read them.
 */
import JSZip from "jszip";
import { requireUser } from "@/lib/auth/guard";
import { supabaseServer, SUPABASE_IMAGE_BUCKET } from "@/lib/supabase";

type Result<T> = { success: true; data: T } | { success: false; error: string };

/** Server actions are capped at 10mb (next.config.ts); stay under it. */
const MAX_BYTES = 8 * 1024 * 1024;
/** Ignore icons and bullets — a background is never this small. */
const MIN_IMAGE_BYTES = 20 * 1024;

const IMAGE_MIME: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    bmp: "image/bmp",
};

function parseDataUrl(dataUrl: string): { mime: string; buffer: Buffer } | null {
    // [\s\S] rather than `.` with the /s flag: the project targets ES2017, where
    // dotAll is not available.
    const m = /^data:([^;,]+)(;base64)?,([\s\S]*)$/.exec(dataUrl);
    if (!m) return null;
    const [, mime, isBase64, payload] = m;
    return {
        mime,
        buffer: isBase64
            ? Buffer.from(payload, "base64")
            : Buffer.from(decodeURIComponent(payload), "utf8"),
    };
}

async function upload(buffer: Buffer, mime: string, path: string): Promise<string | null> {
    const supabase = supabaseServer();
    const { error } = await supabase.storage.from(SUPABASE_IMAGE_BUCKET).upload(path, buffer, {
        contentType: mime,
        cacheControl: "31536000",
        upsert: true,
    });
    if (error) {
        console.error(`[slide-bg] upload failed ${path}:`, error);
        return null;
    }
    return supabase.storage.from(SUPABASE_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Scope uploads by org so one tenant's artwork is not addressable by another. */
function folderFor(user: { organizationId: string | null; userId: string }) {
    return `slide-backgrounds/${user.organizationId ?? `user-${user.userId}`}`;
}

/** A plain image straight to storage. */
export async function uploadBackgroundImage(
    dataUrl: string,
    filename: string
): Promise<Result<string>> {
    try {
        const user = await requireUser();

        const parsed = parseDataUrl(dataUrl);
        if (!parsed) return { success: false, error: "That file could not be read." };
        if (!parsed.mime.startsWith("image/")) {
            return { success: false, error: "Please choose an image file." };
        }
        if (parsed.buffer.length > MAX_BYTES) {
            return {
                success: false,
                error: `Image is ${(parsed.buffer.length / 1024 / 1024).toFixed(1)}MB. The limit is 8MB.`,
            };
        }

        const ext = (filename.split(".").pop() ?? "png").toLowerCase().replace(/[^a-z0-9]/g, "");
        const path = `${folderFor(user)}/${Date.now().toString(36)}.${ext || "png"}`;

        const url = await upload(parsed.buffer, parsed.mime, path);
        return url
            ? { success: true, data: url }
            : { success: false, error: "Upload failed. Try again." };
    } catch (err) {
        console.error("[uploadBackgroundImage]", err);
        return { success: false, error: "Could not upload that image." };
    }
}

export interface PptxArtwork {
    url: string;
    /** Original name inside the archive, so the picker can label it. */
    name: string;
    bytes: number;
}

/**
 * Pull the pictures out of an uploaded .pptx and store them, largest first — the
 * background is almost always the biggest asset in the file.
 */
export async function extractPptxBackgrounds(
    dataUrl: string
): Promise<Result<PptxArtwork[]>> {
    try {
        const user = await requireUser();

        const parsed = parseDataUrl(dataUrl);
        if (!parsed) return { success: false, error: "That file could not be read." };
        if (parsed.buffer.length > MAX_BYTES) {
            return {
                success: false,
                error: `File is ${(parsed.buffer.length / 1024 / 1024).toFixed(1)}MB. The limit is 8MB.`,
            };
        }

        let zip: JSZip;
        try {
            zip = await JSZip.loadAsync(parsed.buffer);
        } catch {
            return { success: false, error: "That does not look like a .pptx file." };
        }

        // Sanity-check it really is a presentation, not just any zip.
        if (!zip.file("ppt/presentation.xml")) {
            return { success: false, error: "That .pptx has no presentation inside it." };
        }

        const media = Object.values(zip.files).filter((f) => {
            if (f.dir) return false;
            if (!f.name.startsWith("ppt/media/")) return false;
            const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
            return ext in IMAGE_MIME;
        });

        if (!media.length) {
            return {
                success: false,
                error: "No images found in that template. Its design is probably drawn with shapes rather than a background picture — export a slide as an image and upload that instead.",
            };
        }

        const folder = folderFor(user);
        const stamp = Date.now().toString(36);
        const out: PptxArtwork[] = [];

        for (const f of media) {
            const buffer = await f.async("nodebuffer");
            if (buffer.length < MIN_IMAGE_BYTES) continue;

            const base = f.name.split("/").pop() ?? "image.png";
            const ext = base.split(".").pop()?.toLowerCase() ?? "png";
            const url = await upload(
                buffer,
                IMAGE_MIME[ext] ?? "image/png",
                `${folder}/${stamp}-${base}`
            );
            if (url) out.push({ url, name: base, bytes: buffer.length });
        }

        if (!out.length) {
            return {
                success: false,
                error: "Only small icons were found in that template — nothing usable as a background.",
            };
        }

        // Biggest first: the background outweighs logos and icons.
        out.sort((a, b) => b.bytes - a.bytes);
        return { success: true, data: out };
    } catch (err) {
        console.error("[extractPptxBackgrounds]", err);
        return { success: false, error: "Could not read that .pptx." };
    }
}
