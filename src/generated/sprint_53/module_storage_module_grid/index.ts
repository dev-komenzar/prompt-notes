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
 * Public API for sprint 53 performance measurement: module:storage + module:grid
 *
 * This module provides:
 * 1. Performance-instrumented IPC wrappers for storage operations
 * 2. Performance-instrumented grid data operations
 * 3. Performance tracking, aggregation, and threshold validation
 * 4. Report generation for CI and manual review
 *
 * Architecture: Tauri (Rust + WebView), Svelte frontend, CodeMirror 6 editor
 * Data: Local .md files only — no DB, no cloud, no AI
 * Platform: Linux (GTK WebKitGTK) + macOS (WKWebView)
 */

// --- Types ---
export type {
  PerfModule,
  StorageOperation,
  GridOperation,
  OperationName,
  PerfSample,
  PerfThreshold,
  ThresholdCheckResult,
  PerfAggregation,
  PerfReport,
  NoteEntry,
  Config,
  ViolationCallback,
  PerfTrackerConfig,
} from './types';

// --- Thresholds ---
export {
  STORAGE_THRESHOLDS,
  GRID_THRESHOLDS,
  ALL_THRESHOLDS,
  getThreshold,
  TANTIVY_CONSIDERATION_THRESHOLD,
  SEARCH_DEBOUNCE_MS,
  AUTOSAVE_DEBOUNCE_MS,
} from './thresholds';

// --- Core Tracker ---
export { PerfTracker } from './perf_tracker';

// --- Storage Instrumentation ---
export {
  createStoragePerfApi,
  type StoragePerfApi,
  type InvokeFn,
  type ListNotesArgs,
  type SearchNotesArgs,
  type CreateNoteResponse,
  type ReadNoteResponse,
} from './storage_perf';

// --- Grid Instrumentation ---
export {
  createGridPerfApi,
  type GridPerfApi,
  type GridFilterState,
  createDefaultFilterState,
  measureMasonryRender,
  shouldUseSearchCommand,
} from './grid_perf';

// --- Reporting ---
export {
  generateReport,
  formatReport,
  checkTantivyThreshold,
  generateCiSummary,
} from './perf_reporter';

// --- Utilities ---
export { createDebounce } from './debounce';
export { formatDuration, daysAgoDateString, todayDateString, computeStats } from './perf_utils';
