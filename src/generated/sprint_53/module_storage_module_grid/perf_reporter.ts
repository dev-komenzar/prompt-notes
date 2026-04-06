// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 53-1
// @task-title: `module:storage`, `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint:53 task:53-1 module:storage,grid milestone:パフォーマンス計測

import type {
  PerfSample,
  PerfAggregation,
  PerfReport,
  PerfModule,
  OperationName,
  ThresholdCheckResult,
} from './types';
import { ALL_THRESHOLDS, getThreshold, TANTIVY_CONSIDERATION_THRESHOLD } from './thresholds';
import { PerfTracker } from './perf_tracker';
import { computeStats, formatDuration, isoTimestamp } from './perf_utils';

/**
 * Generate aggregated statistics for a set of samples with the same
 * module and operation.
 */
function aggregateSamples(
  module: PerfModule,
  operation: OperationName,
  samples: ReadonlyArray<PerfSample>,
): PerfAggregation {
  const durations = samples.map((s) => s.durationMs);
  const stats = computeStats(durations);
  const successCount = samples.filter((s) => s.success).length;

  return {
    module,
    operation,
    sampleCount: samples.length,
    minMs: stats.min,
    maxMs: stats.max,
    meanMs: stats.mean,
    medianMs: stats.median,
    p95Ms: stats.p95,
    p99Ms: stats.p99,
    stdDevMs: stats.stdDev,
    successRate: samples.length > 0 ? successCount / samples.length : 0,
  };
}

/**
 * Check all samples against their defined thresholds.
 * Returns only violations (samples that exceeded their threshold).
 */
function checkAllThresholds(
  samples: ReadonlyArray<PerfSample>,
): ThresholdCheckResult[] {
  const violations: ThresholdCheckResult[] = [];

  for (const sample of samples) {
    const threshold = getThreshold(sample.operation, sample.module);
    if (!threshold) continue;

    const overageMs = sample.durationMs - threshold.maxDurationMs;
    const ratio = sample.durationMs / threshold.maxDurationMs;
    const passed = sample.durationMs <= threshold.maxDurationMs;

    if (!passed) {
      violations.push({ sample, threshold, passed, overageMs, ratio });
    }
  }

  return violations;
}

/**
 * Generate a full performance report from the current tracker state.
 */
export function generateReport(tracker?: PerfTracker): PerfReport {
  const t = tracker ?? PerfTracker.getInstance();
  const samples = t.getSamples();

  // Group samples by module+operation
  const groups = new Map<string, PerfSample[]>();
  for (const sample of samples) {
    const key = `${sample.module}:${sample.operation}`;
    const group = groups.get(key);
    if (group) {
      group.push(sample);
    } else {
      groups.set(key, [sample]);
    }
  }

  // Build aggregations
  const aggregations: PerfAggregation[] = [];
  for (const [key, group] of groups.entries()) {
    const [module, operation] = key.split(':') as [PerfModule, OperationName];
    aggregations.push(aggregateSamples(module, operation, group));
  }

  // Sort aggregations: storage first, then grid, alphabetically by operation
  aggregations.sort((a, b) => {
    if (a.module !== b.module) return a.module < b.module ? -1 : 1;
    return a.operation < b.operation ? -1 : 1;
  });

  const thresholdViolations = checkAllThresholds(samples);

  return {
    generatedAt: isoTimestamp(),
    totalSamples: samples.length,
    aggregations,
    thresholdViolations,
    allThresholdsPassed: thresholdViolations.length === 0,
  };
}

/**
 * Format a performance report as a human-readable string.
 * Suitable for console output or log files.
 */
export function formatReport(report: PerfReport): string {
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('  PromptNotes Performance Report');
  lines.push(`  Generated: ${report.generatedAt}`);
  lines.push(`  Total Samples: ${report.totalSamples}`);
  lines.push(`  Status: ${report.allThresholdsPassed ? '✅ ALL PASSED' : '❌ VIOLATIONS DETECTED'}`);
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('');

  // Aggregations table
  if (report.aggregations.length > 0) {
    lines.push('┌─────────────────────────────────────────────────────────────┐');
    lines.push('│  Aggregated Performance Metrics                            │');
    lines.push('├─────────┬────────────────────┬───────┬────────┬────────────┤');
    lines.push('│ Module  │ Operation          │ Count │ Mean   │ P95        │');
    lines.push('├─────────┼────────────────────┼───────┼────────┼────────────┤');

    for (const agg of report.aggregations) {
      const mod = agg.module.padEnd(7);
      const op = agg.operation.padEnd(18);
      const count = String(agg.sampleCount).padStart(5);
      const mean = formatDuration(agg.meanMs).padStart(6);
      const p95 = formatDuration(agg.p95Ms).padStart(10);
      lines.push(`│ ${mod} │ ${op} │ ${count} │ ${mean} │ ${p95} │`);
    }

    lines.push('└─────────┴────────────────────┴───────┴────────┴────────────┘');
    lines.push('');
  }

  // Threshold check summary
  lines.push('Threshold Compliance:');
  for (const threshold of ALL_THRESHOLDS) {
    const agg = report.aggregations.find(
      (a) => a.module === threshold.module && a.operation === threshold.operation,
    );
    const violations = report.thresholdViolations.filter(
      (v) =>
        v.threshold.module === threshold.module &&
        v.threshold.operation === threshold.operation,
    );

    const status = violations.length === 0 ? '✅' : '❌';
    const measured = agg ? formatDuration(agg.p95Ms) : 'N/A';
    const limit = formatDuration(threshold.maxDurationMs);
    const violationCount = violations.length > 0 ? ` (${violations.length} violations)` : '';

    lines.push(
      `  ${status} ${threshold.module}/${threshold.operation}: P95=${measured} (limit: ${limit})${violationCount}`,
    );
  }
  lines.push('');

  // Violations detail
  if (report.thresholdViolations.length > 0) {
    lines.push('⚠️  Threshold Violations:');
    for (const v of report.thresholdViolations) {
      lines.push(
        `  - ${v.sample.module}/${v.sample.operation}: ` +
          `${formatDuration(v.sample.durationMs)} > ${formatDuration(v.threshold.maxDurationMs)} ` +
          `(${v.ratio.toFixed(2)}x, +${formatDuration(v.overageMs)}) ` +
          `[${v.sample.timestamp}]`,
      );
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Check if the note count has crossed the tantivy consideration threshold
 * and emit a warning if so.
 *
 * Reference: storage_fileformat_design.md §4.3, grid_search_design.md §4.7
 * "5,000件超過時にtantivy導入を検討"
 *
 * @param noteCount - Current total note count
 * @returns Warning message if threshold crossed, null otherwise
 */
export function checkTantivyThreshold(noteCount: number): string | null {
  if (noteCount >= TANTIVY_CONSIDERATION_THRESHOLD) {
    return (
      `⚠️ Note count (${noteCount}) has reached the tantivy consideration threshold ` +
      `(${TANTIVY_CONSIDERATION_THRESHOLD}). Full-text search performance should be ` +
      `evaluated and tantivy indexing engine considered. ` +
      `Reference: storage_fileformat_design.md §4.3`
    );
  }
  return null;
}

/**
 * Generate a compact summary suitable for automated CI checks.
 * Returns an object with pass/fail status and key metrics.
 */
export function generateCiSummary(tracker?: PerfTracker): {
  passed: boolean;
  violationCount: number;
  metrics: Record<string, { p95Ms: number; thresholdMs: number; passed: boolean }>;
} {
  const report = generateReport(tracker);
  const metrics: Record<string, { p95Ms: number; thresholdMs: number; passed: boolean }> = {};

  for (const threshold of ALL_THRESHOLDS) {
    const key = `${threshold.module}/${threshold.operation}`;
    const agg = report.aggregations.find(
      (a) => a.module === threshold.module && a.operation === threshold.operation,
    );
    const violations = report.thresholdViolations.filter(
      (v) =>
        v.threshold.module === threshold.module &&
        v.threshold.operation === threshold.operation,
    );

    metrics[key] = {
      p95Ms: agg?.p95Ms ?? -1,
      thresholdMs: threshold.maxDurationMs,
      passed: violations.length === 0,
    };
  }

  return {
    passed: report.allThresholdsPassed,
    violationCount: report.thresholdViolations.length,
    metrics,
  };
}
