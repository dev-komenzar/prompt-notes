// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 68-1
// @task-title: M3（M3-11）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=68, task=68-1, module=module:editor, oq=OQ-004
// Resolves OQ-004: 自動保存デバウンス間隔（500ms vs 1000ms 等）

/**
 * Supported debounce interval presets for auto-save.
 * OQ-004 evaluation targets: 500ms (responsive) vs 1000ms (conservative).
 */
export type DebouncePreset = 500 | 750 | 1000;

/**
 * Configuration for the auto-save debounce behavior.
 */
export interface AutoSaveConfig {
  /** Debounce interval in milliseconds. Default: 500. */
  readonly debounceMs: number;
  /** Maximum time in ms before a forced flush, regardless of continued input. 0 = disabled. */
  readonly maxDeferMs: number;
  /** Whether to flush pending saves on visibility change (tab hide). */
  readonly flushOnVisibilityChange: boolean;
}

/**
 * Snapshot of auto-save timing metrics for a single save cycle.
 */
export interface AutoSaveMetric {
  /** Timestamp (ms since epoch) when the first doc change was detected in this cycle. */
  readonly firstChangeAt: number;
  /** Timestamp (ms since epoch) when the debounce timer fired (save initiated). */
  readonly saveInitiatedAt: number;
  /** Timestamp (ms since epoch) when the IPC save_note resolved. */
  readonly saveCompletedAt: number;
  /** Number of doc changes coalesced into this single save. */
  readonly coalescedChanges: number;
  /** True if this save was triggered by a forced flush (not by debounce timer). */
  readonly wasForcedFlush: boolean;
}

/**
 * Aggregated metrics over a session window for interval evaluation.
 */
export interface AutoSaveSessionMetrics {
  /** Total number of save operations performed. */
  readonly totalSaves: number;
  /** Total number of doc changes coalesced across all saves. */
  readonly totalCoalescedChanges: number;
  /** Average debounce-to-save latency in ms. */
  readonly avgDebounceLatencyMs: number;
  /** Average IPC round-trip latency in ms (save initiation to completion). */
  readonly avgIpcLatencyMs: number;
  /** P95 IPC round-trip latency in ms. */
  readonly p95IpcLatencyMs: number;
  /** Number of forced flushes (note switch, unmount, visibility change). */
  readonly forcedFlushCount: number;
  /** Configured debounce interval for this session. */
  readonly configuredIntervalMs: number;
}

/**
 * Callback signature for persisting note content via Tauri IPC.
 * Corresponds to api.ts saveNote(filename, content).
 */
export type SaveNoteFn = (filename: string, content: string) => Promise<void>;

/**
 * Callback signature for retrieving the current editor document content.
 * Corresponds to EditorView.state.doc.toString().
 */
export type GetContentFn = () => string;

/**
 * State of the auto-save manager.
 */
export const enum AutoSaveState {
  /** No pending changes. Idle. */
  Idle = 0,
  /** Changes detected, debounce timer running. */
  Debouncing = 1,
  /** Save in progress (IPC call pending). */
  Saving = 2,
  /** Manager has been disposed. No further operations. */
  Disposed = 3,
}
