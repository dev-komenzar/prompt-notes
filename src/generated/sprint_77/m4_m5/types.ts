// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 77-1
// @task-title: M4 または M5
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

/**
 * Types for grid view delete operations.
 * Sprint 77 — グリッドビュー上の削除操作 UI (OQ-GRID-003)
 *
 * All file deletion is performed by module:storage (Rust backend)
 * via Tauri IPC invoke("delete_note"). No direct filesystem access
 * occurs from the frontend.
 */

/** Identifies a note targeted for deletion in the grid view */
export interface DeleteTarget {
  /** Filename in YYYY-MM-DDTHHMMSS.md format (owned by module:storage) */
  readonly filename: string;
  /** Preview text shown in confirmation dialog for user verification */
  readonly bodyPreview: string;
  /** Tags for additional context in confirmation dialog */
  readonly tags: readonly string[];
}

/** State of the delete confirmation dialog */
export interface DeleteConfirmationState {
  /** Whether the confirmation dialog is currently shown */
  readonly isOpen: boolean;
  /** The note targeted for deletion, null when dialog is closed */
  readonly target: DeleteTarget | null;
  /** Whether a delete IPC call is currently in flight */
  readonly isDeleting: boolean;
}

/** Result of a delete_note IPC operation */
export type DeleteResult =
  | { readonly success: true; readonly filename: string }
  | { readonly success: false; readonly filename: string; readonly error: string };

/** State for post-delete feedback toast display */
export interface DeleteFeedbackState {
  /** Whether feedback toast is currently visible */
  readonly visible: boolean;
  /** The result to display, null when not visible */
  readonly result: DeleteResult | null;
}

/**
 * Function signature matching the deleteNote wrapper in lib/api.ts.
 * Wraps Tauri IPC invoke("delete_note", { filename }).
 */
export type DeleteNoteFn = (filename: string) => Promise<void>;

/** Callback invoked after successful deletion to update grid state */
export type OnDeleteSuccessFn = (filename: string) => void;

/** Callback invoked after failed deletion for error handling */
export type OnDeleteErrorFn = (filename: string, error: string) => void;
