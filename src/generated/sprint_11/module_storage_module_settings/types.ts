// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 11-1
// @task-title: `module:storage`, `module:settings`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=11, task=11-1, modules=[storage,settings]
// Canonical TypeScript definitions mirroring Rust-side NoteEntry (models.rs) and Config (config.rs).
// Rust side is authoritative; these types MUST stay in sync with serde::{Serialize,Deserialize} structs.

/**
 * Mirrors Rust `NoteEntry` from module:storage models.rs.
 * Returned by `list_notes` and `search_notes` IPC commands.
 */
export interface NoteEntry {
  /** Filename including extension, e.g. "2026-04-04T143052.md" */
  readonly filename: string;
  /** ISO-8601-like datetime derived from filename, e.g. "2026-04-04T14:30:52" */
  readonly created_at: string;
  /** Tags extracted from YAML frontmatter `tags` field */
  readonly tags: readonly string[];
  /** First 200 characters of note body (frontmatter excluded) for card preview */
  readonly body_preview: string;
}

/**
 * Mirrors Rust `Config` from module:settings config.rs.
 * Returned by `get_config` IPC command.
 */
export interface Config {
  /** Absolute path to the notes storage directory */
  readonly notes_dir: string;
}

// ---------------------------------------------------------------------------
// IPC command argument types
// ---------------------------------------------------------------------------

/** Response from `create_note` IPC command */
export interface CreateNoteResponse {
  readonly filename: string;
  readonly path: string;
}

/** Arguments for `save_note` IPC command */
export interface SaveNoteParams {
  readonly filename: string;
  readonly content: string;
}

/** Arguments for `read_note` IPC command */
export interface ReadNoteParams {
  readonly filename: string;
}

/** Response from `read_note` IPC command */
export interface ReadNoteResponse {
  readonly content: string;
}

/** Arguments for `delete_note` IPC command */
export interface DeleteNoteParams {
  readonly filename: string;
}

/** Arguments for `list_notes` IPC command */
export interface ListNotesParams {
  /** ISO date string YYYY-MM-DD. If omitted Rust returns all. */
  readonly from_date?: string;
  /** ISO date string YYYY-MM-DD */
  readonly to_date?: string;
  /** Single tag string to filter by */
  readonly tag?: string;
}

/** Arguments for `search_notes` IPC command */
export interface SearchNotesParams {
  /** Non-empty query string for case-insensitive full-text search */
  readonly query: string;
  readonly from_date?: string;
  readonly to_date?: string;
  readonly tag?: string;
}

/** Arguments for `set_config` IPC command */
export interface SetConfigParams {
  /** Absolute path to the new notes directory */
  readonly notes_dir: string;
}
