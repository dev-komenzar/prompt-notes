// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 12-1
// @task-title: 対象モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=12 task=12-1 module=types
// Canonical TypeScript type definitions mirroring Rust backend (module:storage models.rs).
// Rust side is the source of truth; these types follow Rust serde output.

/**
 * Represents a single note entry returned by list_notes / search_notes IPC commands.
 * Canonical owner: module:storage (Rust models.rs)
 */
export interface NoteEntry {
  /** Filename in YYYY-MM-DDTHHMMSS.md format, e.g. "2026-04-04T143052.md" */
  readonly filename: string;
  /** ISO-like datetime string parsed from filename, e.g. "2026-04-04T14:30:52" */
  readonly created_at: string;
  /** Tags extracted from YAML frontmatter */
  readonly tags: readonly string[];
  /** First 200 characters of the note body (frontmatter excluded) */
  readonly body_preview: string;
}

/**
 * Application configuration persisted in config.json.
 * Canonical owner: module:settings (Rust config.rs)
 */
export interface Config {
  /** Absolute path to the notes directory */
  readonly notes_dir: string;
}

/**
 * Response from create_note IPC command.
 */
export interface CreateNoteResult {
  /** Generated filename, e.g. "2026-04-04T143052.md" */
  readonly filename: string;
  /** Full absolute path to the created file */
  readonly path: string;
}

/**
 * Response from read_note IPC command.
 */
export interface ReadNoteResult {
  /** Full file content including frontmatter */
  readonly content: string;
}

/**
 * Arguments for list_notes IPC command.
 * All fields are optional; omitting them removes the corresponding filter.
 */
export interface ListNotesArgs {
  /** Start date filter in YYYY-MM-DD format */
  readonly from_date?: string;
  /** End date filter in YYYY-MM-DD format */
  readonly to_date?: string;
  /** Tag filter — single tag string */
  readonly tag?: string;
}

/**
 * Arguments for search_notes IPC command.
 */
export interface SearchNotesArgs {
  /** Search query string (case-insensitive substring match on Rust side) */
  readonly query: string;
  /** Start date filter in YYYY-MM-DD format */
  readonly from_date?: string;
  /** End date filter in YYYY-MM-DD format */
  readonly to_date?: string;
  /** Tag filter — single tag string */
  readonly tag?: string;
}

/**
 * Arguments for save_note IPC command.
 */
export interface SaveNoteArgs {
  /** Target filename (must match YYYY-MM-DDTHHMMSS.md pattern) */
  readonly filename: string;
  /** Full file content including frontmatter */
  readonly content: string;
}

/**
 * Arguments for read_note / delete_note IPC commands.
 */
export interface FileTargetArgs {
  /** Target filename (must match YYYY-MM-DDTHHMMSS.md pattern) */
  readonly filename: string;
}

/**
 * Arguments for set_config IPC command.
 */
export interface SetConfigArgs {
  /** New notes directory path (validated by Rust backend) */
  readonly notes_dir: string;
}

/**
 * Application view identifiers for SPA navigation via conditional rendering.
 * No router library is used — App.svelte switches on this value.
 */
export type ViewType = 'editor' | 'grid' | 'settings';

/**
 * Navigation state passed when transitioning between views.
 */
export interface NavigationState {
  readonly currentView: ViewType;
  /** Filename of the note to open in editor (set when navigating from grid) */
  readonly selectedFilename: string | null;
}
