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
 * Public API for grid view delete operations.
 * Sprint 77 — グリッドビュー上の削除操作 UI (OQ-GRID-003)
 *
 * This module provides the complete TypeScript logic layer for
 * delete operations on the grid view:
 *
 *   - State management via Svelte stores (confirmation dialog, feedback toast)
 *   - Delete execution with filename validation and IPC delegation
 *   - Controller orchestrating the full delete flow
 *   - Grid note list updater for post-delete state
 *
 * All file deletion is performed by module:storage (Rust backend)
 * via Tauri IPC invoke("delete_note"). No direct filesystem access
 * occurs from the frontend. IPC calls are routed through lib/api.ts.
 */

export type {
  DeleteTarget,
  DeleteConfirmationState,
  DeleteResult,
  DeleteFeedbackState,
  DeleteNoteFn,
  OnDeleteSuccessFn,
  OnDeleteErrorFn,
} from './types';

export {
  deleteConfirmation,
  deleteFeedback,
  isDeleteDialogOpen,
  isDeleteInProgress,
  requestDelete,
  cancelDelete,
  showDeleteFeedback,
  dismissDeleteFeedback,
} from './delete-store';

export {
  isValidNoteFilename,
  executeDeleteNote,
} from './delete-handler';

export {
  createDeleteGridController,
} from './delete-grid-controller';
export type { DeleteGridControllerConfig } from './delete-grid-controller';

export {
  removeDeletedNote,
  hasNote,
} from './grid-notes-updater';
