// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 63-1
// @task-title: Linux, macOS
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated Sprint 63 — Task 63-1 — Linux, macOS smoke test UI foundation
// trace: plan:implementation_plan — Sprint 63: 全配布形式でのスモークテスト

import type { SmokeReport, SmokeCheckResult } from './smoke-types';

/**
 * Formats a SmokeReport into a human-readable string for console output.
 * Used by the smoke test runner to display results after execution.
 */
export function formatReportText(report: SmokeReport): string {
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════════');
  lines.push(`  PromptNotes Smoke Test Report`);
  lines.push(`  Platform:     ${report.platform}`);
  lines.push(`  Distribution: ${report.distributionFormat}`);
  lines.push(`  Timestamp:    ${report.timestamp}`);
  lines.push(`  Duration:     ${report.totalDurationMs.toFixed(1)}ms`);
  lines.push('═══════════════════════════════════════════════════════');
  lines.push('');

  const grouped = groupByCategory(report.checks);
  for (const [category, checks] of grouped) {
    lines.push(`── ${category.toUpperCase()} ──`);
    for (const check of checks) {
      const icon = check.passed ? '✓' : '✗';
      const timing = `(${check.durationMs.toFixed(1)}ms)`;
      lines.push(`  ${icon} [${check.id}] ${check.description} ${timing}`);
      if (!check.passed && check.error) {
        lines.push(`    └─ ERROR: ${check.error}`);
      }
    }
    lines.push('');
  }

  lines.push('───────────────────────────────────────────────────────');
  lines.push(`  PASSED: ${report.totalPassed}  FAILED: ${report.totalFailed}`);
  if (report.releaseBlocking) {
    lines.push('  ⛔ RELEASE BLOCKED — one or more release-blocking checks failed');
  } else if (report.totalFailed > 0) {
    lines.push('  ⚠  Some non-blocking checks failed');
  } else {
    lines.push('  ✅ All checks passed');
  }
  lines.push('───────────────────────────────────────────────────────');

  return lines.join('\n');
}

/**
 * Formats a SmokeReport as a JSON string suitable for CI artifact storage.
 */
export function formatReportJson(report: SmokeReport): string {
  return JSON.stringify(report, null, 2);
}

function groupByCategory(
  checks: readonly SmokeCheckResult[],
): Map<string, SmokeCheckResult[]> {
  const map = new Map<string, SmokeCheckResult[]>();
  for (const check of checks) {
    const existing = map.get(check.category) ?? [];
    existing.push(check);
    map.set(check.category, existing);
  }
  return map;
}
