import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { runPipeline } from "@/lib/school-test/pipeline";
import type { ProcessEvent, Provider } from "@/lib/school-test/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MAX_SIZE = 20 * 1024 * 1024;

export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return new Response("Unauthorized", { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
        return new Response("Missing file", { status: 400 });
    }

    const rawProvider = form.get("provider");
    const provider: Provider =
        rawProvider === "gemini" ? "gemini" : "openai";

    const mime = file.type;
    if (mime !== "application/pdf" && !mime.startsWith("image/")) {
        return new Response("Unsupported file type", { status: 415 });
    }
    if (file.size > MAX_SIZE) {
        return new Response("File too large", { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const write = (event: ProcessEvent) => {
                controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
            };
            try {
                for await (const event of runPipeline(buffer, mime, provider)) {
                    write(event);
                }
            } catch (e) {
                write({ type: "error", message: (e as Error).message });
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "application/x-ndjson; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
        },
    });
}
