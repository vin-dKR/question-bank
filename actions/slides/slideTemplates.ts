"use server";

/**
 * CRUD for slide-deck layouts built in the PPT template maker.
 *
 * The deck itself is stored as JSON in the shape of types/slides.ts. It is
 * validated on the way in so a malformed layout can never reach generation.
 *
 * Authorization follows doc §13: `organizationId` decides who may see and write a
 * template, `userId` only records who authored it. Admins work outside any org, so
 * their templates carry a null organizationId and are addressed by author instead.
 */
import prisma from "@/lib/prisma";
import { requireUser, type AuthedUser } from "@/lib/auth/guard";
import { AuthError } from "@/lib/auth/session";
import { validateTemplate, type SlideTemplate } from "@/types/slides";

export interface StoredSlideTemplate {
    id: string;
    name: string;
    themeId: string;
    slides: SlideTemplate;
    updatedAt: string;
}

type Result<T> = { success: true; data: T } | { success: false; error: string };

/**
 * The rows a user may read or write. An org member sees their org's templates; an
 * admin (who has no org) sees the ones they authored.
 */
function scopeFor(user: AuthedUser) {
    return user.organizationId
        ? { organizationId: user.organizationId }
        : { organizationId: null, userId: user.userId };
}

function serialize(t: {
    id: string;
    name: string;
    themeId: string;
    slides: unknown;
    updatedAt: Date;
}): StoredSlideTemplate {
    return {
        id: t.id,
        name: t.name,
        themeId: t.themeId,
        slides: t.slides as SlideTemplate,
        updatedAt: t.updatedAt.toISOString(),
    };
}

const SELECT = {
    id: true,
    name: true,
    themeId: true,
    slides: true,
    updatedAt: true,
} as const;

/** AuthError means "not signed in"; anything else is a genuine fault. */
function toMessage(err: unknown, fallback: string): string {
    if (err instanceof AuthError) return "Not signed in.";
    return fallback;
}

export async function listSlideTemplates(): Promise<Result<StoredSlideTemplate[]>> {
    try {
        const user = await requireUser();
        const rows = await prisma.slideTemplate.findMany({
            where: scopeFor(user),
            orderBy: { updatedAt: "desc" },
            select: SELECT,
        });
        return { success: true, data: rows.map(serialize) };
    } catch (err) {
        console.error("[listSlideTemplates]", err);
        return { success: false, error: toMessage(err, "Could not load your templates.") };
    }
}

export async function saveSlideTemplate(input: {
    id?: string;
    name: string;
    themeId: string;
    slides: SlideTemplate;
}): Promise<Result<StoredSlideTemplate>> {
    try {
        const user = await requireUser();

        const name = input.name?.trim();
        if (!name) return { success: false, error: "Give the template a name." };

        const problems = validateTemplate(input.slides);
        if (problems.length) return { success: false, error: problems[0] };

        const data = {
            name,
            themeId: input.themeId,
            // Cast through unknown: Prisma's Json input type does not accept our
            // structured element union directly, though the shape is what we want.
            slides: input.slides as unknown as object,
        };

        if (input.id) {
            // Scoped lookup first, so an id belonging to another org is a no-op
            // rather than a cross-tenant write.
            const owned = await prisma.slideTemplate.findFirst({
                where: { id: input.id, ...scopeFor(user) },
                select: { id: true },
            });
            if (!owned) return { success: false, error: "Template not found." };

            const updated = await prisma.slideTemplate.update({
                where: { id: input.id },
                data,
                select: SELECT,
            });
            return { success: true, data: serialize(updated) };
        }

        const created = await prisma.slideTemplate.create({
            data: {
                ...data,
                userId: user.userId,
                // Stamped from the session, never accepted from the caller.
                organizationId: user.isAdmin ? null : user.organizationId,
            },
            select: SELECT,
        });
        return { success: true, data: serialize(created) };
    } catch (err) {
        console.error("[saveSlideTemplate]", err);
        return { success: false, error: toMessage(err, "Could not save the template.") };
    }
}

export async function deleteSlideTemplate(id: string): Promise<Result<null>> {
    try {
        const user = await requireUser();

        const owned = await prisma.slideTemplate.findFirst({
            where: { id, ...scopeFor(user) },
            select: { id: true },
        });
        if (!owned) return { success: false, error: "Template not found." };

        await prisma.slideTemplate.delete({ where: { id } });
        return { success: true, data: null };
    } catch (err) {
        console.error("[deleteSlideTemplate]", err);
        return { success: false, error: toMessage(err, "Could not delete the template.") };
    }
}
