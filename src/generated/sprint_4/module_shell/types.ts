// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 4-1
// @task-title: `module:shell`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Trace: sprint:4 task:4-1 module:shell file:types.ts
// Canonical source: module:storage (Rust side). TypeScript definitions follow Rust serde types.

/**
 * Note entry returned by list_notes / search_notes IPC commands.
 * Mirrors Rust struct NoteEntry in module:storage models.rs.
 */
export interface NoteEntry {
  readonly filename: string;
  readonly created_at: string;
  readonly tags: readonly string[];
  readonly body_preview: string;
}

/**
 * Application configuration.
 * Mirrors Rust struct Config in module:settings config.rs.
 */
export interface Config {
  readonly notes_dir: string;
}

/**
 * Response from create_note IPC command.
 */
export interface CreateNoteResponse {
  readonly filename: string;
  readonly path: string;
}

/**
 * Response from read_note IPC command.
 */
export interface ReadNoteResponse {
  readonly content: string;
}

/**
 * Arguments for save_note IPC command.
 */
export interface SaveNoteArgs {
  readonly filename: string;
  readonly content: string;
}

/**
 * Arguments for read_note IPC command.
 */
export interface ReadNoteArgs {
  readonly filename: string;
}

/**
 * Arguments for delete_note IPC command.
 */
export interface DeleteNoteArgs {
  readonly filename: string;
}

/**
 * Arguments for list_notes IPC command.
 * All fields optional; Rust side handles missing values.
 */
export interface ListNotesArgs {
  readonly from_date?: string;
  readonly to_date?: string;
  readonly tag?: string;
}

/**
 * Arguments for search_notes IPC command.
 * query is required; filter fields are optional.
 */
export interface SearchNotesArgs {
  readonly query: string;
  readonly from_date?: string;
  readonly to_date?: string;
  readonly tag?: string;
}

/**
 * Arguments for set_config IPC command.
 */
export interface SetConfigArgs {
  readonly notes_dir: string;
}

/**
 * Union of all IPC command names exposed by the Rust backend.
 */
export type IpcCommandName =
  | 'create_note'
  | 'save_note'
  | 'read_note'
  | 'delete_note'
  | 'list_notes'
  | 'search_notes'
  | 'get_config'
  | 'set_config';

/**
 * Type-level mapping from IPC command name to its argument and return types.
 */
export interface IpcCommandMap {
  create_note: { args: Record<string, never>; response: CreateNoteResponse };
  save_note: { args: SaveNoteArgs; response: void };
  read_note: { args: ReadNoteArgs; response: ReadNoteResponse };
  delete_note: { args: DeleteNoteArgs; response: void };
  list_notes: { args: ListNotesArgs; response: NoteEntry[] };
  search_notes: { args: SearchNotesArgs; response: NoteEntry[] };
  get_config: { args: Record<string, never>; response: Config };
  set_config: { args: SetConfigArgs; response: void };
}
