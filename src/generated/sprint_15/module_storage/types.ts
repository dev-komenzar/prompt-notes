// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 15-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// module:storage — Shared type definitions
// Canonical source: Rust module:storage models.rs. TypeScript follows Rust.
// Sprint 15 · M2-03 · read_note IPC コマンド実装

/**
 * Represents a note entry returned by list_notes / search_notes IPC commands.
 * Rust-side serde::Serialize is canonical; this type must stay in sync.
 */
export interface NoteEntry {
  /** Filename in YYYY-MM-DDTHHMMSS.md format (e.g. "2026-04-04T143052.md") */
  readonly filename: string;
  /** ISO-8601-like datetime derived from filename (e.g. "2026-04-04T14:30:52") */
  readonly created_at: string;
  /** Tags extracted from YAML frontmatter */
  readonly tags: readonly string[];
  /** First 200 characters of note body (Rust-side truncation) */
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

// ── IPC command parameter types ──────────────────────────────────────

export interface CreateNoteResponse {
  readonly filename: string;
  readonly path: string;
}

export interface ReadNoteParams {
  readonly filename: string;
}

export interface ReadNoteResponse {
  readonly content: string;
}

export interface SaveNoteParams {
  readonly filename: string;
  readonly content: string;
}

export interface DeleteNoteParams {
  readonly filename: string;
}

export interface ListNotesParams {
  readonly from_date?: string;
  readonly to_date?: string;
  readonly tag?: string;
}

export interface SearchNotesParams {
  readonly query: string;
  readonly from_date?: string;
  readonly to_date?: string;
  readonly tag?: string;
}

export interface SetConfigParams {
  readonly notes_dir: string;
}
