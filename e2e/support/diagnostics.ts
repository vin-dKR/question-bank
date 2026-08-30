import fs from "node:fs";
import path from "node:path";
import { expect, test as base, type Page, type TestInfo } from "@playwright/test";

export type BrowserIssue = {
    kind: "console" | "pageerror";
    message: string;
    location?: string;
};

export function monitorBrowserIssues(page: Page) {
    const issues: BrowserIssue[] = [];

    page.on("console", (message) => {
        if (message.type() !== "error") return;

        const location = message.location();
        issues.push({
            kind: "console",
            message: message.text(),
            location: location.url
                ? `${location.url}:${location.lineNumber ?? 0}:${location.columnNumber ?? 0}`
                : undefined,
        });
    });

    page.on("pageerror", (error) => {
        issues.push({ kind: "pageerror", message: error.stack ?? error.message });
    });

    return issues;
}

export async function attachAndAssertNoBrowserIssues(
    issues: BrowserIssue[],
    testInfo: TestInfo,
) {
    const evidencePath = testInfo.outputPath(
        "evidence",
        `browser-issues-${testInfo.project.name}.json`,
    );
    fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
    fs.writeFileSync(evidencePath, JSON.stringify(issues, null, 2));
    await testInfo.attach("browser-issues.json", {
        path: evidencePath,
        contentType: "application/json",
    });

    expect(issues, "unexpected console.error or uncaught page error").toEqual([]);
}

export const test = base.extend<{ browserIssues: BrowserIssue[] }>({
    browserIssues: async ({ page }, use, testInfo) => {
        const issues = monitorBrowserIssues(page);
        await use(issues);
        await attachAndAssertNoBrowserIssues(issues, testInfo);
    },
});

export { expect } from "@playwright/test";
