// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 34-2
// @task-title: Editing
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd-trace sprint:34 task:34-2 module:editor

/**
 * All states the EditorRoot component can occupy.
 *
 * Loading    – initial read_note IPC call in flight
 * Editing    – idle, content visible, user may type
 * Saving     – auto-save save_note IPC call in flight
 * Error      – read_note failed; shows error message with back-navigation
 * Copied     – copy button pressed; reverts to Editing after 2s
 * Creating   – Cmd+N / Ctrl+N triggered; create_note IPC call in flight
 * SaveError  – save_note failed; user still able to continue editing
 */
export type EditorState =
  | 'Loading'
  | 'Editing'
  | 'Saving'
  | 'Error'
  | 'Copied'
  | 'Creating'
  | 'SaveError';

/** Terminal error states that block further editing */
export const BLOCKING_STATES: ReadonlySet<EditorState> = new Set([
  'Loading',
  'Error',
  'Creating',
] as const);

/** Returns true when the editor should accept user input */
export function isInteractive(state: EditorState): boolean {
  return !BLOCKING_STATES.has(state);
}
