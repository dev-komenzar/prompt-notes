// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 9-1
// @task-title: Linux と macOS の両ターゲットで `cargo build` + `npm run build` が通る
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/plan/implementation_plan.md
// @sprint: 9
// @task: 9-1
// @deliverable: Linux と macOS の両ターゲットで cargo build + npm run build が通る

import { SUPPORTED_PLATFORMS, type SupportedPlatform } from './ci-config';
import { validateBuildMatrix } from './build-targets';

/**
 * Represents the result of a single build step execution.
 */
export interface BuildStepResult {
  readonly command: string;
  readonly platform: SupportedPlatform;
  readonly exitCode: number;
  readonly durationMs: number;
}

/**
 * Represents the aggregated result of a full CI build run.
 */
export interface BuildRunResult {
  readonly platform: SupportedPlatform;
  readonly cargoResult: BuildStepResult;
  readonly npmResult: BuildStepResult;
  readonly success: boolean;
}

/**
 * Validates that the CI workflow covers all required platforms.
 * Returns an error message if any platform is missing from the build matrix.
 */
export function validateCiCoverage(
  configuredPlatforms: readonly string[],
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const matrixValidation = validateBuildMatrix();

  if (!matrixValidation.valid) {
    errors.push(
      `Missing build targets for platforms: ${matrixValidation.missing.join(', ')}`,
    );
  }

  for (const required of SUPPORTED_PLATFORMS) {
    if (!configuredPlatforms.includes(required)) {
      errors.push(
        `Required platform "${required}" is not configured in the CI workflow`,
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Checks that both cargo build and npm run build succeeded
 * for all required platforms.
 */
export function validateBuildResults(
  results: readonly BuildRunResult[],
): { passed: boolean; failures: string[] } {
  const failures: string[] = [];

  for (const platform of SUPPORTED_PLATFORMS) {
    const result = results.find((r) => r.platform === platform);
    if (!result) {
      failures.push(`No build result found for platform: ${platform}`);
      continue;
    }
    if (result.cargoResult.exitCode !== 0) {
      failures.push(
        `cargo build failed on ${platform} (exit code: ${result.cargoResult.exitCode})`,
      );
    }
    if (result.npmResult.exitCode !== 0) {
      failures.push(
        `npm run build failed on ${platform} (exit code: ${result.npmResult.exitCode})`,
      );
    }
  }

  return { passed: failures.length === 0, failures };
}
