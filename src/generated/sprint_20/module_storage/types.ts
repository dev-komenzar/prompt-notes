// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 20-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd:generated sprint=20 task=20-1 module=storage
// Canonical types derived from module:storage (Rust side is authoritative).
// TypeScript definitions follow Rust serde::Serialize / serde::Deserialize.

/**
 * Represents a single note entry returned by list_notes / search_notes.
 * Rust-side canonical definition: module:storage models.rs
 */
export interface NoteEntry {
  /** Filename, e.g. "2026-04-04T143052.md" */
  readonly filename: string;
  /** ISO-like datetime derived from filename, e.g. "2026-04-04T14:30:52" */
  readonly created_at: string;
  /** Tags extracted from YAML frontmatter */
  readonly tags: readonly string[];
  /** First 200 characters of note body (frontmatter excluded) */
  readonly body_preview: string;
}

/**
 * Response from the create_note IPC command.
 */
export interface CreateNoteResponse {
  /** Generated filename, e.g. "2026-04-04T143052.md" */
  readonly filename: string;
  /** Absolute path to the created file */
  readonly path: string;
}

/**
 * Response from the read_note IPC command.
 */
export interface ReadNoteResponse {
  /** Full file content including frontmatter */
  readonly content: string;
}

/**
 * Arguments for the save_note IPC command.
 */
export interface SaveNoteArgs {
  readonly filename: string;
  readonly content: string;
}

/**
 * Arguments for the read_note / delete_note IPC commands.
 */
export interface NoteFilenameArgs {
  readonly filename: string;
}

/**
 * Arguments for the list_notes IPC command.
 * All fields are optional; omitted fields mean no filter on that dimension.
 */
export interface ListNotesArgs {
  readonly from_date?: string;
  readonly to_date?: string;
  readonly tag?: string;
}

/**
 * Arguments for the search_notes IPC command.
 * query is required; filters are optional.
 */
export interface SearchNotesArgs {
  readonly query: string;
  readonly from_date?: string;
  readonly to_date?: string;
  readonly tag?: string;
}

/**
 * Application configuration persisted in config.json.
 * Rust-side canonical definition: module:settings config.rs
 */
export interface Config {
  /** Absolute path to the notes directory */
  readonly notes_dir: string;
}

/**
 * Arguments for the set_config IPC command.
 */
export interface SetConfigArgs {
  readonly notes_dir: string;
}
