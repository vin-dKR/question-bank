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
    const files = form.getAll("file").filter((v): v is File => v instanceof File);
    if (files.length === 0) {
        return new Response("Missing file", { status: 400 });
    }

    const rawProvider = form.get("provider");
    const provider: Provider =
        rawProvider === "gemini" ? "gemini" : "openai";

    for (const f of files) {
        if (f.type !== "application/pdf" && !f.type.startsWith("image/")) {
            return new Response("Unsupported file type", { status: 415 });
        }
        if (f.size > MAX_SIZE) {
            return new Response("File too large", { status: 413 });
        }
    }

    const inputs = await Promise.all(
        files.map(async (f) => ({
            buffer: Buffer.from(await f.arrayBuffer()),
            mime: f.type,
        })),
    );
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const write = (event: ProcessEvent) => {
                controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
            };
            try {
                for await (const event of runPipeline(inputs, provider)) {
                    write(event);
                }
            } catch (e) {
                // runPipeline normally yields its own error events; this catch
                // only fires for unexpected throws that escape the generator.
                // Log with full stack server-side and ship a named, non-empty
                // message to the client so toasts are actionable.
                const err = e instanceof Error ? e : new Error(String(e));
                console.error("[school-test] pipeline crashed:", err);
                const name = err.name && err.name !== "Error" ? `${err.name}: ` : "";
                write({
                    type: "error",
                    message: `Pipeline crashed — ${name}${err.message || "unknown error"}`,
                });
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
