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

// trace: sprint_55/task_55_1 — CI E2E テスト構築 — CI マトリクス検証テスト
import { test, expect } from '@playwright/test';
import { validateCIMatrix } from '../ci/matrix-validator';
import { generateE2EJobConfigs } from '../ci/pipeline-config';
import { generateWorkflowYAML, validatePlatformTargets } from '../ci/workflow-generator';

test.describe('CI E2E Matrix Validation', () => {
  test('matrix includes both linux and macos targets', () => {
    const result = validateCIMatrix();
    expect(result.platforms).toContain('linux');
    expect(result.platforms).toContain('macos');
  });

  test('matrix does NOT include windows target', () => {
    const result = validateCIMatrix();
    expect(result.platforms).not.toContain('windows');
  });

  test('matrix validation passes all checks', () => {
    const result = validateCIMatrix();
    expect(result.valid, `Errors: ${result.errors.join(', ')}`).toBe(true);
  });

  test('each job has required CI steps', () => {
    const jobs = generateE2EJobConfigs();

    for (const job of jobs) {
      const stepNames = job.steps.map((s) => s.name);

      // Must have checkout
      expect(
        stepNames.some((n) => /checkout/i.test(n)),
        `${job.name}: missing checkout step`,
      ).toBe(true);

      // Must have Rust setup
      expect(
        stepNames.some((n) => /rust/i.test(n)),
        `${job.name}: missing Rust setup step`,
      ).toBe(true);

      // Must have Node.js setup
      expect(
        stepNames.some((n) => /node/i.test(n)),
        `${job.name}: missing Node.js setup step`,
      ).toBe(true);

      // Must have Tauri build
      expect(
        stepNames.some((n) => /build.*tauri/i.test(n) || /tauri.*build/i.test(n)),
        `${job.name}: missing Tauri build step`,
      ).toBe(true);

      // Must have E2E test execution
      expect(
        stepNames.some((n) => /e2e|test/i.test(n)),
        `${job.name}: missing E2E test step`,
      ).toBe(true);
    }
  });

  test('linux job uses xvfb for headless WebView testing', () => {
    const jobs = generateE2EJobConfigs();
    const linuxJob = jobs.find((j) => j.platform === 'linux');
    expect(linuxJob).toBeDefined();

    const hasXvfb = linuxJob!.steps.some((s) => s.run?.includes('xvfb') ?? false);
    expect(hasXvfb, 'Linux E2E job must use xvfb').toBe(true);
  });

  test('platform target validation rejects windows', () => {
    const invalidJobs = [
      {
        name: 'e2e-windows',
        runsOn: 'windows-latest',
        platform: 'windows' as any,
        env: {},
        steps: [],
      },
    ];

    expect(() => validatePlatformTargets(invalidJobs)).toThrow(/windows/i);
  });

  test('workflow YAML is generated without windows references', () => {
    const yaml = generateWorkflowYAML();

    expect(yaml).toContain('e2e-linux');
    expect(yaml).toContain('e2e-macos');
    expect(yaml).not.toContain('windows');
    expect(yaml).toContain('ubuntu-latest');
    expect(yaml).toContain('macos-latest');
  });

  test('workflow YAML includes concurrency group', () => {
    const yaml = generateWorkflowYAML();
    expect(yaml).toContain('concurrency');
    expect(yaml).toContain('cancel-in-progress');
  });

  test('job count is exactly 2 (linux + macos)', () => {
    const result = validateCIMatrix();
    expect(result.jobCount).toBe(2);
  });
});
