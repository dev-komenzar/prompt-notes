// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 24-1
// @task-title: 対象モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// PromptNotes — Core Type Definitions
// Canonical source: module:storage (Rust side serde::Serialize/Deserialize)
// TypeScript definitions track Rust side; do not introduce fields not present in Rust models.

/**
 * Represents a note entry returned by list_notes / search_notes IPC commands.
 * Rust canonical: module:storage models.rs NoteEntry
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
 * Rust canonical: module:settings config.rs Config
 */
export interface Config {
  /** Absolute path to the notes directory */
  readonly notes_dir: string;
}

/** Response from create_note IPC command */
export interface CreateNoteResponse {
  /** Generated filename, e.g. "2026-04-05T091200.md" */
  readonly filename: string;
  /** Full filesystem path to created file */
  readonly path: string;
}

/** Response from read_note IPC command */
export interface ReadNoteResponse {
  /** Full file content including frontmatter */
  readonly content: string;
}

/** Parameters for save_note IPC command */
export interface SaveNoteParams {
  /** Target filename (must match YYYY-MM-DDTHHMMSS.md pattern) */
  readonly filename: string;
  /** Full file content including frontmatter to persist */
  readonly content: string;
}

/** Parameters for read_note IPC command */
export interface ReadNoteParams {
  /** Target filename */
  readonly filename: string;
}

/** Parameters for delete_note IPC command */
export interface DeleteNoteParams {
  /** Target filename */
  readonly filename: string;
}

/** Parameters for list_notes IPC command */
export interface ListNotesParams {
  /** Start date filter in YYYY-MM-DD format */
  readonly from_date?: string;
  /** End date filter in YYYY-MM-DD format */
  readonly to_date?: string;
  /** Single tag to filter by */
  readonly tag?: string;
}

/** Parameters for search_notes IPC command */
export interface SearchNotesParams {
  /** Full-text search query (case-insensitive substring match on Rust side) */
  readonly query: string;
  /** Start date filter in YYYY-MM-DD format */
  readonly from_date?: string;
  /** End date filter in YYYY-MM-DD format */
  readonly to_date?: string;
  /** Single tag to filter by */
  readonly tag?: string;
}

/** Parameters for set_config IPC command */
export interface SetConfigParams {
  /** New notes directory path (validated on Rust side) */
  readonly notes_dir: string;
}

/** SPA view names for conditional rendering in App.svelte */
export type ViewName = 'editor' | 'grid' | 'settings';

/** Application-level navigation state */
export interface AppState {
  readonly currentView: ViewName;
  readonly selectedFilename: string | null;
}
