// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 56-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=56, task=56-1, milestone=スコープ外機能の不存在確認, module=all

/**
 * Compliance Report Generator
 *
 * Aggregates results from all scope validators and produces
 * a structured compliance report for release validation.
 */

import type {
  ScopeComplianceResult,
  ScopeViolation,
} from './scope_manifest';

export interface ComplianceReport {
  readonly timestamp: string;
  readonly overallPassed: boolean;
  readonly totalViolations: number;
  readonly releaseBlockingCount: number;
  readonly warningCount: number;
  readonly moduleResults: readonly ScopeComplianceResult[];
  readonly summary: ComplianceSummary;
}

export interface ComplianceSummary {
  readonly failureIds: readonly string[];
  readonly affectedModules: readonly string[];
  readonly releaseDecision: 'GO' | 'NO-GO';
  readonly details: string;
}

/**
 * Generates a compliance report from multiple module validation results.
 */
export function generateComplianceReport(
  results: readonly ScopeComplianceResult[],
): ComplianceReport {
  const allViolations: ScopeViolation[] = [];
  for (const result of results) {
    allViolations.push(...result.violations);
  }

  const releaseBlockingViolations = allViolations.filter(
    (v) => v.severity === 'release_blocking',
  );
  const warningViolations = allViolations.filter(
    (v) => v.severity === 'warning',
  );

  const failureIds = [
    ...new Set(releaseBlockingViolations.map((v) => v.failureId)),
  ].sort();

  const affectedModules = [
    ...new Set(
      results
        .filter((r) => !r.passed)
        .map((r) => r.module),
    ),
  ].sort();

  const overallPassed = releaseBlockingViolations.length === 0;

  const details = overallPassed
    ? 'スコープ外機能の不存在を確認しました。全モジュールがリリース基準を満たしています。'
    : `リリースブロッキング違反が ${releaseBlockingViolations.length} 件検出されました。` +
      `対象Failure ID: ${failureIds.join(', ')}。` +
      `影響モジュール: ${affectedModules.join(', ')}。`;

  return {
    timestamp: new Date().toISOString(),
    overallPassed,
    totalViolations: allViolations.length,
    releaseBlockingCount: releaseBlockingViolations.length,
    warningCount: warningViolations.length,
    moduleResults: results,
    summary: {
      failureIds,
      affectedModules,
      releaseDecision: overallPassed ? 'GO' : 'NO-GO',
      details,
    },
  };
}

/**
 * Formats the compliance report as a human-readable string
 * suitable for CI logs or console output.
 */
export function formatComplianceReport(report: ComplianceReport): string {
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('  PromptNotes スコープ外機能不存在確認レポート');
  lines.push(`  Sprint 56 — ${report.timestamp}`);
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('');
  lines.push(
    `  判定: ${report.summary.releaseDecision === 'GO' ? '✅ GO (リリース可)' : '❌ NO-GO (リリース不可)'}`,
  );
  lines.push(`  リリースブロッキング違反: ${report.releaseBlockingCount} 件`);
  lines.push(`  警告: ${report.warningCount} 件`);
  lines.push('');

  if (report.summary.failureIds.length > 0) {
    lines.push('  トリガーされたFailure ID:');
    for (const id of report.summary.failureIds) {
      lines.push(`    • ${id}`);
    }
    lines.push('');
  }

  for (const result of report.moduleResults) {
    const icon = result.passed ? '✅' : '❌';
    lines.push(
      `  ${icon} module:${result.module} — ${result.passed ? 'PASS' : 'FAIL'} (${result.violations.length} violation(s))`,
    );

    for (const v of result.violations) {
      const severityIcon =
        v.severity === 'release_blocking' ? '🚫' : '⚠️';
      lines.push(`      ${severityIcon} [${v.failureId}] ${v.message}`);
      if (v.location) {
        lines.push(`         Location: ${v.location}`);
      }
    }
  }

  lines.push('');
  lines.push('───────────────────────────────────────────────────────────');
  lines.push(`  ${report.summary.details}`);
  lines.push('═══════════════════════════════════════════════════════════');

  return lines.join('\n');
}
