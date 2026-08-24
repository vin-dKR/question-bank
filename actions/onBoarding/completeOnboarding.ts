'use server'

import prisma from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth/session';
import { provisionOrganizationForOnboarding } from '@/lib/auth/provisionOrg';

/**
 * Completes onboarding and — the point of the WorkOS work — makes sure the user
 * has an ORGANIZATION.
 *
 * The org is created silently. Neither path shows the user the word
 * "organization": a solo teacher fills in their name/school/subject and gets an
 * org named after their school; a coaching centre gets one named after the
 * centre. Later, when member management ships, the org is already there with a
 * sensible name and nothing has to be migrated.
 *
 * In practice the org usually already exists by the time this runs — the user
 * signed in first, and `getAuthContext()` provisions a personal org on the
 * first authenticated request. This call RENAMES that org rather than creating
 * a second one, which keeps `Organization.id` stable.
 *
 * Two things that used to be here are gone:
 *   - the Clerk `publicMetadata.onboardingComplete` write. AuthKit sessions
 *     carry no arbitrary app metadata; onboarding state is now `User.role`
 *     being non-empty, read in `getAuthContext()` (doc §6).
 *   - the `if (!user) throw "User not found in database"` race. Provisioning is
 *     lazy and idempotent now, so by the time any server action runs the row
 *     exists (doc §7).
 */
export const completeOnboarding = async (formData: FormData) => {
    const ctx = await getAuthContext();

    if (!ctx) {
        throw new Error("Unauthorized");
    }

    const rawRole = formData.get("role");
    const role = typeof rawRole === "string" ? rawRole : null;

    if (!role) {
        return { error: "Role is missing or invalid." };
    }

    // Students do not self-onboard (doc §3). The route still exists for when
    // student logins are switched on, but nothing should be reaching it today —
    // reject rather than silently creating a role the rest of the app no longer
    // offers a path into.
    if (!['teacher', 'coaching'].includes(role)) {
        return { error: "That account type isn't available." };
    }

    try {
        await prisma.user.update({
            where: { id: ctx.userId },
            data: { role },
        });

        // Name the org from whatever the user just told us, and remember which
        // profile fields belong on the org rather than the person (doc §4:
        // CoachingData is really Organization data).
        let orgName: string | null = null;
        let orgType: 'personal' | 'coaching' = 'personal';
        let orgProfile: Parameters<typeof provisionOrganizationForOnboarding>[0]['profile'] = {};

        if (role === 'teacher') {
            const name = formData.get('name') as string;
            const email = formData.get('email') as string;
            const school = formData.get('school') as string;

            await prisma.teacherData.upsert({
                where: { userId: ctx.userId },
                update: {
                    name,
                    email,
                    school,
                    subject: formData.get('subject') as string,
                    experience: formData.get('experience') as string || null,
                    studentCount: formData.get('studentCount') as string || null,
                },
                create: {
                    userId: ctx.userId,
                    name,
                    email,
                    school,
                    subject: formData.get('subject') as string,
                    experience: formData.get('experience') as string || null,
                    studentCount: formData.get('studentCount') as string || null,
                }
            });

            // A solo teacher still gets an institution — named after the school
            // they typed, falling back to their own name. `type` stays
            // 'personal' so we can tell a one-person org from a real centre.
            orgName = school?.trim() || null;
            orgType = 'personal';
            orgProfile = { contactPerson: name, contactEmail: email };
        } else if (role === 'coaching') {
            // Handle targetExams - can be JSON string or comma-separated
            const targetExamsRaw = formData.get('targetExams') as string;
            let targetExams: string[] = [];
            if (targetExamsRaw) {
                try {
                    // Try parsing as JSON first
                    const parsed = JSON.parse(targetExamsRaw);
                    targetExams = Array.isArray(parsed) ? parsed : [parsed];
                } catch {
                    // If not JSON, try splitting by comma
                    targetExams = targetExamsRaw.split(',').filter(e => e.trim());
                }
            }

            const centerName = formData.get('centerName') as string;
            const contactPerson = formData.get('contactPerson') as string;
            const email = formData.get('email') as string;
            const phone = formData.get('phone') as string;
            const location = formData.get('location') as string;

            await prisma.coachingData.upsert({
                where: { userId: ctx.userId },
                update: {
                    centerName,
                    contactPerson,
                    email,
                    phone,
                    location,
                    teacherCount: formData.get('teacherCount') as string || null,
                    studentCount: formData.get('studentCount') as string || null,
                    targetExams,
                },
                create: {
                    userId: ctx.userId,
                    centerName,
                    contactPerson,
                    email,
                    phone,
                    location,
                    teacherCount: formData.get('teacherCount') as string || null,
                    studentCount: formData.get('studentCount') as string || null,
                    targetExams,
                }
            });

            orgName = centerName?.trim() || null;
            orgType = 'coaching';
            orgProfile = { contactPerson, contactEmail: email, phone, location, targetExams };
        }

        const org = await provisionOrganizationForOnboarding({
            userId: ctx.userId,
            workosUserId: ctx.workosUserId,
            email: ctx.email,
            userName: ctx.name,
            orgName,
            type: orgType,
            profile: orgProfile,
        });

        if (!org) {
            // The profile saved and the role is set, so the user is onboarded.
            // Only the org is missing, and `getAuthContext()` retries creating
            // it on the next request — don't block the user on it.
            console.error("[completeOnboarding] org provisioning failed for user", ctx.userId);
        }

        return { message: 'Onboarding completed successfully' };
    } catch (err) {
        console.error("CompleteOnboarding error:", err);

        // Handle Prisma database connection errors by checking error name/type
        if (err && typeof err === 'object') {
            const errorObj = err as {
                name?: string;
                message?: string;
                errorCode?: string;
                clientVersion?: string;
                code?: string;
                meta?: unknown;
            };

            const errorName = errorObj.name || '';
            const errorMessage = errorObj.message || '';

            // Check for Prisma initialization errors (connection issues)
            if (errorName === 'PrismaClientInitializationError' ||
                errorName.includes('PrismaClientInitialization') ||
                errorMessage.includes('Error creating a database connection') ||
                errorMessage.includes('DNS resolution')) {

                console.error("Prisma initialization error:", {
                    message: errorMessage,
                    errorCode: errorObj.errorCode,
                    clientVersion: errorObj.clientVersion,
                });

                if (errorMessage.includes('DNS resolution') ||
                    errorMessage.includes('connection') ||
                    errorMessage.includes('no record found')) {
                    return {
                        error: 'Unable to connect to the database. Please check your network connection and try again. If the problem persists, contact support.'
                    };
                }

                return {
                    error: 'Database connection error. Please try again in a moment. If the problem persists, contact support.'
                };
            }

            // Check for Prisma known request errors
            if (errorName === 'PrismaClientKnownRequestError' ||
                errorName.includes('PrismaClientKnownRequest')) {

                console.error("Prisma request error:", {
                    message: errorMessage,
                    code: errorObj.code,
                    meta: errorObj.meta,
                });

                return {
                    error: 'Database operation failed. Please try again. If the problem persists, contact support.'
                };
            }

            // Handle other Prisma errors
            if (errorName.includes('Prisma') || errorName.includes('prisma')) {
                console.error("Prisma error:", {
                    name: errorName,
                    message: errorMessage,
                });
                return {
                    error: 'Database error occurred. Please try again. If the problem persists, contact support.'
                };
            }
        }

        let errorMessage = 'There was an error completing your onboarding.';
        if (err instanceof Error) {
            errorMessage = err.message || errorMessage;
            console.error("Error details:", {
                message: err.message,
                stack: err.stack,
                name: err.name,
            });
        } else if (typeof err === 'object' && err !== null) {
            const errorObj = err as { message?: string; errors?: Array<{ message?: string }> };
            if (errorObj.message) {
                errorMessage = errorObj.message;
            } else if (errorObj.errors && errorObj.errors.length > 0) {
                errorMessage = errorObj.errors[0].message || errorMessage;
            }
        }

        return { error: errorMessage };
    }
}
