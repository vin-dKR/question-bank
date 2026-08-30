import { defineConfig, type Project } from "@playwright/test";

type ViewportProject = {
    name: string;
    width: number;
    height: number;
    touch?: boolean;
    description: string;
};

export const acceptanceViewports: ViewportProject[] = [
    { name: "phone-320", width: 320, height: 568, touch: true, description: "small phone portrait" },
    { name: "phone-375", width: 375, height: 667, touch: true, description: "common phone portrait" },
    { name: "phone-390", width: 390, height: 844, touch: true, description: "large phone portrait" },
    { name: "landscape-568", width: 568, height: 320, touch: true, description: "small phone landscape" },
    { name: "landscape-667", width: 667, height: 375, touch: true, description: "common phone landscape" },
    { name: "landscape-844", width: 844, height: 390, touch: true, description: "large phone landscape" },
    { name: "tablet-700", width: 700, height: 900, touch: true, description: "awkward small-tablet width" },
    { name: "tablet-768", width: 768, height: 1024, touch: true, description: "tablet portrait" },
    { name: "tablet-1024", width: 1024, height: 768, touch: true, description: "tablet landscape" },
    { name: "laptop-1280", width: 1280, height: 720, description: "short small laptop" },
    { name: "desktop-1366", width: 1366, height: 768, description: "standard desktop" },
    { name: "desktop-1440", width: 1440, height: 900, description: "large desktop" },
    { name: "wide-1920", width: 1920, height: 1080, description: "wide desktop" },
    { name: "ultrawide-2560", width: 2560, height: 1080, description: "ultrawide desktop" },
    {
        name: "reflow-1280-at-200pct",
        width: 640,
        height: 720,
        description: "1280 CSS-pixel window at a 200% zoom-equivalent width",
    },
    {
        name: "reflow-1440-at-300pct",
        width: 480,
        height: 600,
        description: "1440 CSS-pixel window at a 300% zoom-equivalent width",
    },
];

const localPort = process.env.PLAYWRIGHT_PORT ?? "3012";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${localPort}`;
const startsLocalServer = !process.env.PLAYWRIGHT_BASE_URL;

const projects: Project[] = acceptanceViewports.map(({ name, width, height, touch, description }) => ({
    name,
    metadata: { description, width, height, touch: Boolean(touch) },
    use: {
        viewport: { width, height },
        hasTouch: Boolean(touch),
        isMobile: Boolean(touch),
        deviceScaleFactor: 1,
    },
}));

export default defineConfig({
    testDir: "./e2e/tests",
    outputDir: "test-results",
    preserveOutput: "always",
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 1 : 0,
    // Next dev compiles route families lazily; two workers keep cold starts
    // deterministic instead of stampeding the compiler across 16 projects.
    workers: 2,
    timeout: 60_000,
    expect: { timeout: 5_000 },
    reporter: process.env.CI
        ? [
              ["line"],
              ["html", { open: "never", outputFolder: "playwright-report" }],
              ["./e2e/support/bla112-reporter.ts"],
          ]
        : [
              ["list"],
              ["html", { open: "never", outputFolder: "playwright-report" }],
              ["./e2e/support/bla112-reporter.ts"],
          ],
    use: {
        baseURL,
        browserName: "chromium",
        colorScheme: "light",
        locale: "en-US",
        timezoneId: "Asia/Kolkata",
        contextOptions: { reducedMotion: "reduce" },
        serviceWorkers: "block",
        screenshot: "only-on-failure",
        trace: "retain-on-failure",
        video: "off",
    },
    projects,
    webServer: startsLocalServer
        ? {
              command: `bun run dev --hostname 127.0.0.1 --port ${localPort}`,
              url: baseURL,
              // Never silently test an unrelated app already occupying the port.
              reuseExistingServer: false,
              timeout: 120_000,
              env: {
                  ...process.env,
                  // Public/non-auth tests need AuthKit middleware to initialize, but
                  // must never need a real WorkOS tenant or a production secret.
                  WORKOS_API_KEY: process.env.WORKOS_API_KEY ?? "sk_test_e2e_public_placeholder",
                  WORKOS_CLIENT_ID: process.env.WORKOS_CLIENT_ID ?? "client_e2e_public_placeholder",
                  WORKOS_COOKIE_PASSWORD:
                      process.env.WORKOS_COOKIE_PASSWORD ?? "e2e-only-cookie-password-at-least-32-chars",
                  NEXT_PUBLIC_WORKOS_REDIRECT_URI:
                      process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI ?? `${baseURL}/auth/callback`,
              },
          }
        : undefined,
});
