/**
 * REF-TEST-003 CI entry point (`pnpm test`).
 * Deterministic execution; exit code 1 on any FAIL / ERROR fixture.
 */
import { referenceFixtures } from "./fixtures/index.js";
import { renderReport } from "./report.js";
import { ReferenceRunner } from "./runner.js";

async function main(): Promise<void> {
  const runner = new ReferenceRunner();
  const report = await runner.run("SciROS Reference Test Suite", referenceFixtures);
  console.log(renderReport(report));
  if (report.summary.fail > 0 || report.summary.error > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("Reference test runner crashed:", err);
  process.exitCode = 1;
});
