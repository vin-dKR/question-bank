import fs from "node:fs";
import path from "node:path";
import type {
    FullConfig,
    FullResult,
    Reporter,
    Suite,
    TestCase,
    TestResult,
} from "@playwright/test/reporter";

type Outcome = "passed" | "failed" | "flaky" | "skipped";

export default class Bla112Reporter implements Reporter {
    private startedAt = new Date();
    private rows: Array<{ project: string; title: string; outcome: Outcome; duration: number }> = [];
    private outputDirectory = path.resolve("test-results");

    onBegin(config: FullConfig, _suite: Suite) {
        this.startedAt = new Date();
        this.outputDirectory = path.resolve(config.rootDir, config.projects[0]?.outputDir ?? "test-results");
    }

    onTestEnd(test: TestCase, result: TestResult) {
        const project = test.parent.project()?.name ?? test.titlePath()[0] ?? "unknown";
        let outcome: Outcome;

        if (result.status === "skipped") outcome = "skipped";
        else if (result.status !== test.expectedStatus) outcome = "failed";
        else if (result.retry > 0) outcome = "flaky";
        else outcome = "passed";

        this.rows.push({ project, title: test.title, outcome, duration: result.duration });
    }

    onEnd(result: FullResult) {
        const totals = this.rows.reduce<Record<Outcome, number>>(
            (counts, row) => ({ ...counts, [row.outcome]: counts[row.outcome] + 1 }),
            { passed: 0, failed: 0, flaky: 0, skipped: 0 },
        );
        const byProject = new Map<string, Record<Outcome, number>>();

        for (const row of this.rows) {
            const counts = byProject.get(row.project) ?? { passed: 0, failed: 0, flaky: 0, skipped: 0 };
            counts[row.outcome] += 1;
            byProject.set(row.project, counts);
        }

        const lines = [
            "# BLA-112 responsive regression evidence",
            "",
            `- Started: ${this.startedAt.toISOString()}`,
            `- Result: ${result.status}`,
            `- Tests: ${this.rows.length} total; ${totals.passed} passed; ${totals.failed} failed; ${totals.flaky} flaky; ${totals.skipped} skipped`,
            "- Evidence: clearly named viewport screenshots and browser-issue JSON are under `test-results/**/evidence/`; the browsable report is `playwright-report/index.html`.",
            "- Scope note: skipped tests are coverage annotations or fixture gaps, not product passes. This harness does not mark BLA-112 complete.",
            "",
            "| Project | Passed | Failed | Flaky | Skipped |",
            "|---|---:|---:|---:|---:|",
            ...Array.from(byProject.entries())
                .sort(([left], [right]) => left.localeCompare(right))
                .map(
                    ([project, counts]) =>
                        `| ${project} | ${counts.passed} | ${counts.failed} | ${counts.flaky} | ${counts.skipped} |`,
                ),
            "",
        ];

        fs.mkdirSync(this.outputDirectory, { recursive: true });
        fs.writeFileSync(path.join(this.outputDirectory, "BLA-112-summary.md"), lines.join("\n"));
    }
}
