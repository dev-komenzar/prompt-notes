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
// @codd:trace detail:editor_clipboard OQ-E01, detail:editor_clipboard §3.1

/**
 * Visual feedback phase for the CopyButton.
 *
 * - idle: default state, clipboard icon displayed
 * - copied: success state, check icon + tooltip displayed
 * - error: copy failed, error indicator briefly shown
 */
export type CopyFeedbackPhase = 'idle' | 'copied' | 'error';

/**
 * Icon identifier type used in feedback rendering.
 */
export type CopyIconId = 'clipboard' | 'check';

/**
 * Observable state snapshot of the CopyButton.
 * Consumers (Svelte components) subscribe to these fields for rendering.
 */
export interface CopyButtonState {
  /** Current feedback phase */
  readonly phase: CopyFeedbackPhase;
  /** Icon to render */
  readonly icon: CopyIconId;
  /** Whether the tooltip should be visible */
  readonly showTooltip: boolean;
  /** Tooltip text content */
  readonly tooltipText: string;
  /** ARIA label for the button element */
  readonly ariaLabel: string;
  /** Whether the button is currently processing a copy action */
  readonly busy: boolean;
}

/**
 * Configuration for CopyButton feedback behavior.
 */
export interface CopyFeedbackConfig {
  /** Duration in ms to show success feedback before returning to idle */
  readonly feedbackDurationMs: number;
  /** Tooltip text to display on successful copy */
  readonly tooltipText: string;
  /** ARIA label for the button */
  readonly ariaLabel: string;
}

/**
 * Function signature for obtaining the text to copy.
 * Per detail:editor_clipboard §3.1, this is provided by Editor.svelte
 * via props — it returns EditorView.state.doc.toString().
 */
export type GetTextFn = () => string;

/**
 * Callback signature for state change notifications.
 */
export type OnStateChange = (state: CopyButtonState) => void;

/**
 * Result of a clipboard write attempt.
 */
export interface ClipboardWriteResult {
  readonly success: boolean;
  readonly method: 'clipboard-api' | 'exec-command' | 'none';
  readonly error?: unknown;
}
