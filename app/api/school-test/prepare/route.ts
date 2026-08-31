import { NextRequest } from "next/server";
import { getAuthContext } from '@/lib/auth/session';
import { pagesFromSingle, previewImage, type PipelineInput } from "@/lib/school-test/pipeline";
import type { PreparedPage } from "@/lib/school-test/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SIZE = 20 * 1024 * 1024;
// Low DPI on purpose: Netlify's sync-function cap is 30 s and pdfjs rendering
// is the long pole for multi-page PDFs. 150 DPI on letter/A4 already lands near
// our 1600 px preview target, so the downstream previewImage() is a no-op.
const RASTERIZE_DPI = 150;

export async function POST(req: NextRequest) {
    const ctx = await getAuthContext();
    if (!ctx) return new Response("Unauthorized", { status: 401 });

    const form = await req.formData();
    const files = form.getAll("file").filter((v): v is File => v instanceof File);
    if (files.length === 0) return new Response("Missing file", { status: 400 });

    for (const f of files) {
        if (f.type !== "application/pdf" && !f.type.startsWith("image/")) {
            return new Response("Unsupported file type", { status: 415 });
        }
        if (f.size > MAX_SIZE) {
            return new Response("File too large", { status: 413 });
        }
    }

    try {
        const out: PreparedPage[] = [];
        let pageNumber = 1;
        for (const f of files) {
            const input: PipelineInput = {
                buffer: Buffer.from(await f.arrayBuffer()),
                mime: f.type,
            };
            const pages = await pagesFromSingle(input, { dpi: RASTERIZE_DPI });
            for (const p of pages) {
                // Run through previewImage to guarantee the payload fits the
                // 1600 px cap — it's a no-op for pages already under that size.
                const preview = await previewImage(p.buffer, p.width, p.height);
                out.push({
                    pageNumber: pageNumber++,
                    dataUrl: preview.dataUrl,
                    width: preview.width,
                    height: preview.height,
                });
            }
        }
        return Response.json({ pages: out });
    } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        console.error("[school-test/prepare] failed:", err);
        const name = err.name && err.name !== "Error" ? `${err.name}: ` : "";
        return new Response(`Prepare failed — ${name}${err.message || "unknown error"}`, {
            status: 500,
        });
    }
}
