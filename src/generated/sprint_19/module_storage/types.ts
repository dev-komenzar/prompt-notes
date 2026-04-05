// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 19-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=19, task=19-1, module=storage, node=detail:storage_fileformat
// Canonical TypeScript types for module:storage IPC boundary.
// Rust side (serde::Serialize/Deserialize) is the source of truth.

/**
 * Represents a note entry returned by list_notes / search_notes IPC commands.
 * Canonical definition: module:storage Rust models.rs
 */
export interface NoteEntry {
  /** Filename in YYYY-MM-DDTHHMMSS.md format, e.g. "2026-04-04T143052.md" */
  readonly filename: string;
  /** ISO 8601 datetime derived from filename, e.g. "2026-04-04T14:30:52" */
  readonly created_at: string;
  /** Tags extracted from YAML frontmatter */
  readonly tags: readonly string[];
  /** First 200 characters of note body (frontmatter excluded) */
  readonly body_preview: string;
}

/**
 * Application configuration persisted in config.json.
 * Canonical definition: module:settings Rust config.rs
 */
export interface Config {
  /** Absolute path to notes directory */
  readonly notes_dir: string;
}

/**
 * Response from create_note IPC command.
 */
export interface CreateNoteResponse {
  /** Generated filename in YYYY-MM-DDTHHMMSS.md format */
  readonly filename: string;
  /** Absolute path to created file */
  readonly path: string;
}

/**
 * Response from read_note IPC command.
 */
export interface ReadNoteResponse {
  /** Full file content including frontmatter */
  readonly content: string;
}

/**
 * Arguments for save_note IPC command.
 */
export interface SaveNoteParams {
  /** Target filename (must match YYYY-MM-DDTHHMMSS.md pattern) */
  readonly filename: string;
  /** Full content including frontmatter to write */
  readonly content: string;
}

/**
 * Arguments for read_note / delete_note IPC commands.
 */
export interface NoteFileParams {
  /** Target filename (must match YYYY-MM-DDTHHMMSS.md pattern) */
  readonly filename: string;
}

/**
 * Arguments for list_notes IPC command.
 * All filter parameters are optional.
 */
export interface ListNotesParams {
  /** Start date filter in YYYY-MM-DD format (inclusive) */
  readonly from_date?: string;
  /** End date filter in YYYY-MM-DD format (inclusive) */
  readonly to_date?: string;
  /** Single tag to filter by */
  readonly tag?: string;
}

/**
 * Arguments for search_notes IPC command.
 * query is required; filter parameters are optional and combinable.
 */
export interface SearchNotesParams {
  /** Full-text search query string (case-insensitive substring match) */
  readonly query: string;
  /** Start date filter in YYYY-MM-DD format (inclusive) */
  readonly from_date?: string;
  /** End date filter in YYYY-MM-DD format (inclusive) */
  readonly to_date?: string;
  /** Single tag to filter by */
  readonly tag?: string;
}

/**
 * Union type for errors returned from storage IPC commands.
 */
export interface StorageError {
  readonly code: string;
  readonly message: string;
}

/**
 * Filename validation pattern matching Rust-side regex.
 * Pattern: YYYY-MM-DDTHHMMSS.md with optional _N suffix for collision avoidance.
 */
export const FILENAME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{6}(_\d+)?\.md$/;
