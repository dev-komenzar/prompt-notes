// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 10-1
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
// @generated-by: codd generate --wave 10

import type { CompletionReport, CriterionResult } from './types';
import { ALL_ACCEPTANCE_CRITERIA } from './acceptance-criteria';
import { ALL_FAILURE_CRITERIA } from './failure-criteria';

export interface QualityGateResult {
  readonly passed: boolean;
  readonly allTestsPass: boolean;
  readonly noSkippedTests: boolean;
  readonly acCoverageComplete: boolean;
  readonly fcCoverageComplete: boolean;
  readonly releaseBlockersFree: boolean;
  readonly violations: readonly string[];
}

export function checkQualityGate(
  report: CompletionReport,
  coveredAcIds: readonly string[],
  coveredFcIds: readonly string[],
  skippedTestCount: number,
): QualityGateResult {
  const violations: string[] = [];

  const allTestsPass = report.overallStatus !== 'fail';
  if (!allTestsPass) {
    violations.push(
      `Overall status is "${report.overallStatus}"; expected "pass"`,
    );
  }

  const noSkippedTests = skippedTestCount === 0;
  if (!noSkippedTests) {
    violations.push(
      `${skippedTestCount} test(s) skipped; test.skip() is prohibited (use test.fixme() instead)`,
    );
  }

  const requiredAcIds = ALL_ACCEPTANCE_CRITERIA.map((ac) => ac.id);
  const missingAc = requiredAcIds.filter(
    (id) => !coveredAcIds.includes(id),
  );
  const acCoverageComplete = missingAc.length === 0;
  if (!acCoverageComplete) {
    violations.push(
      `Missing AC coverage: ${missingAc.join(', ')}`,
    );
  }

  const requiredFcIds = ALL_FAILURE_CRITERIA.map((fc) => fc.id);
  const missingFc = requiredFcIds.filter(
    (id) => !coveredFcIds.includes(id),
  );
  const fcCoverageComplete = missingFc.length === 0;
  if (!fcCoverageComplete) {
    violations.push(
      `Missing FC coverage: ${missingFc.join(', ')}`,
    );
  }

  const releaseBlockersFree = report.releaseBlockers.length === 0;
  if (!releaseBlockersFree) {
    const blockerIds = report.releaseBlockers.map((b) => b.id);
    violations.push(
      `Release blockers detected: ${blockerIds.join(', ')}`,
    );
  }

  const passed =
    allTestsPass &&
    noSkippedTests &&
    acCoverageComplete &&
    fcCoverageComplete &&
    releaseBlockersFree;

  return {
    passed,
    allTestsPass,
    noSkippedTests,
    acCoverageComplete,
    fcCoverageComplete,
    releaseBlockersFree,
    violations,
  };
}

export function formatQualityGateReport(
  result: QualityGateResult,
): string {
  const lines: string[] = [];
  lines.push(`Quality Gate: ${result.passed ? 'PASSED' : 'FAILED'}`);
  lines.push(`  All tests pass: ${result.allTestsPass}`);
  lines.push(`  No skipped tests: ${result.noSkippedTests}`);
  lines.push(`  AC coverage complete: ${result.acCoverageComplete}`);
  lines.push(`  FC coverage complete: ${result.fcCoverageComplete}`);
  lines.push(`  Release blockers free: ${result.releaseBlockersFree}`);

  if (result.violations.length > 0) {
    lines.push('  Violations:');
    for (const v of result.violations) {
      lines.push(`    - ${v}`);
    }
  }

  return lines.join('\n');
}
