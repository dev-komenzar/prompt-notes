// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 50-1
// @task-title: 完了条件
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/test/acceptance_criteria.md
// @generated-by: codd implement --sprint 50

/**
 * CI quality gate script for PromptNotes.
 *
 * Parses a Playwright JSON reporter output file and asserts that every
 * release-blocking criterion is covered by a passing test.
 *
 * Usage:
 *   npx ts-node src/generated/sprint_50/task_50_1/ci_quality_gate.ts \
 *     --results playwright-report/results.json
 *
 * Exit code 0 → release ready.
 * Exit code 1 → one or more release-blocking tests failed or missing.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { assertReleaseReadiness, RELEASE_BLOCKING_CRITERIA, FAILURE_GUARDS } from './release_readiness';

interface PlaywrightTestResult {
  status: 'passed' | 'failed' | 'skipped' | 'timedOut';
  title: string;
  titlePath: string[];
}

interface PlaywrightSuiteResult {
  suites?: PlaywrightSuiteResult[];
  specs?: PlaywrightTestResult[];
  title: string;
}

interface PlaywrightReport {
  suites: PlaywrightSuiteResult[];
}

function collectResults(suite: PlaywrightSuiteResult, acc: PlaywrightTestResult[]): void {
  if (suite.specs) {
    for (const spec of suite.specs) {
      acc.push(spec);
    }
  }
  if (suite.suites) {
    for (const child of suite.suites) {
      collectResults(child, acc);
    }
  }
}

function parseResultsFile(filePath: string): PlaywrightTestResult[] {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const report = JSON.parse(raw) as PlaywrightReport;
  const results: PlaywrightTestResult[] = [];
  for (const suite of report.suites) {
    collectResults(suite, results);
  }
  return results;
}

function matchesCriterion(result: PlaywrightTestResult, criterionId: string): boolean {
  const fullTitle = [...(result.titlePath ?? []), result.title].join(' ');
  return fullTitle.includes(criterionId);
}

function run(): void {
  const args = process.argv.slice(2);
  const resultsFlag = args.indexOf('--results');
  if (resultsFlag === -1 || !args[resultsFlag + 1]) {
    console.error('Usage: ci_quality_gate.ts --results <playwright-results.json>');
    process.exit(1);
  }

  const resultsPath = path.resolve(args[resultsFlag + 1]);
  if (!fs.existsSync(resultsPath)) {
    console.error(`Results file not found: ${resultsPath}`);
    process.exit(1);
  }

  const results = parseResultsFile(resultsPath);
  const allCriteria = [...RELEASE_BLOCKING_CRITERIA, ...FAILURE_GUARDS];

  const passingIds: string[] = [];
  const failingDetails: Array<{ id: string; reason: string }> = [];

  for (const criterion of allCriteria) {
    const matching = results.filter((r) => matchesCriterion(r, criterion.id));

    if (matching.length === 0) {
      failingDetails.push({ id: criterion.id, reason: 'No test found for criterion' });
      continue;
    }

    const allPassed = matching.every((r) => r.status === 'passed');
    if (allPassed) {
      passingIds.push(criterion.id);
    } else {
      const skipped = matching.some((r) => r.status === 'skipped');
      failingDetails.push({
        id: criterion.id,
        reason: skipped
          ? 'Test was skipped (test.skip() is prohibited — use test.fixme())'
          : `Test failed: ${matching.find((r) => r.status !== 'passed')?.title ?? 'unknown'}`,
      });
    }
  }

  const { ready, failing } = assertReleaseReadiness(passingIds);

  console.log('\n=== PromptNotes Release Readiness Report ===\n');
  console.log(`Total criteria: ${allCriteria.length}`);
  console.log(`Passing:        ${passingIds.length}`);
  console.log(`Failing:        ${failing.length}`);

  if (failingDetails.length > 0) {
    console.log('\n--- Failing / Missing Criteria ---');
    for (const f of failingDetails) {
      console.log(`  [FAIL] ${f.id}: ${f.reason}`);
    }
  }

  if (ready) {
    console.log('\n✓ Release gate PASSED — all acceptance criteria met.\n');
    process.exit(0);
  } else {
    console.error('\n✗ Release gate FAILED — fix the above criteria before releasing.\n');
    process.exit(1);
  }
}

run();
