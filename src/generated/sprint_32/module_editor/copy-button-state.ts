// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 32-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd:generated sprint=32 task=32-1 module=editor
// Traceability: detail:editor_clipboard §4.3, OQ-E01
// CONV: 1-click copy button is core UX (RBC-1). Release-blocked if missing.

/**
 * Manages the copy button feedback state.
 * After a successful copy, shows a checkmark for FEEDBACK_DURATION_MS,
 * then reverts to the default clipboard icon.
 */

const FEEDBACK_DURATION_MS = 1500;

export interface CopyButtonState {
  copied: boolean;
}

/**
 * Creates a copy button state manager.
 *
 * @param onStateChange - Callback to notify UI of state changes
 * @returns Controls for triggering copy feedback
 */
export function createCopyButtonState(
  onStateChange: (state: CopyButtonState) => void
): {
  showFeedback: () => void;
  getState: () => CopyButtonState;
} {
  let state: CopyButtonState = { copied: false };
  let feedbackTimer: ReturnType<typeof setTimeout> | null = null;

  function showFeedback(): void {
    if (feedbackTimer !== null) {
      clearTimeout(feedbackTimer);
    }
    state = { copied: true };
    onStateChange({ ...state });

    feedbackTimer = setTimeout(() => {
      feedbackTimer = null;
      state = { copied: false };
      onStateChange({ ...state });
    }, FEEDBACK_DURATION_MS);
  }

  function getState(): CopyButtonState {
    return { ...state };
  }

  return { showFeedback, getState };
}
