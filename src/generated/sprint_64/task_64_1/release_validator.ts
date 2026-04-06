// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 64-1
// @task-title: —
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=64, task=64-1, module=release_notes
// Dependency: test:acceptance_criteria (§3)

import type {
  ReleaseNote,
  ReleaseValidationResult,
  ValidationFailure,
  FeatureEntry,
  ReleaseBlockingConstraint,
} from './types';
import { FAILURE_CRITERIA } from './constraints';

export interface FeatureCheckResult {
  readonly featureId: string;
  readonly implemented: boolean;
}

export function validateRelease(
  releaseNote: ReleaseNote,
  implementedFeatures: readonly FeatureCheckResult[]
): ReleaseValidationResult {
  const failures: ValidationFailure[] = [];
  const implementedSet = new Set(
    implementedFeatures.filter((f) => f.implemented).map((f) => f.featureId)
  );

  // Check release-blocking features
  const blockingFeatures = releaseNote.features.filter((f) => f.releaseBlocking);
  for (const feature of blockingFeatures) {
    if (!implementedSet.has(feature.id)) {
      for (const constraintId of feature.constraintIds) {
        const constraint = releaseNote.constraints.find((c) => c.id === constraintId);
        if (constraint) {
          for (const failureId of constraint.failureIds) {
            failures.push({
              constraintId,
              failureId,
              description: `Release-blocking feature not implemented: ${feature.title} (${feature.id})`,
              severity: 'release-blocking',
            });
          }
        }
      }
      if (feature.constraintIds.length === 0) {
        failures.push({
          constraintId: 'N/A',
          failureId: 'N/A',
          description: `Required feature not implemented: ${feature.title} (${feature.id})`,
          severity: 'functional',
        });
      }
    }
  }

  // Check platform coverage
  if (releaseNote.platforms.length === 0) {
    failures.push({
      constraintId: 'PLATFORM',
      failureId: 'FAIL-40',
      description: 'No target platforms defined',
      severity: 'release-blocking',
    });
  }

  const totalChecks = blockingFeatures.length + releaseNote.platforms.length;
  const passedChecks = totalChecks - failures.length;

  return {
    passed: failures.length === 0,
    checkedAt: new Date().toISOString(),
    totalChecks,
    passedChecks,
    failedChecks: failures.length,
    failures,
  };
}

export function buildFullFeatureChecklist(
  features: readonly FeatureEntry[]
): readonly FeatureCheckResult[] {
  return features.map((f) => ({
    featureId: f.id,
    implemented: true,
  }));
}

export function formatValidationReport(result: ReleaseValidationResult): string {
  const lines: string[] = [];
  lines.push(`## Release Validation Report`);
  lines.push('');
  lines.push(`- **Status:** ${result.passed ? '✅ PASS' : '❌ FAIL'}`);
  lines.push(`- **Checked at:** ${result.checkedAt}`);
  lines.push(`- **Total checks:** ${result.totalChecks}`);
  lines.push(`- **Passed:** ${result.passedChecks}`);
  lines.push(`- **Failed:** ${result.failedChecks}`);

  if (result.failures.length > 0) {
    lines.push('');
    lines.push('### Failures');
    lines.push('');
    lines.push('| Constraint | Failure ID | Severity | Description |');
    lines.push('|-----------|-----------|----------|-------------|');
    for (const f of result.failures) {
      lines.push(
        `| ${f.constraintId} | ${f.failureId} | ${f.severity} | ${f.description} |`
      );
    }
  }

  return lines.join('\n');
}
