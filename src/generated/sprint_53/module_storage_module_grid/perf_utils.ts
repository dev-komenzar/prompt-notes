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

let _idCounter = 0;

/**
 * Generate a unique sample ID.
 */
export function generateSampleId(module: string, operation: string): string {
  _idCounter += 1;
  return `${module}:${operation}:${_idCounter}:${Date.now()}`;
}

/**
 * Get high-resolution timestamp in milliseconds.
 * Uses performance.now() when available (browser/WebView),
 * falls back to Date.now().
 */
export function now(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

/**
 * Get ISO 8601 timestamp string.
 */
export function isoTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Compute basic statistics from an array of numbers.
 */
export function computeStats(values: ReadonlyArray<number>): {
  min: number;
  max: number;
  mean: number;
  median: number;
  p95: number;
  p99: number;
  stdDev: number;
} {
  if (values.length === 0) {
    return { min: 0, max: 0, mean: 0, median: 0, p95: 0, p99: 0, stdDev: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const len = sorted.length;
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const mean = sum / len;

  const median =
    len % 2 === 0
      ? (sorted[len / 2 - 1] + sorted[len / 2]) / 2
      : sorted[Math.floor(len / 2)];

  const p95 = sorted[Math.min(Math.ceil(len * 0.95) - 1, len - 1)];
  const p99 = sorted[Math.min(Math.ceil(len * 0.99) - 1, len - 1)];

  const squaredDiffs = sorted.map((v) => (v - mean) ** 2);
  const variance = squaredDiffs.reduce((acc, v) => acc + v, 0) / len;
  const stdDev = Math.sqrt(variance);

  return {
    min: sorted[0],
    max: sorted[len - 1],
    mean,
    median,
    p95,
    p99,
    stdDev,
  };
}

/**
 * Format a duration in milliseconds for human-readable output.
 */
export function formatDuration(ms: number): string {
  if (ms < 1) {
    return `${(ms * 1000).toFixed(0)}µs`;
  }
  if (ms < 1000) {
    return `${ms.toFixed(2)}ms`;
  }
  return `${(ms / 1000).toFixed(3)}s`;
}

/**
 * Create a date string for N days ago in YYYY-MM-DD format.
 * Used by grid module for default 7-day filter calculation.
 */
export function daysAgoDateString(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get today's date in YYYY-MM-DD format.
 */
export function todayDateString(): string {
  return daysAgoDateString(0);
}
