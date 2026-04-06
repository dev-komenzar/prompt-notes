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
 * Svelte stores for delete operation state management.
 * Manages the confirmation dialog lifecycle and post-delete feedback toast.
 *
 * Usage in Svelte components:
 *   import { deleteConfirmation, requestDelete, cancelDelete } from './delete-store';
 *   $deleteConfirmation.isOpen  // reactive access in template
 */

import { writable, derived } from 'svelte/store';
import type { Writable, Readable } from 'svelte/store';
import type {
  DeleteConfirmationState,
  DeleteTarget,
  DeleteFeedbackState,
  DeleteResult,
} from './types';

/** Duration in ms to show the feedback toast after deletion */
const FEEDBACK_DISPLAY_MS = 2000;

const INITIAL_CONFIRMATION: DeleteConfirmationState = {
  isOpen: false,
  target: null,
  isDeleting: false,
};

const INITIAL_FEEDBACK: DeleteFeedbackState = {
  visible: false,
  result: null,
};

/**
 * Store managing the delete confirmation dialog state.
 * Consumed by GridView.svelte to render the confirmation modal.
 */
export const deleteConfirmation: Writable<DeleteConfirmationState> =
  writable(INITIAL_CONFIRMATION);

/**
 * Store managing the post-delete feedback toast state.
 * Auto-dismissed after FEEDBACK_DISPLAY_MS.
 */
export const deleteFeedback: Writable<DeleteFeedbackState> =
  writable(INITIAL_FEEDBACK);

/** Derived: whether the delete confirmation dialog is open */
export const isDeleteDialogOpen: Readable<boolean> = derived(
  deleteConfirmation,
  ($s) => $s.isOpen
);

/** Derived: whether a delete IPC call is in progress */
export const isDeleteInProgress: Readable<boolean> = derived(
  deleteConfirmation,
  ($s) => $s.isDeleting
);

/**
 * Open the delete confirmation dialog for a specific note.
 * Called when the user clicks a delete button on a NoteCard.
 */
export function requestDelete(target: DeleteTarget): void {
  deleteConfirmation.set({
    isOpen: true,
    target,
    isDeleting: false,
  });
}

/**
 * Close the delete confirmation dialog without performing deletion.
 * Called when the user cancels (clicks cancel button or presses Escape).
 */
export function cancelDelete(): void {
  deleteConfirmation.set(INITIAL_CONFIRMATION);
}

/**
 * Transition the confirmation state to indicate an IPC call is in flight.
 * The dialog should show a loading/disabled state.
 */
export function markDeleteInProgress(): void {
  deleteConfirmation.update((state) => ({
    ...state,
    isDeleting: true,
  }));
}

/**
 * Reset confirmation state after the delete operation completes.
 * Called regardless of success or failure.
 */
export function completeDelete(): void {
  deleteConfirmation.set(INITIAL_CONFIRMATION);
}

let feedbackTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Show the feedback toast with a delete result.
 * Auto-dismissed after FEEDBACK_DISPLAY_MS.
 */
export function showDeleteFeedback(result: DeleteResult): void {
  if (feedbackTimer !== null) {
    clearTimeout(feedbackTimer);
    feedbackTimer = null;
  }
  deleteFeedback.set({ visible: true, result });
  feedbackTimer = setTimeout(() => {
    deleteFeedback.set(INITIAL_FEEDBACK);
    feedbackTimer = null;
  }, FEEDBACK_DISPLAY_MS);
}

/** Dismiss the feedback toast immediately */
export function dismissDeleteFeedback(): void {
  if (feedbackTimer !== null) {
    clearTimeout(feedbackTimer);
    feedbackTimer = null;
  }
  deleteFeedback.set(INITIAL_FEEDBACK);
}
