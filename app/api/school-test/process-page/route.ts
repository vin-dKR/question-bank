import { NextRequest } from "next/server";
import { getAuthContext } from '@/lib/auth/session';
import { processPage } from "@/lib/school-test/pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY = 8 * 1024 * 1024;

type RequestBody = {
    pageNumber?: number;
    dataUrl?: string;
    width?: number;
    height?: number;
};

function decodeDataUrl(dataUrl: string): Buffer | null {
    const m = dataUrl.match(/^data:image\/(?:png|jpe?g|webp);base64,(.+)$/);
    if (!m) return null;
    try {
        return Buffer.from(m[1], "base64");
    } catch {
        return null;
    }
}

export async function POST(req: NextRequest) {
    const ctx = await getAuthContext();
    if (!ctx) return new Response("Unauthorized", { status: 401 });

    const contentLength = Number(req.headers.get("content-length") ?? 0);
    if (contentLength > MAX_BODY) {
        return new Response("Body too large", { status: 413 });
    }

    let body: RequestBody;
    try {
        body = (await req.json()) as RequestBody;
    } catch {
        return new Response("Invalid JSON body", { status: 400 });
    }

    const { pageNumber, dataUrl, width, height } = body;
    if (
        typeof pageNumber !== "number" ||
        typeof dataUrl !== "string" ||
        typeof width !== "number" ||
        typeof height !== "number"
    ) {
        return new Response(
            "Missing fields — expected { pageNumber, dataUrl, width, height }",
            { status: 400 },
        );
    }

    const buffer = decodeDataUrl(dataUrl);
    if (!buffer) {
        return new Response("Invalid dataUrl — expected data:image/(png|jpeg|webp);base64", {
            status: 400,
        });
    }

    try {
        const result = await processPage(buffer, width, height, pageNumber);
        return Response.json({ result });
    } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        console.error(`[school-test/process-page] page ${pageNumber} failed:`, err);
        const name = err.name && err.name !== "Error" ? `${err.name}: ` : "";
        return new Response(
            `Page ${pageNumber} ${name}${err.message || "unknown error"}`,
            { status: 500 },
        );
    }
}
