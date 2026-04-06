// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 71-1
// @task-title: M3（M3-06）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd:generated sprint=71 task=71-1 module=m3_m3_06
// @codd:trace detail:editor_clipboard §4.3, §3.1, §3.2
// CopyButton module — public API surface.
// This module is the single import point for Svelte component integration.
// CopyButton.svelte (module:editor child component) consumes this module.
//
// Ownership: CopyButton.svelte is Editor.svelte's exclusive child (§3.2).
// The getTextFn prop is provided by Editor.svelte, which calls
// EditorView.state.doc.toString() (§3.1 ownership matrix).

import type {
  CopyButtonState,
  CopyFeedbackConfig,
  GetTextFn,
  OnStateChange,
} from './types';
import { createFeedbackController } from './feedback-state';
import { executeCopyAction } from './copy-action';
import type { FeedbackController } from './feedback-state';

export type { CopyButtonState, CopyFeedbackConfig, GetTextFn, OnStateChange };
export type { FeedbackController };
export { COPY_BUTTON_ARIA_LABEL, FEEDBACK_DURATION_MS, FEEDBACK_TOOLTIP_TEXT } from './constants';

/**
 * Lifecycle handle returned by createCopyButton.
 * Manages feedback state and exposes the click handler.
 */
export interface CopyButtonHandle {
  /** Current state snapshot for initial render */
  readonly initialState: CopyButtonState;

  /**
   * Click handler to bind to the <button> element.
   * Must be called from a user-gesture context (click event).
   */
  handleCopy(): Promise<void>;

  /**
   * Dispose resources (clear timers).
   * Must be called in Svelte's onDestroy.
   */
  dispose(): void;
}

/**
 * Create a CopyButton handle for use within a Svelte component.
 *
 * Usage in CopyButton.svelte (onMount):
 * ```ts
 * const handle = createCopyButton(getTextFn, (state) => {
 *   // Trigger Svelte reactivity update
 *   buttonState = state;
 * });
 * ```
 *
 * @param getTextFn - Text retrieval function from parent Editor.svelte
 * @param onChange  - Callback invoked on every state transition
 * @param config    - Optional feedback configuration overrides
 */
export function createCopyButton(
  getTextFn: GetTextFn,
  onChange: OnStateChange,
  config?: Partial<CopyFeedbackConfig>,
): CopyButtonHandle {
  const feedback = createFeedbackController(onChange, config);

  return {
    get initialState() {
      return feedback.getInitialState();
    },

    async handleCopy(): Promise<void> {
      await executeCopyAction(getTextFn, feedback);
    },

    dispose(): void {
      feedback.dispose();
    },
  };
}
