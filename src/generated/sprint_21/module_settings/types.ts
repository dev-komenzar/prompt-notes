// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 21-1
// @task-title: `module:settings`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd:generated sprint=21 task=21-1 module=settings
// Canonical definition: Rust module:settings config.rs (serde::Serialize/Deserialize)
// TypeScript side follows Rust side. Do not diverge.

/**
 * Application configuration as returned by the `get_config` IPC command.
 *
 * Default notes_dir values (resolved by Rust backend via `dirs::data_dir()`):
 *   Linux:  ~/.local/share/promptnotes/notes/
 *   macOS:  ~/Library/Application Support/promptnotes/notes/
 */
export interface Config {
  readonly notes_dir: string;
}

/**
 * Parameters for the `set_config` IPC command.
 * Path validation (existence check, write-permission check) is performed
 * exclusively on the Rust backend. Frontend must NOT validate paths
 * against the filesystem directly.
 */
export interface SetConfigParams {
  readonly notes_dir: string;
}

/**
 * Discriminated-union result type for settings operations.
 * Used by the store to communicate loading / success / error states.
 */
export type SettingsState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'loaded'; readonly config: Config }
  | { readonly status: 'saving' }
  | { readonly status: 'error'; readonly message: string };
