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
// @codd:trace detail:editor_clipboard §4.3, §2.2 (1クリックコピー sequence)
// Orchestrates the full copy action:
//   1. Obtain text from getTextFn (EditorView.state.doc.toString())
//   2. Write to clipboard (with fallback)
//   3. Drive feedback state transitions
//
// Per design §3.1: CopyButton.svelte owns clipboard copy execution.
// Per design §4.8: called only from user-gesture (click) handler.
// Per design §2.2: does NOT go through Tauri IPC — WebView-local API.

import type { GetTextFn, CopyButtonState } from './types';
import type { FeedbackController } from './feedback-state';
import { writeToClipboard } from './clipboard';

/**
 * Execute the one-click copy action.
 *
 * This is the top-level handler invoked by the CopyButton click event.
 * It coordinates text retrieval, clipboard write, and visual feedback.
 *
 * @param getTextFn - Function returning the full document text
 *                    (provided by Editor.svelte, reads EditorView.state.doc)
 * @param feedback  - Feedback state controller instance
 * @returns The resulting CopyButtonState after the action completes
 */
export async function executeCopyAction(
  getTextFn: GetTextFn,
  feedback: FeedbackController,
): Promise<void> {
  // Signal busy state (disable rapid double-clicks)
  feedback.markBusy();

  try {
    const text = getTextFn();

    // Guard: empty document — still copy (empty string), but mark success
    const result = await writeToClipboard(text);

    if (result.success) {
      feedback.markCopied();
    } else {
      feedback.markError();
      if (result.error) {
        console.warn('[CopyButton] clipboard write failed:', result.error);
      }
    }
  } catch (err: unknown) {
    feedback.markError();
    console.warn('[CopyButton] unexpected error during copy:', err);
  }
}
