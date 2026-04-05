// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 1-1
// @task-title: 対象モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD trace: plan:implementation_plan > sprint:1 > task:1-1
// Canonical owner (Rust side): module:storage (models.rs), module:settings (config.rs)
// TypeScript side follows Rust side. Do not diverge from Rust serde definitions.

/**
 * Represents a note entry returned by list_notes / search_notes IPC commands.
 * Canonical definition: module:storage Rust models.rs (serde::Serialize)
 */
export interface NoteEntry {
  /** File name, e.g. "2026-04-04T143052.md" */
  readonly filename: string;
  /** ISO-style datetime parsed from filename, e.g. "2026-04-04T14:30:52" */
  readonly created_at: string;
  /** Tags extracted from YAML frontmatter */
  readonly tags: readonly string[];
  /** First 200 characters of body text (Rust-side truncation) */
  readonly body_preview: string;
}

/**
 * Application configuration persisted in config.json.
 * Canonical definition: module:settings Rust config.rs
 */
export interface Config {
  /** Absolute path to the notes directory */
  readonly notes_dir: string;
}

/**
 * Result of create_note IPC command.
 */
export interface CreateNoteResult {
  /** Generated filename (YYYY-MM-DDTHHMMSS.md) */
  readonly filename: string;
  /** Absolute path to the created file */
  readonly path: string;
}

/**
 * Result of read_note IPC command.
 */
export interface ReadNoteResult {
  /** Full file content (frontmatter + body) */
  readonly content: string;
}

/**
 * Parameters for list_notes IPC command.
 * All fields are optional; omitting from_date/to_date returns all notes.
 */
export interface ListNotesParams {
  /** Start date filter (inclusive), format "YYYY-MM-DD" */
  from_date?: string;
  /** End date filter (inclusive), format "YYYY-MM-DD" */
  to_date?: string;
  /** Single tag to filter by */
  tag?: string;
}

/**
 * Parameters for search_notes IPC command.
 * query is required; date/tag filters are optional and combinable.
 */
export interface SearchNotesParams {
  /** Full-text search query (case-insensitive, Rust str::contains) */
  query: string;
  from_date?: string;
  to_date?: string;
  tag?: string;
}

/**
 * Parameters for save_note IPC command.
 */
export interface SaveNoteParams {
  /** Target filename (must match YYYY-MM-DDTHHMMSS pattern) */
  filename: string;
  /** Full content to write (frontmatter + body) */
  content: string;
}

/**
 * Parameters for read_note / delete_note IPC commands.
 */
export interface NoteFileParams {
  /** Target filename */
  filename: string;
}

/**
 * Parameters for set_config IPC command.
 */
export interface SetConfigParams {
  /** New notes directory absolute path */
  notes_dir: string;
}

/**
 * Application view identifiers for SPA conditional rendering.
 * Navigation is handled via currentView state in App.svelte (no router library).
 */
export type ViewName = 'editor' | 'grid' | 'settings';

/**
 * Navigation state shared between App.svelte and child view components.
 */
export interface NavigationState {
  /** Currently active view */
  currentView: ViewName;
  /** Filename of the note to open in editor (set by grid card click) */
  selectedFilename: string | null;
}
