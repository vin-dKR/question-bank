import path from "node:path";
import type { Page } from "@playwright/test";

/**
 * Stable expansion data shared by public tests now and authenticated fixtures later.
 * It deliberately combines German-style word length, Devanagari, email addresses,
 * filenames, and wide mathematics from the BLA-112 acceptance criteria.
 */
export const longLocalizedContent = {
    heroTitle:
        "Prüfungsunterlagenerstellung für अंतरराष्ट्रीय शिक्षण-सहयोग — zuverlässig auf jedem Gerät",
    heroDescription:
        "Erstellen, prüfen und veröffentlichen Sie besonders ausführliche Mathematikprüfungen für Lernende, Lehrkräfte und Organisationsadministratorinnen, ohne dass wichtige Aktionen außerhalb des sichtbaren Bereichs verschwinden.",
    organizationName:
        "Internationale Gemeinschaftsschule für Naturwissenschaften und angewandte Mathematik — पुणे",
    invitationEmail:
        "responsive-fixture-with-an-intentionally-long-local-part@example-education.test",
    uploadFilename:
        "semesterabschlusspruefung_mathematik_कक्षा-बारह_mehrseitig_final-v17.pdf",
    math:
        String.raw`\displaystyle \sum_{k=1}^{n}\frac{(-1)^{k+1}}{k}\left(\int_{0}^{\pi}\frac{\sin(kx)}{1+x^2}\,dx\right)=\log(2)+\varepsilon_n`,
} as const;

export const deterministicStateCatalog = {
    states: ["empty", "populated", "loading", "error"] as const,
    content: ["default", "long-localized"] as const,
    representativeAssets: {
        image: "public/placeholder.svg",
        rosterCsv: "e2e/assets/roster-long-localized.csv",
        multiPageSchoolTest: "external-fixture-required",
        omrScan: "external-fixture-required",
    },
    workflows: [
        "questions-with-math-and-images",
        "uploads-and-school-tests",
        "examination-and-analytics",
        "omr-sheet-and-scan",
        "pending-and-expired-invitations",
    ] as const,
} as const;

export async function installDeterministicPublicAssets(page: Page) {
    const logoVideo = path.resolve(process.cwd(), "public/output.webm");
    await page.route("**/output.webm", (route) =>
        route.fulfill({ path: logoVideo, contentType: "video/webm" }),
    );
}

export async function applyLongLocalizedLandingFixture(page: Page) {
    const hero = page.locator("section").first();
    await hero.getByRole("heading", { level: 1 }).evaluate((heading, content) => {
        heading.textContent = content;
        document.documentElement.lang = "de";
    }, longLocalizedContent.heroTitle);

    await hero.locator("p").first().evaluate((paragraph, content) => {
        paragraph.textContent = content;
    }, longLocalizedContent.heroDescription);
}
