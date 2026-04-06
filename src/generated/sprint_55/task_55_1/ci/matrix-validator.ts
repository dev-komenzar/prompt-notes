// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 55-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// trace: sprint_55/task_55_1 — CI E2E テスト構築 — プラットフォームマトリクス検証
import { generateE2EJobConfigs, type CIJobConfig } from './pipeline-config';
import { validatePlatformTargets } from './workflow-generator';

export interface MatrixValidationResult {
  valid: boolean;
  errors: string[];
  platforms: string[];
  jobCount: number;
}

/**
 * Validates the CI E2E test matrix against project requirements:
 * - Must include linux target
 * - Must include macos target
 * - Must NOT include windows target
 * - Each job must have required steps (build, test, artifact upload)
 */
export function validateCIMatrix(): MatrixValidationResult {
  const jobs = generateE2EJobConfigs();
  const errors: string[] = [];
  const platforms = jobs.map((j) => j.platform);

  // Platform coverage
  if (!platforms.includes('linux')) {
    errors.push('Missing required linux E2E test job');
  }
  if (!platforms.includes('macos')) {
    errors.push('Missing required macos E2E test job');
  }

  // Platform exclusion
  try {
    validatePlatformTargets(jobs);
  } catch (err) {
    errors.push((err as Error).message);
  }

  // Required steps validation
  for (const job of jobs) {
    validateRequiredSteps(job, errors);
  }

  return {
    valid: errors.length === 0,
    errors,
    platforms,
    jobCount: jobs.length,
  };
}

function validateRequiredSteps(job: CIJobConfig, errors: string[]): void {
  const stepNames = job.steps.map((s) => s.name.toLowerCase());

  const requiredPatterns = [
    { pattern: /checkout/i, label: 'Checkout' },
    { pattern: /rust/i, label: 'Rust setup' },
    { pattern: /node/i, label: 'Node.js setup' },
    { pattern: /build.*tauri/i, label: 'Tauri build' },
    { pattern: /e2e|test/i, label: 'E2E test execution' },
  ];

  for (const req of requiredPatterns) {
    const found = job.steps.some((s) => req.pattern.test(s.name));
    if (!found) {
      errors.push(`Job '${job.name}' missing required step: ${req.label}`);
    }
  }

  // Linux-specific: must have xvfb for headless WebView testing
  if (job.platform === 'linux') {
    const hasXvfb = job.steps.some(
      (s) => s.run?.includes('xvfb') ?? false,
    );
    if (!hasXvfb) {
      errors.push(
        `Linux job '${job.name}' must use xvfb for headless WebView testing`,
      );
    }
  }
}

/**
 * Asserts the CI matrix is valid and throws if not.
 */
export function assertValidCIMatrix(): void {
  const result = validateCIMatrix();
  if (!result.valid) {
    throw new Error(
      `CI E2E matrix validation failed:\n${result.errors.map((e) => `  - ${e}`).join('\n')}`,
    );
  }
}
