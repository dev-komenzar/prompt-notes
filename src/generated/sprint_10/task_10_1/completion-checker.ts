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

import type {
  AcceptanceCriterion,
  FailureCriterion,
  CriterionResult,
  CriteriaStatus,
  CompletionReport,
} from './types';
import { ALL_ACCEPTANCE_CRITERIA } from './acceptance-criteria';
import { ALL_FAILURE_CRITERIA } from './failure-criteria';

export function createCriterionResult(
  id: string,
  status: CriteriaStatus,
  message: string,
): CriterionResult {
  return {
    id,
    status,
    message,
    timestamp: new Date().toISOString(),
  };
}

export function evaluateAcceptanceCriterion(
  criterion: AcceptanceCriterion,
  passed: boolean,
): CriterionResult {
  return createCriterionResult(
    criterion.id,
    passed ? 'pass' : 'fail',
    passed
      ? `PASS: ${criterion.description}`
      : `FAIL: ${criterion.description}`,
  );
}

export function evaluateFailureCriterion(
  criterion: FailureCriterion,
  violationDetected: boolean,
): CriterionResult {
  return createCriterionResult(
    criterion.id,
    violationDetected ? 'fail' : 'pass',
    violationDetected
      ? `VIOLATION: ${criterion.description}`
      : `CLEAR: ${criterion.description}`,
  );
}

export function extractReleaseBlockers(
  acResults: readonly CriterionResult[],
  fcResults: readonly CriterionResult[],
): CriterionResult[] {
  const acBlockerIds = new Set(
    ALL_ACCEPTANCE_CRITERIA.filter((ac) => ac.releaseBlocking).map(
      (ac) => ac.id,
    ),
  );
  const fcBlockerIds = new Set(ALL_FAILURE_CRITERIA.map((fc) => fc.id));

  const blockers: CriterionResult[] = [];

  for (const r of acResults) {
    if (r.status === 'fail' && acBlockerIds.has(r.id)) {
      blockers.push(r);
    }
  }
  for (const r of fcResults) {
    if (r.status === 'fail' && fcBlockerIds.has(r.id)) {
      blockers.push(r);
    }
  }

  return blockers;
}

export function computeOverallStatus(
  blockers: readonly CriterionResult[],
  acResults: readonly CriterionResult[],
  fcResults: readonly CriterionResult[],
): CriteriaStatus {
  if (blockers.length > 0) {
    return 'fail';
  }

  const allResults = [...acResults, ...fcResults];
  if (allResults.some((r) => r.status === 'pending')) {
    return 'pending';
  }

  return 'pass';
}

export function generateCompletionReport(
  platform: 'linux' | 'macos',
  acResults: readonly CriterionResult[],
  fcResults: readonly CriterionResult[],
): CompletionReport {
  const blockers = extractReleaseBlockers(acResults, fcResults);
  const overallStatus = computeOverallStatus(blockers, acResults, fcResults);

  return {
    generatedAt: new Date().toISOString(),
    platform,
    acceptanceCriteria: acResults,
    failureCriteria: fcResults,
    releaseBlockers: blockers,
    overallStatus,
  };
}
