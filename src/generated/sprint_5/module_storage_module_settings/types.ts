// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 5-1
// @task-title: `module:storage`, `module:settings`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=5, task=5-1, modules=[storage,settings]
// Canonical source: Rust side (models.rs, config.rs). TypeScript types follow Rust definitions.

/**
 * Represents a note entry as returned by list_notes / search_notes IPC commands.
 * Canonical owner: module:storage (Rust backend models.rs)
 */
export interface NoteEntry {
  readonly filename: string;
  readonly created_at: string;
  readonly tags: readonly string[];
  readonly body_preview: string;
}

/**
 * Application configuration as stored in config.json.
 * Canonical owner: module:settings (Rust backend config.rs)
 */
export interface Config {
  readonly notes_dir: string;
}

/**
 * Response from the create_note IPC command.
 */
export interface CreateNoteResponse {
  readonly filename: string;
  readonly path: string;
}

/**
 * Response from the read_note IPC command.
 */
export interface ReadNoteResponse {
  readonly content: string;
}

/**
 * Parameters for the save_note IPC command.
 */
export interface SaveNoteParams {
  readonly filename: string;
  readonly content: string;
}

/**
 * Parameters for the read_note IPC command.
 */
export interface ReadNoteParams {
  readonly filename: string;
}

/**
 * Parameters for the delete_note IPC command.
 */
export interface DeleteNoteParams {
  readonly filename: string;
}

/**
 * Parameters for the list_notes IPC command.
 * All fields optional; Rust backend applies filtering when present.
 */
export interface ListNotesParams {
  readonly from_date?: string;
  readonly to_date?: string;
  readonly tag?: string;
}

/**
 * Parameters for the search_notes IPC command.
 * query is required; filter fields are optional and combinable.
 */
export interface SearchNotesParams {
  readonly query: string;
  readonly from_date?: string;
  readonly to_date?: string;
  readonly tag?: string;
}

/**
 * Parameters for the set_config IPC command.
 * Path validation and persistence are handled exclusively by Rust backend.
 */
export interface SetConfigParams {
  readonly notes_dir: string;
}

/**
 * Discriminated union for IPC error responses.
 */
export interface StorageError {
  readonly kind: 'validation' | 'io' | 'parse' | 'permission' | 'not_found' | 'unknown';
  readonly message: string;
}

/**
 * View identifiers for SPA navigation via conditional rendering.
 */
export type ViewId = 'editor' | 'grid' | 'settings';
