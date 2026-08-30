import { requiredPersonaIds, test, expect } from "../fixtures/auth";
import {
    assertCriticalActionReachable,
    assertNoDocumentHorizontalOverflow,
    assertVisibleOverlaysContained,
    captureResponsiveScreenshot,
} from "../support/assertions";
import { attachAndAssertNoBrowserIssues } from "../support/diagnostics";

for (const personaId of requiredPersonaIds) {
    test.describe(`authenticated ${personaId}`, () => {
        test.use({ authPersona: personaId });

        test("dashboard fixture is live, contained, and operable", async ({ authenticatedSession }, testInfo) => {
            if (!authenticatedSession) {
                test.skip(
                    true,
                    "E2E_AUTH_MANIFEST is not configured; protected flow is an explicit fixture gap",
                );
                return;
            }

            const { page, persona, issues } = authenticatedSession;
            await page.goto(persona.homePath, { waitUntil: "domcontentloaded" });

            await expect(page).toHaveURL(new RegExp(`${persona.homePath.replace("/", "\\/")}(?:[?#]|$)`));
            await expect(page.locator("body")).toContainText(persona.identityText);
            await expect(page.locator("body")).toContainText(persona.organizationName);
            await assertNoDocumentHorizontalOverflow(page);
            await assertVisibleOverlaysContained(page);

            if (persona.criticalActionName) {
                const action = page.getByRole("link", { name: persona.criticalActionName }).first();
                if (!(await action.isVisible())) {
                    const openSidebar = page.getByRole("button", { name: "Open sidebar" });
                    if (await openSidebar.isVisible()) await openSidebar.click();
                }
                await assertCriticalActionReachable(action);
            }

            await captureResponsiveScreenshot(page, testInfo, `authenticated-${personaId}-dashboard`);
            await attachAndAssertNoBrowserIssues(issues, testInfo);
        });
    });
}
