// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 36-1
// @task-title: 対象モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// PromptNotes — Shared Type Definitions
// Canonical source: module:storage (Rust side). TypeScript definitions follow Rust.
// CoDD trace: detail:component_architecture, detail:storage_fileformat, detail:editor_clipboard, detail:grid_search

/**
 * Represents a note entry returned by list_notes / search_notes IPC commands.
 * Rust-side canonical definition in module:storage models.rs.
 */
export interface NoteEntry {
  /** File name, e.g. "2026-04-04T143052.md" */
  readonly filename: string;
  /** ISO-style datetime derived from filename, e.g. "2026-04-04T14:30:52" */
  readonly created_at: string;
  /** Tags extracted from YAML frontmatter */
  readonly tags: readonly string[];
  /** First 200 characters of body text (frontmatter excluded) */
  readonly body_preview: string;
}

/**
 * Application configuration persisted in config.json.
 * Owned by module:settings (Rust backend).
 */
export interface Config {
  /** Absolute path to the notes storage directory */
  readonly notes_dir: string;
}

/** Result of the create_note IPC command. */
export interface CreateNoteResult {
  readonly filename: string;
  readonly path: string;
}

/** Result of the read_note IPC command. */
export interface ReadNoteResult {
  readonly content: string;
}

/** Parameters for save_note IPC command. */
export interface SaveNoteParams {
  readonly filename: string;
  readonly content: string;
}

/** Parameters for read_note IPC command. */
export interface ReadNoteParams {
  readonly filename: string;
}

/** Parameters for delete_note IPC command. */
export interface DeleteNoteParams {
  readonly filename: string;
}

/** Parameters for list_notes IPC command. */
export interface ListNotesParams {
  readonly from_date?: string;
  readonly to_date?: string;
  readonly tag?: string;
}

/** Parameters for search_notes IPC command. */
export interface SearchNotesParams {
  readonly query: string;
  readonly from_date?: string;
  readonly to_date?: string;
  readonly tag?: string;
}

/** Parameters for set_config IPC command. */
export interface SetConfigParams {
  readonly notes_dir: string;
}

/** Application view identifiers for SPA navigation via conditional rendering. */
export type ViewName = "editor" | "grid" | "settings";

/**
 * Navigation state passed between views.
 * Used when transitioning from grid to editor with a selected note.
 */
export interface NavigationState {
  readonly view: ViewName;
  readonly selectedFilename?: string;
}
