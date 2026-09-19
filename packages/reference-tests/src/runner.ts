import { ReferenceTestEngine } from "./engine.js";
import { buildReferenceReport, type ReferenceReport } from "./report.js";
import type { ReferenceFixture, ReferenceResult } from "./types.js";

/**
 * REF-TEST-003 Reference Runner.
 * Deterministic: stable fixture_id ordering, sequential execution,
 * no randomness, no wall-clock material in results.
 */
export class ReferenceRunner {
  private readonly engine = new ReferenceTestEngine();

  async runFixtures(
    fixtures: readonly ReferenceFixture[],
  ): Promise<readonly ReferenceResult[]> {
    this.assertUniqueIds(fixtures);
    const ordered = [...fixtures].sort((a, b) =>
      a.fixture_id < b.fixture_id ? -1 : 1,
    );
    const results: ReferenceResult[] = [];
    for (const fixture of ordered) {
      results.push(await this.engine.run(fixture));
    }
    return Object.freeze(results);
  }

  async run(
    suite: string,
    fixtures: readonly ReferenceFixture[],
  ): Promise<ReferenceReport> {
    return buildReferenceReport(suite, await this.runFixtures(fixtures));
  }

  private assertUniqueIds(fixtures: readonly ReferenceFixture[]): void {
    const seen = new Set<string>();
    for (const f of fixtures) {
      if (seen.has(f.fixture_id)) {
        throw new Error(`Duplicate fixture_id: ${f.fixture_id}`);
      }
      seen.add(f.fixture_id);
    }
  }
}
