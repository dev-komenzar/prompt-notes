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
 * Controller orchestrating the delete flow for grid view.
 *
 * Coordinates between:
 *   - delete-store (confirmation dialog state)
 *   - delete-handler (IPC execution)
 *   - GridView.svelte (card list state update)
 *
 * Flow:
 *   1. User clicks delete icon on NoteCard → requestDelete(target)
 *   2. Confirmation dialog rendered by GridView
 *   3. User confirms → controller.confirmAndExecute()
 *   4. IPC delete_note executed via Rust backend (module:storage)
 *   5. Success → card removed from grid, success toast shown
 *   6. Failure → error toast shown, grid unchanged
 *
 * All file deletion is performed by module:storage (Rust backend)
 * via Tauri IPC. No direct filesystem access occurs.
 */

import {
  deleteConfirmation,
  cancelDelete,
  markDeleteInProgress,
  completeDelete,
  showDeleteFeedback,
} from './delete-store';
import { executeDeleteNote } from './delete-handler';
import type {
  DeleteTarget,
  DeleteResult,
  DeleteNoteFn,
  OnDeleteSuccessFn,
  OnDeleteErrorFn,
} from './types';

export interface DeleteGridControllerConfig {
  /**
   * IPC wrapper function from lib/api.ts.
   * Must call invoke("delete_note", { filename }) via Tauri IPC.
   */
  deleteNoteFn: DeleteNoteFn;

  /**
   * Called after successful deletion.
   * GridView.svelte should use this to remove the card from its notes array.
   */
  onDeleteSuccess: OnDeleteSuccessFn;

  /**
   * Called after failed deletion for additional error handling.
   * Optional — feedback toast is always shown regardless.
   */
  onDeleteError?: OnDeleteErrorFn;
}

/**
 * Create a delete controller bound to the grid view's callbacks.
 *
 * Usage in GridView.svelte onMount:
 *   const controller = createDeleteGridController({
 *     deleteNoteFn: api.deleteNote,
 *     onDeleteSuccess: (filename) => { notes = removeDeletedNote(notes, filename); },
 *   });
 */
export function createDeleteGridController(config: DeleteGridControllerConfig) {
  const { deleteNoteFn, onDeleteSuccess, onDeleteError } = config;

  /**
   * Read the current delete target from the store synchronously.
   * Uses the Svelte store subscribe/unsubscribe pattern for one-shot reads.
   */
  function readCurrentTarget(): DeleteTarget | null {
    let target: DeleteTarget | null = null;
    const unsubscribe = deleteConfirmation.subscribe((state) => {
      target = state.target;
    });
    unsubscribe();
    return target;
  }

  /**
   * Execute the confirmed deletion.
   * Call this when the user clicks "Confirm" in the delete dialog.
   */
  async function confirmAndExecute(): Promise<void> {
    const target = readCurrentTarget();

    if (target === null) {
      cancelDelete();
      return;
    }

    const { filename } = target;

    markDeleteInProgress();

    const result: DeleteResult = await executeDeleteNote(filename, deleteNoteFn);

    completeDelete();
    showDeleteFeedback(result);

    if (result.success) {
      onDeleteSuccess(filename);
    } else if (onDeleteError) {
      onDeleteError(filename, result.error);
    }
  }

  return {
    /** Execute deletion after user confirms in the dialog */
    confirmAndExecute,
  } as const;
}
