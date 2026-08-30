import fs from "node:fs";
import path from "node:path";
import { expect, type Locator, type Page, type TestInfo } from "@playwright/test";

type OverflowReport = {
    clientWidth: number;
    scrollWidth: number;
    offenders: Array<{
        element: string;
        left: number;
        right: number;
        width: number;
    }>;
};

export async function assertNoDocumentHorizontalOverflow(page: Page, tolerance = 1) {
    const report = await page.evaluate((allowedTolerance): OverflowReport => {
        const root = document.documentElement;
        const viewportWidth = root.clientWidth;
        const offenders = Array.from(document.body.querySelectorAll<HTMLElement>("*"))
            .filter((element) => {
                const style = window.getComputedStyle(element);
                if (style.position === "fixed" || style.display === "none" || style.visibility === "hidden") {
                    return false;
                }
                const rect = element.getBoundingClientRect();
                return rect.left < -allowedTolerance || rect.right > viewportWidth + allowedTolerance;
            })
            .slice(0, 20)
            .map((element) => {
                const rect = element.getBoundingClientRect();
                return {
                    element: [
                        element.tagName.toLowerCase(),
                        element.id ? `#${element.id}` : "",
                        ...Array.from(element.classList).slice(0, 3).map((name) => `.${name}`),
                    ].join(""),
                    left: Math.round(rect.left),
                    right: Math.round(rect.right),
                    width: Math.round(rect.width),
                };
            });

        return {
            clientWidth: viewportWidth,
            scrollWidth: root.scrollWidth,
            offenders,
        };
    }, tolerance);

    expect(
        report.scrollWidth,
        `document overflowed horizontally; candidate offenders: ${JSON.stringify(report.offenders)}`,
    ).toBeLessThanOrEqual(report.clientWidth + tolerance);
}

export async function assertViewportContained(locator: Locator, padding = 0) {
    await expect(locator).toBeVisible();
    const box = await locator.boundingBox();
    expect(box, "visible surface did not have a bounding box").not.toBeNull();

    const viewport = await locator.page().evaluate(() => ({
        width: window.visualViewport?.width ?? window.innerWidth,
        height: window.visualViewport?.height ?? window.innerHeight,
        offsetLeft: window.visualViewport?.offsetLeft ?? 0,
        offsetTop: window.visualViewport?.offsetTop ?? 0,
    }));

    expect(box!.x).toBeGreaterThanOrEqual(viewport.offsetLeft + padding - 1);
    expect(box!.y).toBeGreaterThanOrEqual(viewport.offsetTop + padding - 1);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.offsetLeft + viewport.width - padding + 1);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.offsetTop + viewport.height - padding + 1);
}

export async function assertCriticalActionReachable(action: Locator) {
    await action.scrollIntoViewIfNeeded();
    await expect(action).toBeVisible();
    await expect(action).toBeEnabled();
    await assertViewportContained(action);

    const receivesPointer = await action.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const hit = document.elementFromPoint(centerX, centerY);
        return Boolean(hit && (hit === element || element.contains(hit)));
    });

    expect(receivesPointer, "critical action is covered at its center point").toBe(true);
}

export async function assertVisibleOverlaysContained(page: Page) {
    const overlays = page.locator(
        '[role="dialog"]:visible, [role="menu"]:visible, [role="listbox"]:visible, [data-radix-popper-content-wrapper]:visible',
    );

    for (let index = 0; index < (await overlays.count()); index += 1) {
        await assertViewportContained(overlays.nth(index));
    }
}

export async function captureResponsiveScreenshot(page: Page, testInfo: TestInfo, name: string) {
    const evidencePath = testInfo.outputPath(
        "evidence",
        `${name}-${testInfo.project.name}.png`,
    );
    fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
    await page.screenshot({ path: evidencePath, fullPage: true, animations: "disabled" });
    await testInfo.attach(`${name}-${testInfo.project.name}.png`, {
        path: evidencePath,
        contentType: "image/png",
    });
}
