// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 4-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd-sprint: 4
// @codd-task: 4-1
// @codd-module: module:storage
// @codd-depends-on: detail:storage_fileformat, detail:component_architecture, design:system-design

/**
 * Note frontmatter. Fixed schema: only `tags` field is persisted.
 * Additional fields introduced by external editors are discarded on next save.
 * Corresponds to Rust `Frontmatter` in src-tauri/src/models.rs
 */
export interface Frontmatter {
  tags: string[];
}

/**
 * Lightweight note representation returned by list_notes and search_notes.
 * `id` is the filename without extension (e.g. "2026-04-11T143052").
 * `created_at` is derived from the filename, not from frontmatter or filesystem mtime.
 * `preview` is the first 100 characters of the body text (no frontmatter).
 * Corresponds to Rust `NoteMetadata` in src-tauri/src/models.rs
 */
export interface NoteMetadata {
  /** Filename without extension: YYYY-MM-DDTHHMMSS */
  id: string;
  tags: string[];
  /** ISO 8601 datetime derived from filename */
  created_at: string;
  /** First 100 chars of body text, used for grid card preview */
  preview: string;
}

/**
 * Full note data returned by read_note.
 * Corresponds to Rust `Note` in src-tauri/src/models.rs
 */
export interface Note {
  id: string;
  frontmatter: Frontmatter;
  body: string;
  /** ISO 8601 datetime derived from filename */
  created_at: string;
}

/**
 * Filter parameters for list_notes and search_notes.
 * All fields are optional; omitting a field disables that filter condition.
 * Multiple fields are combined with AND logic.
 * Corresponds to Rust `NoteFilter` in src-tauri/src/models.rs
 */
export interface NoteFilter {
  /** AND condition: only notes containing all specified tags are returned */
  tags?: string[];
  /** ISO 8601 date string (YYYY-MM-DD); inclusive lower bound on created_at */
  date_from?: string;
  /** ISO 8601 date string (YYYY-MM-DD); inclusive upper bound on created_at */
  date_to?: string;
}

/**
 * Application configuration persisted in config.json.
 * Corresponds to Rust `AppConfig` in src-tauri/src/models.rs
 *
 * Default notes_dir values:
 *   Linux:  ~/.local/share/promptnotes/notes/
 *   macOS:  ~/Library/Application Support/promptnotes/notes/
 */
export interface AppConfig {
  /** Absolute path to the notes storage directory */
  notes_dir: string;
}
