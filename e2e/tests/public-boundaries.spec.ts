import { expect, test } from "../support/diagnostics";

const representativeProjects = new Set(["phone-390", "tablet-768", "desktop-1440"]);

test.describe("public and non-auth boundaries", () => {
    test.beforeEach(({}, testInfo) => {
        test.skip(
            !representativeProjects.has(testInfo.project.name),
            "auth-boundary state runs at representative phone/tablet/desktop widths",
        );
    });

    test("anonymous API access is rejected without leaking protected data", async ({ request }) => {
        const response = await request.get("/api/questions", { maxRedirects: 0 });

        expect(response.status()).toBe(401);
        await expect(response.json()).resolves.toMatchObject({
            success: false,
            error: "Authentication required.",
        });
    });
});
