// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 14-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:14 task:14-1 module:storage
// Shared type definitions — TypeScript side follows Rust canonical definitions.
// Canonical owner: module:storage (Rust models.rs). Do not diverge.

/**
 * Represents a note entry returned by list_notes / search_notes IPC commands.
 * Rust canonical: module:storage models.rs NoteEntry
 */
export interface NoteEntry {
  /** Filename e.g. "2026-04-04T143052.md" */
  readonly filename: string;
  /** ISO 8601 datetime derived from filename e.g. "2026-04-04T14:30:52" */
  readonly created_at: string;
  /** Tags extracted from YAML frontmatter */
  readonly tags: readonly string[];
  /** First 200 characters of body text (Rust-side truncated) */
  readonly body_preview: string;
}

/**
 * Response from create_note IPC command.
 */
export interface CreateNoteResponse {
  readonly filename: string;
  readonly path: string;
}

/**
 * Response from read_note IPC command.
 */
export interface ReadNoteResponse {
  readonly content: string;
}

/**
 * Arguments for save_note IPC command.
 */
export interface SaveNoteArgs {
  readonly filename: string;
  readonly content: string;
}

/**
 * Arguments for read_note IPC command.
 */
export interface ReadNoteArgs {
  readonly filename: string;
}

/**
 * Arguments for delete_note IPC command.
 */
export interface DeleteNoteArgs {
  readonly filename: string;
}

/**
 * Arguments for list_notes IPC command.
 * All fields optional — Rust side applies filters only when present.
 */
export interface ListNotesArgs {
  readonly from_date?: string;
  readonly to_date?: string;
  readonly tag?: string;
}

/**
 * Arguments for search_notes IPC command.
 * query is required; filter fields are optional.
 */
export interface SearchNotesArgs {
  readonly query: string;
  readonly from_date?: string;
  readonly to_date?: string;
  readonly tag?: string;
}

/**
 * Application configuration.
 * Rust canonical: module:settings config.rs Config
 */
export interface Config {
  readonly notes_dir: string;
}

/**
 * Arguments for set_config IPC command.
 */
export interface SetConfigArgs {
  readonly notes_dir: string;
}
