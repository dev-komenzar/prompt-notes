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

// trace: sprint_55/task_55_1 — CI E2E テスト構築 — GitHub Actions ワークフロー生成
import { generateE2EJobConfigs, type CIJobConfig, type CIStep } from './pipeline-config';

/**
 * Generates GitHub Actions workflow YAML content for E2E testing.
 * Targets: linux and macos only. Windows is out of scope.
 */
export function generateWorkflowYAML(): string {
  const jobs = generateE2EJobConfigs();
  const lines: string[] = [];

  lines.push('name: E2E Tests');
  lines.push('');
  lines.push('on:');
  lines.push('  push:');
  lines.push('    branches: [main, develop]');
  lines.push('  pull_request:');
  lines.push('    branches: [main, develop]');
  lines.push('');
  lines.push('concurrency:');
  lines.push('  group: e2e-${{ github.ref }}');
  lines.push('  cancel-in-progress: true');
  lines.push('');
  lines.push('jobs:');

  for (const job of jobs) {
    lines.push(`  ${job.name}:`);
    lines.push(`    runs-on: ${job.runsOn}`);
    lines.push('    timeout-minutes: 30');

    if (Object.keys(job.env).length > 0) {
      lines.push('    env:');
      for (const [key, value] of Object.entries(job.env)) {
        lines.push(`      ${key}: '${value}'`);
      }
    }

    lines.push('    steps:');
    for (const step of job.steps) {
      lines.push(`      - name: ${step.name}`);
      if (step.uses) {
        lines.push(`        uses: ${step.uses}`);
      }
      if (step.run) {
        if (step.run.includes('\n')) {
          lines.push('        run: |');
          for (const runLine of step.run.split('\n')) {
            lines.push(`          ${runLine}`);
          }
        } else {
          lines.push(`        run: ${step.run}`);
        }
      }
      if (step.with) {
        lines.push('        with:');
        for (const [key, value] of Object.entries(step.with)) {
          if (value.includes('\n')) {
            lines.push(`          ${key}: |`);
            for (const wLine of value.split('\n')) {
              lines.push(`            ${wLine}`);
            }
          } else {
            lines.push(`          ${key}: ${value}`);
          }
        }
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Validates that a CI configuration only targets linux and macos.
 * Rejects any Windows targets per project constraints.
 */
export function validatePlatformTargets(jobs: CIJobConfig[]): void {
  for (const job of jobs) {
    if (job.platform !== 'linux' && job.platform !== 'macos') {
      throw new Error(
        `Invalid platform target: ${job.platform}. ` +
          'PromptNotes CI must target linux and macos only. Windows is out of scope.',
      );
    }
    if (job.runsOn.includes('windows')) {
      throw new Error(
        `Invalid runner: ${job.runsOn}. ` +
          'Windows runners are prohibited for PromptNotes E2E tests.',
      );
    }
  }
}
