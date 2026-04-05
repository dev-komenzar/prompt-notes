// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 18-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:18 task:18-1 module:storage
// Canonical TypeScript type definitions mirroring Rust-side serde types.
// Rust (module:storage models.rs) is the source of truth; these must stay in sync.

/**
 * Represents a single note entry returned by list_notes / search_notes IPC commands.
 * Canonical owner: module:storage (Rust side models.rs).
 */
export interface NoteEntry {
  /** Filename in YYYY-MM-DDTHHMMSS.md format, e.g. "2026-04-04T143052.md" */
  readonly filename: string;
  /** ISO-8601-ish datetime derived from filename, e.g. "2026-04-04T14:30:52" */
  readonly created_at: string;
  /** Tags extracted from YAML frontmatter. Empty array when absent or parse error. */
  readonly tags: readonly string[];
  /** First 200 characters of note body (frontmatter excluded). */
  readonly body_preview: string;
}

/**
 * Application configuration persisted in config.json.
 * Canonical owner: module:settings (Rust side config.rs).
 */
export interface Config {
  /** Absolute path to the notes directory. */
  readonly notes_dir: string;
}

/** Parameters for the list_notes IPC command. */
export interface ListNotesParams {
  /** Start date filter (inclusive), YYYY-MM-DD format. */
  readonly from_date?: string;
  /** End date filter (inclusive), YYYY-MM-DD format. */
  readonly to_date?: string;
  /** Single tag filter. Only notes containing this tag are returned. */
  readonly tag?: string;
}

/** Parameters for the search_notes IPC command. */
export interface SearchNotesParams {
  /** Full-text search query (case-insensitive substring match). */
  readonly query: string;
  /** Start date filter (inclusive), YYYY-MM-DD format. */
  readonly from_date?: string;
  /** End date filter (inclusive), YYYY-MM-DD format. */
  readonly to_date?: string;
  /** Single tag filter. */
  readonly tag?: string;
}

/** Response from the create_note IPC command. */
export interface CreateNoteResponse {
  /** Generated filename, e.g. "2026-04-04T143052.md" */
  readonly filename: string;
  /** Full absolute path to the created file. */
  readonly path: string;
}

/** Response from the read_note IPC command. */
export interface ReadNoteResponse {
  /** Full file content including frontmatter. */
  readonly content: string;
}

/** Parameters for the save_note IPC command. */
export interface SaveNoteParams {
  /** Target filename (must match YYYY-MM-DDTHHMMSS pattern). */
  readonly filename: string;
  /** Full file content including frontmatter to overwrite. */
  readonly content: string;
}

/** Parameters for the read_note IPC command. */
export interface ReadNoteParams {
  /** Target filename. */
  readonly filename: string;
}

/** Parameters for the delete_note IPC command. */
export interface DeleteNoteParams {
  /** Target filename. */
  readonly filename: string;
}

/** Parameters for the set_config IPC command. */
export interface SetConfigParams {
  /** New notes directory path. Validated by Rust backend. */
  readonly notes_dir: string;
}
