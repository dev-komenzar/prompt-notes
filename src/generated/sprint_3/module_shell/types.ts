// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 3-1
// @task-title: `module:shell`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// module:shell – Shared IPC boundary type definitions
// Sprint 3 – Tauri v2 (OQ-005 resolved)
// Canonical owner: module:storage (Rust side, models.rs / serde::Serialize)
// TypeScript definitions follow Rust side. Do not diverge.
// Refs: design:system-design §2.2.1, detail:component_architecture §3.2,
//       detail:storage_fileformat §3.4

/**
 * Metadata for a single note, returned by list_notes / search_notes.
 * Rust-side canonical definition: module:storage models.rs
 */
export interface NoteEntry {
  /** e.g. "2026-04-04T143052.md" */
  readonly filename: string;
  /** ISO-like datetime parsed from filename, e.g. "2026-04-04T14:30:52" */
  readonly created_at: string;
  /** Tags extracted from YAML frontmatter */
  readonly tags: readonly string[];
  /** First 200 characters of note body (frontmatter excluded) */
  readonly body_preview: string;
}

/**
 * Application configuration persisted in config.json.
 * Owned by module:settings (Rust backend).
 */
export interface Config {
  /** Absolute path to the notes directory */
  readonly notes_dir: string;
}

/** Response from create_note IPC command */
export interface CreateNoteResult {
  readonly filename: string;
  readonly path: string;
}

/** Response from read_note IPC command */
export interface ReadNoteResult {
  readonly content: string;
}

/** Arguments for save_note IPC command */
export interface SaveNoteParams {
  readonly filename: string;
  readonly content: string;
}

/** Arguments for read_note IPC command */
export interface ReadNoteParams {
  readonly filename: string;
}

/** Arguments for delete_note IPC command */
export interface DeleteNoteParams {
  readonly filename: string;
}

/** Arguments for list_notes IPC command. All fields optional. */
export interface ListNotesParams {
  /** YYYY-MM-DD format */
  readonly from_date?: string;
  /** YYYY-MM-DD format */
  readonly to_date?: string;
  /** Single tag string for filtering */
  readonly tag?: string;
}

/** Arguments for search_notes IPC command */
export interface SearchNotesParams {
  /** Full-text search query (case-insensitive substring match on Rust side) */
  readonly query: string;
  readonly from_date?: string;
  readonly to_date?: string;
  readonly tag?: string;
}

/** Arguments for set_config IPC command */
export interface SetConfigParams {
  readonly notes_dir: string;
}

/**
 * Application view identifiers for SPA routing.
 * Routing is state-variable based (no SPA router library).
 * Ref: detail:component_architecture §3.4
 */
export type AppView = 'editor' | 'grid' | 'settings';
