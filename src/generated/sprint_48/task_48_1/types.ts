// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 48-1
// @task-title: 対象モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=48, task=48-1, module=types
// Canonical TypeScript type definitions for PromptNotes IPC boundary.
// Rust side (module:storage models.rs) is the source of truth;
// these definitions MUST stay in sync with serde Serialize/Deserialize structs.

/**
 * Represents a single note entry returned by list_notes / search_notes IPC commands.
 * Canonical owner: module:storage (Rust side models.rs).
 */
export interface NoteEntry {
  /** Filename including extension, e.g. "2026-04-04T143052.md" */
  readonly filename: string;
  /** ISO-8601-ish datetime derived from the filename, e.g. "2026-04-04T14:30:52" */
  readonly created_at: string;
  /** Tags extracted from YAML frontmatter. Empty array when absent or parse error. */
  readonly tags: readonly string[];
  /** First 200 characters of the note body (frontmatter excluded). Cut by Rust side. */
  readonly body_preview: string;
}

/**
 * Application configuration persisted in config.json.
 * Canonical owner: module:settings (Rust side config.rs).
 */
export interface Config {
  /** Absolute path to the notes directory. */
  readonly notes_dir: string;
}

// ── IPC command argument / return types ──────────────────────────────

/** Return value of the create_note IPC command. */
export interface CreateNoteResult {
  readonly filename: string;
  readonly path: string;
}

/** Arguments for the save_note IPC command. */
export interface SaveNoteArgs {
  readonly filename: string;
  readonly content: string;
}

/** Arguments for the read_note IPC command. */
export interface ReadNoteArgs {
  readonly filename: string;
}

/** Return value of the read_note IPC command. */
export interface ReadNoteResult {
  readonly content: string;
}

/** Arguments for the delete_note IPC command. */
export interface DeleteNoteArgs {
  readonly filename: string;
}

/** Arguments for the list_notes IPC command. All fields optional. */
export interface ListNotesArgs {
  readonly from_date?: string;
  readonly to_date?: string;
  readonly tag?: string;
}

/** Arguments for the search_notes IPC command. */
export interface SearchNotesArgs {
  readonly query: string;
  readonly from_date?: string;
  readonly to_date?: string;
  readonly tag?: string;
}

/** Arguments for the set_config IPC command. */
export interface SetConfigArgs {
  readonly notes_dir: string;
}

// ── Application view state ───────────────────────────────────────────

/** Discriminated union of the three application views. */
export type ViewName = "editor" | "grid" | "settings";

/**
 * Minimal navigation state shared via App.svelte's reactive variable.
 * When navigating to editor with a specific note, selectedFilename is set.
 */
export interface NavigationState {
  readonly currentView: ViewName;
  readonly selectedFilename: string | null;
}
