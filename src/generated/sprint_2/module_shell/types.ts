// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 2-1
// @task-title: `module:shell`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint:2 task:2-1 module:shell node:detail:component_architecture
// Canonical types for Tauri IPC boundary. Rust side (serde::Serialize) is authoritative.
// TypeScript definitions here must track Rust models.rs / config.rs exactly.

/**
 * Metadata for a single note, returned by list_notes / search_notes IPC commands.
 * Canonical owner: module:storage (Rust models.rs)
 */
export interface NoteEntry {
  /** e.g. "2026-04-04T143052.md" */
  readonly filename: string;
  /** ISO-like datetime derived from filename, e.g. "2026-04-04T14:30:52" */
  readonly created_at: string;
  /** Tags extracted from YAML frontmatter */
  readonly tags: readonly string[];
  /** First 200 characters of body text (frontmatter excluded) */
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
 * Application configuration.
 * Canonical owner: module:settings (Rust config.rs)
 */
export interface Config {
  readonly notes_dir: string;
}

/**
 * Parameters for list_notes IPC command.
 */
export interface ListNotesParams {
  readonly from_date?: string;
  readonly to_date?: string;
  readonly tag?: string;
}

/**
 * Parameters for search_notes IPC command.
 */
export interface SearchNotesParams {
  readonly query: string;
  readonly from_date?: string;
  readonly to_date?: string;
  readonly tag?: string;
}

/**
 * Parameters for save_note IPC command.
 */
export interface SaveNoteParams {
  readonly filename: string;
  readonly content: string;
}

/**
 * Parameters for read_note / delete_note IPC commands.
 */
export interface FilenameParams {
  readonly filename: string;
}

/**
 * Parameters for set_config IPC command.
 */
export interface SetConfigParams {
  readonly notes_dir: string;
}

/**
 * Application view identifiers for SPA routing via state variable.
 * No SPA router library is used — 3 screens only.
 */
export type AppView = 'grid' | 'editor' | 'settings';
