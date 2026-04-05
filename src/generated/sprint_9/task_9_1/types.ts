// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 9-1
// @task-title: 共有層
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Trace: sprint=9, task=9-1, module=shared, file=types.ts
// Design refs: detail:component_architecture §3.2, detail:storage_fileformat §3.4
// Canonical owner: module:storage (Rust models.rs). TS side follows Rust definitions.

/**
 * Metadata for a single note, returned by list_notes / search_notes IPC commands.
 * Rust-side canonical: module:storage models.rs — NoteEntry struct.
 */
export interface NoteEntry {
  /** File name including extension, e.g. "2026-04-04T143052.md" */
  filename: string;
  /** ISO-like datetime derived from filename, e.g. "2026-04-04T14:30:52" */
  created_at: string;
  /** Tags extracted from YAML frontmatter. Empty array when absent or parse error. */
  tags: string[];
  /** First 200 characters of note body (frontmatter excluded). Truncated by Rust. */
  body_preview: string;
}

/**
 * Response payload of the create_note IPC command.
 */
export interface CreateNoteResult {
  /** Generated filename, e.g. "2026-04-04T143052.md" */
  filename: string;
  /** Absolute path to the created file */
  path: string;
}

/**
 * Response payload of the read_note IPC command.
 */
export interface ReadNoteResult {
  /** Full file content including frontmatter */
  content: string;
}

/**
 * Application configuration persisted in config.json.
 * Canonical owner: module:settings (Rust config.rs).
 */
export interface Config {
  /** Absolute path to the notes storage directory */
  notes_dir: string;
}

/**
 * Parameters for the list_notes IPC command.
 */
export interface ListNotesParams {
  /** ISO date string (YYYY-MM-DD) for range start. Optional. */
  from_date?: string;
  /** ISO date string (YYYY-MM-DD) for range end. Optional. */
  to_date?: string;
  /** Single tag to filter by. Optional. */
  tag?: string;
}

/**
 * Parameters for the search_notes IPC command.
 */
export interface SearchNotesParams {
  /** Full-text search query string (case-insensitive substring match on Rust side) */
  query: string;
  /** ISO date string (YYYY-MM-DD) for range start. Optional. */
  from_date?: string;
  /** ISO date string (YYYY-MM-DD) for range end. Optional. */
  to_date?: string;
  /** Single tag to filter by. Optional. */
  tag?: string;
}

/**
 * Parameters for the save_note IPC command.
 */
export interface SaveNoteParams {
  /** Target filename (must match YYYY-MM-DDTHHMMSS.md pattern) */
  filename: string;
  /** Full file content including frontmatter to overwrite */
  content: string;
}

/**
 * Parameters for the set_config IPC command.
 */
export interface SetConfigParams {
  /** New notes directory path. Validated by Rust backend. */
  notes_dir: string;
}
