import {
    applyLongLocalizedLandingFixture,
    installDeterministicPublicAssets,
} from "../fixtures/content";
import {
    assertCriticalActionReachable,
    assertNoDocumentHorizontalOverflow,
    assertViewportContained,
    assertVisibleOverlaysContained,
    captureResponsiveScreenshot,
} from "../support/assertions";
import { expect, test } from "../support/diagnostics";

test.describe("public landing responsive smoke", () => {
    test("default content is contained, operable, and error-free", async ({ page, browserIssues }, testInfo) => {
        void browserIssues;
        await installDeterministicPublicAssets(page);
        await page.goto("/", { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("networkidle");

        await expect(page).toHaveTitle(/Eduents/i);
        await expect(page.locator("section").first().getByRole("heading", { level: 1 })).toContainText(
            "Create exams effortlessly",
        );
        await assertNoDocumentHorizontalOverflow(page);
        await assertCriticalActionReachable(
            page.locator("section").first().getByRole("link", { name: "Get Started Free" }),
        );
        await assertCriticalActionReachable(
            page.locator("section").first().getByRole("link", { name: "Watch Demo" }),
        );

        const header = page.locator("header");
        const width = page.viewportSize()?.width ?? 0;
        if (width < 768) {
            const menuToggle = header.getByRole("button", { name: "Toggle menu" });
            await assertCriticalActionReachable(menuToggle);
            await menuToggle.click();

            for (const item of ["Home", "Features", "Pricing", "Contact"]) {
                await assertViewportContained(header.getByRole("button", { name: item }));
            }
            await assertCriticalActionReachable(header.getByRole("link", { name: "Get Started" }));
        } else {
            await assertCriticalActionReachable(header.getByRole("link", { name: "Get Started" }));
        }

        await assertVisibleOverlaysContained(page);
        await assertNoDocumentHorizontalOverflow(page);
        await captureResponsiveScreenshot(page, testInfo, "landing-default");
    });

    test("long localized expansion remains reflowed", async ({ page, browserIssues }, testInfo) => {
        void browserIssues;
        await installDeterministicPublicAssets(page);
        await page.goto("/", { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("networkidle");
        await applyLongLocalizedLandingFixture(page);

        await expect(page.locator("section").first().getByRole("heading", { level: 1 })).toContainText(
            "Prüfungsunterlagenerstellung",
        );
        await assertNoDocumentHorizontalOverflow(page);
        await assertCriticalActionReachable(
            page.locator("section").first().getByRole("link", { name: "Get Started Free" }),
        );
        await captureResponsiveScreenshot(page, testInfo, "landing-long-localized");
    });
});
