import "server-only";
import type { Prisma } from "@/generated/prisma";

/**
 * Tenancy for the question bank (doc §13, and the `DECIDED` comment on
 * `Question` in the schema).
 *
 * Two tiers, one bank:
 *   organizationId = null   -> the GLOBAL shared bank. Every org reads it, no
 *                              org writes it.
 *   organizationId = <org>  -> uploaded by that org. Only that org reads or
 *                              writes it.
 *
 * The write half of this rule has been enforced since the WorkOS migration —
 * `createQuestion` stamps the org, `assertCanMutateQuestion` guards edits. THE
 * READ HALF DID NOT EXIST. Every question read in the product returned the whole
 * collection, so the first question any organization uploaded would have been
 * correctly marked as theirs and then shown to every other customer. Nothing
 * prevented that except nobody having uploaded one yet.
 *
 * TWO TRAPS ARE BAKED INTO THE SHAPE HERE, DELIBERATELY:
 *
 * 1. `{ organizationId: null }` on MongoDB matches documents where the field
 *    EXISTS AND IS NULL. It does not match documents where the field is ABSENT
 *    (doc §11a). Every one of the 5,445 shared questions was normalised to an
 *    explicit null by the T-02 backfill precisely so this filter can see them —
 *    but any row written by a path that OMITS the field is invisible to it, and
 *    invisible means "gone from the product for everyone". That is why every
 *    create path must pass `organizationId` explicitly, null included.
 *
 * 2. The clause is composed with `AND`, never by assigning `where.OR`. Several
 *    callers already build their own top-level `OR` for text search, and a
 *    second assignment silently REPLACES the first — returning the wrong rows
 *    rather than erroring. `AND: [tenancy, rest]` cannot collide.
 */

/** The two tiers this caller may read: the global bank, plus their own org. */
export function questionTenancyFilter(
    organizationId: string | null
): Prisma.QuestionWhereInput {
    const tiers: Prisma.QuestionWhereInput[] = [{ organizationId: null }];
    if (organizationId) tiers.push({ organizationId });
    return { OR: tiers };
}

/**
 * Wraps a caller's `where` with the tenancy clause.
 *
 * Always use this rather than merging by hand — see trap 2 above.
 */
export function scopeQuestionWhere(
    where: Prisma.QuestionWhereInput,
    organizationId: string | null
): Prisma.QuestionWhereInput {
    return { AND: [questionTenancyFilter(organizationId), where] };
}
