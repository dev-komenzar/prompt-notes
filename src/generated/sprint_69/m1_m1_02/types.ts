// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 69-1
// @task-title: M1（M1-02）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated sprint:69 task:69-1 module:m1_m1_02
// CoDD trace: design:system-design, detail:component_architecture, detail:storage_fileformat
// Tauri v2 — Shared type definitions (canonical TypeScript mirror of Rust serde types)

/**
 * NoteEntry represents a single note's metadata as returned by module:storage IPC commands.
 * Canonical definition: Rust side models.rs (serde::Serialize/Deserialize).
 * TypeScript side MUST follow Rust side. Do not add fields here without Rust-side change.
 */
export interface NoteEntry {
  /** Filename in YYYY-MM-DDTHHMMSS.md format, e.g. "2026-04-04T143052.md" */
  readonly filename: string;
  /** ISO-like datetime string parsed from filename, e.g. "2026-04-04T14:30:52" */
  readonly created_at: string;
  /** Tags extracted from YAML frontmatter. Empty array if no tags or parse error. */
  readonly tags: readonly string[];
  /** First 200 characters of note body (frontmatter excluded). Truncated by Rust side. */
  readonly body_preview: string;
}

/**
 * Application configuration persisted in config.json.
 * Canonical definition: Rust side config.rs.
 * Owned by module:settings (Rust backend). Frontend MUST NOT write config directly.
 */
export interface Config {
  /** Absolute path to notes directory. Validated and persisted by Rust backend only. */
  readonly notes_dir: string;
}

/**
 * Result of create_note IPC command.
 */
export interface CreateNoteResult {
  /** Generated filename (YYYY-MM-DDTHHMMSS.md or with _N suffix) */
  readonly filename: string;
  /** Absolute path to the created file */
  readonly path: string;
}

/**
 * Result of read_note IPC command.
 */
export interface ReadNoteResult {
  /** Full file content including frontmatter */
  readonly content: string;
}

/**
 * Arguments for list_notes IPC command.
 * All fields optional — Rust side applies filters only when present.
 */
export interface ListNotesArgs {
  /** Inclusive start date in YYYY-MM-DD format */
  readonly from_date?: string;
  /** Inclusive end date in YYYY-MM-DD format */
  readonly to_date?: string;
  /** Single tag to filter by (exact match against NoteEntry.tags) */
  readonly tag?: string;
}

/**
 * Arguments for search_notes IPC command.
 * query is required; filters are optional and combinable.
 */
export interface SearchNotesArgs {
  /** Non-empty search query string. Case-insensitive substring match on Rust side. */
  readonly query: string;
  /** Inclusive start date in YYYY-MM-DD format */
  readonly from_date?: string;
  /** Inclusive end date in YYYY-MM-DD format */
  readonly to_date?: string;
  /** Single tag to filter by */
  readonly tag?: string;
}

/**
 * Arguments for save_note IPC command.
 */
export interface SaveNoteArgs {
  /** Filename validated against /^\d{4}-\d{2}-\d{2}T\d{6}(_\d+)?\.md$/ on Rust side */
  readonly filename: string;
  /** Full file content (frontmatter + body) to overwrite */
  readonly content: string;
}

/**
 * Arguments for read_note / delete_note IPC commands.
 */
export interface NoteFilenameArgs {
  readonly filename: string;
}

/**
 * Arguments for set_config IPC command.
 * Path validation (existence, write permissions) is performed by Rust backend.
 */
export interface SetConfigArgs {
  readonly notes_dir: string;
}

/**
 * Supported application view states for SPA conditional rendering.
 * No routing library — App.svelte uses this discriminant for view switching.
 */
export type ViewState = 'editor' | 'grid' | 'settings';

/**
 * Platform identifiers. Windows is explicitly excluded from scope.
 */
export type SupportedPlatform = 'linux' | 'macos';
