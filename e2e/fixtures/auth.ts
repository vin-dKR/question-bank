import fs from "node:fs";
import path from "node:path";
import { test as base, type BrowserContext, type Page } from "@playwright/test";
import { monitorBrowserIssues } from "../support/diagnostics";

export const requiredPersonaIds = [
    "teacherOwner",
    "instituteAdmin",
    "organizationMember",
    "organizationViewer",
] as const;

export type AuthPersonaId = (typeof requiredPersonaIds)[number];

type AuthPersona = {
    storageState: string;
    kind: "teacher" | "institute";
    organizationRole: "admin" | "teacher" | "member" | "viewer";
    homePath: string;
    identityText: string;
    organizationName: string;
    criticalActionName?: string;
    dataset: "empty" | "populated" | "long-localized";
};

type AuthManifest = {
    schemaVersion: 1;
    personas: Record<AuthPersonaId, AuthPersona>;
};

export type AuthenticatedSession = {
    context: BrowserContext;
    page: Page;
    persona: AuthPersona;
    issues: ReturnType<typeof monitorBrowserIssues>;
};

function readAuthManifest(): { manifest: AuthManifest; directory: string } | null {
    const manifestPath = process.env.E2E_AUTH_MANIFEST;
    if (!manifestPath) return null;

    const absoluteManifestPath = path.resolve(manifestPath);
    const manifest = JSON.parse(fs.readFileSync(absoluteManifestPath, "utf8")) as AuthManifest;

    if (manifest.schemaVersion !== 1 || !manifest.personas) {
        throw new Error(`Invalid E2E auth manifest at ${absoluteManifestPath}`);
    }

    for (const personaId of requiredPersonaIds) {
        if (!manifest.personas[personaId]) {
            throw new Error(`E2E auth manifest is missing personas.${personaId}`);
        }
    }

    return { manifest, directory: path.dirname(absoluteManifestPath) };
}

export const test = base.extend<{
    authPersona: AuthPersonaId;
    authenticatedSession: AuthenticatedSession | null;
}>({
    authPersona: ["teacherOwner", { option: true }],
    authenticatedSession: async ({ browser, authPersona }, use, testInfo) => {
        const loaded = readAuthManifest();
        if (!loaded) {
            await use(null);
            return;
        }

        const persona = loaded.manifest.personas[authPersona];
        const storageState = path.resolve(loaded.directory, persona.storageState);
        if (!fs.existsSync(storageState)) {
            throw new Error(`Missing storage state for ${authPersona}: ${storageState}`);
        }

        const projectUse = testInfo.project.use;
        const context = await browser.newContext({
            ...projectUse.contextOptions,
            storageState,
            baseURL: projectUse.baseURL,
            viewport: projectUse.viewport,
            hasTouch: projectUse.hasTouch,
            isMobile: projectUse.isMobile,
            deviceScaleFactor: projectUse.deviceScaleFactor,
            colorScheme: projectUse.colorScheme,
            locale: projectUse.locale,
            timezoneId: projectUse.timezoneId,
            serviceWorkers: projectUse.serviceWorkers,
        });
        const page = await context.newPage();
        const issues = monitorBrowserIssues(page);

        await use({ context, page, persona, issues });
        await context.close();
    },
});

export { expect } from "@playwright/test";
