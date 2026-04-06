// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 65-1
// @task-title: 解決マイルストーン
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=65, task=65-1, module=storage+editor+grid+settings
// Canonical TypeScript type definitions aligned with Rust backend (module:storage models.rs)
// Rust side is the source of truth; these types track IPC JSON serialization contracts.

/**
 * Represents a single note entry as returned by list_notes / search_notes IPC commands.
 * Canonical owner: module:storage (Rust models.rs)
 */
export interface NoteEntry {
  /** Filename in YYYY-MM-DDTHHMMSS.md format, e.g. "2026-04-04T143052.md" */
  readonly filename: string;
  /** ISO-style datetime derived from filename, e.g. "2026-04-04T14:30:52" */
  readonly created_at: string;
  /** Tags extracted from YAML frontmatter */
  readonly tags: readonly string[];
  /** First 200 characters of note body (frontmatter excluded), for card preview */
  readonly body_preview: string;
}

/**
 * Application configuration persisted in config.json by module:settings (Rust backend).
 * Canonical owner: module:settings (Rust config.rs)
 */
export interface Config {
  /** Absolute path to the notes storage directory */
  readonly notes_dir: string;
}

/**
 * Response from create_note IPC command.
 */
export interface CreateNoteResponse {
  /** Generated filename in YYYY-MM-DDTHHMMSS.md format */
  readonly filename: string;
  /** Absolute path to the created file */
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
 * Arguments for list_notes IPC command.
 * All fields are optional; omitted fields apply no filter.
 */
export interface ListNotesArgs {
  /** ISO date string YYYY-MM-DD for range start (inclusive) */
  readonly from_date?: string;
  /** ISO date string YYYY-MM-DD for range end (inclusive) */
  readonly to_date?: string;
  /** Single tag to filter by */
  readonly tag?: string;
}

/**
 * Arguments for search_notes IPC command.
 */
export interface SearchNotesArgs {
  /** Non-empty search query string */
  readonly query: string;
  /** ISO date string YYYY-MM-DD for range start (inclusive) */
  readonly from_date?: string;
  /** ISO date string YYYY-MM-DD for range end (inclusive) */
  readonly to_date?: string;
  /** Single tag to filter by */
  readonly tag?: string;
}

/**
 * Arguments for save_note IPC command.
 */
export interface SaveNoteArgs {
  /** Filename (must match YYYY-MM-DDTHHMMSS pattern) */
  readonly filename: string;
  /** Full file content including frontmatter */
  readonly content: string;
}

/**
 * Arguments for read_note and delete_note IPC commands.
 */
export interface NoteFilenameArgs {
  /** Filename (must match YYYY-MM-DDTHHMMSS pattern) */
  readonly filename: string;
}

/**
 * Arguments for set_config IPC command.
 */
export interface SetConfigArgs {
  /** New absolute path for notes directory */
  readonly notes_dir: string;
}

/**
 * Application view state for SPA navigation via conditional rendering.
 * No SPA routing library is used; App.svelte switches on this value.
 */
export type ViewName = "editor" | "grid" | "settings";

/**
 * Complete application navigation state.
 */
export interface AppState {
  currentView: ViewName;
  /** Filename of the note to open in editor (set when navigating from grid) */
  selectedFilename: string | null;
}
