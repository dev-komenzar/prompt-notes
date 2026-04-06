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

/**
 * Identifies the origin module of a performance measurement.
 */
export type PerfModule = 'storage' | 'grid';

/**
 * Identifies a specific storage IPC operation.
 */
export type StorageOperation =
  | 'create_note'
  | 'save_note'
  | 'read_note'
  | 'delete_note'
  | 'list_notes'
  | 'search_notes';

/**
 * Identifies a specific grid UI operation.
 */
export type GridOperation =
  | 'initial_load'
  | 'tag_filter'
  | 'date_filter'
  | 'fulltext_search'
  | 'card_click_transition'
  | 'masonry_render';

/**
 * Union of all measurable operation names.
 */
export type OperationName = StorageOperation | GridOperation;

/**
 * A single performance measurement sample.
 */
export interface PerfSample {
  /** Unique identifier for this sample. */
  readonly id: string;
  /** Module that produced this sample. */
  readonly module: PerfModule;
  /** Operation that was measured. */
  readonly operation: OperationName;
  /** High-resolution start time (ms) from performance.now(). */
  readonly startTime: number;
  /** Duration in milliseconds. */
  readonly durationMs: number;
  /** ISO 8601 timestamp when the measurement was taken. */
  readonly timestamp: string;
  /** Whether the operation completed successfully. */
  readonly success: boolean;
  /** Optional contextual metadata. */
  readonly metadata?: Record<string, string | number | boolean>;
}

/**
 * Threshold definition for a single operation.
 */
export interface PerfThreshold {
  /** Operation this threshold applies to. */
  readonly operation: OperationName;
  /** Module this threshold applies to. */
  readonly module: PerfModule;
  /** Maximum acceptable duration in milliseconds. */
  readonly maxDurationMs: number;
  /** Description of measurement conditions. */
  readonly condition: string;
  /** Source reference in design documentation. */
  readonly designRef: string;
}

/**
 * Result of comparing a sample against its threshold.
 */
export interface ThresholdCheckResult {
  readonly sample: PerfSample;
  readonly threshold: PerfThreshold;
  readonly passed: boolean;
  /** How much the sample exceeded the threshold (negative means within budget). */
  readonly overageMs: number;
  /** Ratio of actual duration to threshold (1.0 = exactly at threshold). */
  readonly ratio: number;
}

/**
 * Aggregated statistics for a specific operation.
 */
export interface PerfAggregation {
  readonly module: PerfModule;
  readonly operation: OperationName;
  readonly sampleCount: number;
  readonly minMs: number;
  readonly maxMs: number;
  readonly meanMs: number;
  readonly medianMs: number;
  readonly p95Ms: number;
  readonly p99Ms: number;
  readonly stdDevMs: number;
  readonly successRate: number;
}

/**
 * Complete performance report for a measurement session.
 */
export interface PerfReport {
  /** ISO 8601 timestamp when the report was generated. */
  readonly generatedAt: string;
  /** Total number of samples in this report. */
  readonly totalSamples: number;
  /** Aggregations grouped by operation. */
  readonly aggregations: ReadonlyArray<PerfAggregation>;
  /** Threshold check results for all samples. */
  readonly thresholdViolations: ReadonlyArray<ThresholdCheckResult>;
  /** Overall pass/fail status. */
  readonly allThresholdsPassed: boolean;
}

/**
 * NoteEntry as defined by module:storage (Rust canonical → TS mirror).
 * Used for measuring list_notes / search_notes payload sizes.
 */
export interface NoteEntry {
  readonly filename: string;
  readonly created_at: string;
  readonly tags: readonly string[];
  readonly body_preview: string;
}

/**
 * Config as defined by module:settings (Rust canonical → TS mirror).
 */
export interface Config {
  readonly notes_dir: string;
}

/**
 * Callback invoked when a threshold violation is detected.
 */
export type ViolationCallback = (result: ThresholdCheckResult) => void;

/**
 * Configuration for the performance tracker.
 */
export interface PerfTrackerConfig {
  /** Maximum number of samples to retain in memory. Default: 10000. */
  readonly maxSamples: number;
  /** Whether to check thresholds on every sample. Default: true. */
  readonly realtimeThresholdCheck: boolean;
  /** Optional callback for threshold violations. */
  readonly onViolation?: ViolationCallback;
  /** Whether to log samples to console. Default: false. */
  readonly consoleLog: boolean;
}
