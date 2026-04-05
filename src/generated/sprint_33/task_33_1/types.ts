// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 33-1
// @task-title: 共有層
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=33, task=33-1, module=shared, node=detail:component_architecture
// Canonical owner: module:storage (Rust side). TypeScript definitions follow Rust serde types.

/**
 * Represents a note entry returned by list_notes / search_notes IPC commands.
 * Rust canonical definition: module:storage models.rs — NoteEntry struct.
 */
export interface NoteEntry {
  /** File name, e.g. "2026-04-04T143052.md" */
  filename: string;
  /** ISO-8601-like datetime derived from the filename, e.g. "2026-04-04T14:30:52" */
  created_at: string;
  /** Tags extracted from YAML frontmatter */
  tags: string[];
  /** First 200 characters of the note body (frontmatter excluded) */
  body_preview: string;
}

/**
 * Result of the create_note IPC command.
 */
export interface CreateNoteResult {
  /** Generated filename, e.g. "2026-04-04T143052.md" */
  filename: string;
  /** Absolute path to the created file */
  path: string;
}

/**
 * Result of the read_note IPC command.
 */
export interface ReadNoteResult {
  /** Full file content (frontmatter + body) */
  content: string;
}

/**
 * Application configuration persisted in config.json.
 * Canonical owner: module:settings (Rust backend).
 */
export interface Config {
  /** Absolute path to the notes storage directory */
  notes_dir: string;
}

/**
 * Parameters for list_notes IPC command.
 */
export interface ListNotesParams {
  /** ISO date string "YYYY-MM-DD" — inclusive start of date range */
  from_date?: string;
  /** ISO date string "YYYY-MM-DD" — inclusive end of date range */
  to_date?: string;
  /** Filter by a single tag */
  tag?: string;
}

/**
 * Parameters for search_notes IPC command.
 */
export interface SearchNotesParams {
  /** Full-text search query (case-insensitive substring match) */
  query: string;
  /** ISO date string "YYYY-MM-DD" — inclusive start of date range */
  from_date?: string;
  /** ISO date string "YYYY-MM-DD" — inclusive end of date range */
  to_date?: string;
  /** Filter by a single tag */
  tag?: string;
}

/**
 * Parameters for save_note IPC command.
 */
export interface SaveNoteParams {
  /** Target filename (must match YYYY-MM-DDTHHMMSS.md pattern) */
  filename: string;
  /** Full file content (frontmatter + body) to overwrite */
  content: string;
}

/**
 * Parameters for set_config IPC command.
 */
export interface SetConfigParams {
  /** New absolute path for the notes directory */
  notes_dir: string;
}
