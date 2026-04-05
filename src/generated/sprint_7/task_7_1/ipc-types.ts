// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 7-1
// @task-title: 共有層
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=7 task=7-1 module=shared-layer
// TypeScript types for Tauri IPC command arguments and responses.
// All IPC communication flows through lib/api.ts; components MUST NOT invoke() directly.
// Rust #[tauri::command] signatures are the canonical source.

import type { NoteEntry, Config } from './types';

// ---------------------------------------------------------------------------
// create_note
// ---------------------------------------------------------------------------

/** Response from the `create_note` IPC command. */
export interface CreateNoteResponse {
  /** Generated filename, e.g. "2026-04-04T143052.md". Created by Rust chrono crate. */
  readonly filename: string;
  /** Absolute path to the newly created file. */
  readonly path: string;
}

// ---------------------------------------------------------------------------
// save_note
// ---------------------------------------------------------------------------

/** Arguments for the `save_note` IPC command. */
export interface SaveNoteArgs {
  /**
   * Target filename. Must match pattern `YYYY-MM-DDTHHMMSS.md` (with optional `_N` suffix).
   * Validated server-side against /^\d{4}-\d{2}-\d{2}T\d{6}(_\d+)?\.md$/
   */
  readonly filename: string;
  /** Full file content including frontmatter + body. Written verbatim by Rust std::fs::write. */
  readonly content: string;
}

// ---------------------------------------------------------------------------
// read_note
// ---------------------------------------------------------------------------

/** Arguments for the `read_note` IPC command. */
export interface ReadNoteArgs {
  /** Filename to read. Subject to the same validation as SaveNoteArgs.filename. */
  readonly filename: string;
}

/** Response from the `read_note` IPC command. */
export interface ReadNoteResponse {
  /** Raw file content (frontmatter + body). */
  readonly content: string;
}

// ---------------------------------------------------------------------------
// delete_note
// ---------------------------------------------------------------------------

/** Arguments for the `delete_note` IPC command. */
export interface DeleteNoteArgs {
  /** Filename to physically remove. Subject to filename validation. */
  readonly filename: string;
}

// ---------------------------------------------------------------------------
// list_notes
// ---------------------------------------------------------------------------

/** Arguments for the `list_notes` IPC command. */
export interface ListNotesArgs {
  /**
   * Inclusive start date for filtering by filename timestamp.
   * Format: "YYYY-MM-DD". Parsed by Rust chrono::NaiveDate.
   * When omitted, no lower bound is applied.
   */
  readonly from_date?: string;
  /**
   * Inclusive end date for filtering by filename timestamp.
   * Format: "YYYY-MM-DD". Parsed by Rust chrono::NaiveDate.
   * When omitted, no upper bound is applied.
   */
  readonly to_date?: string;
  /**
   * Single tag to filter by. Rust side checks NoteEntry.tags contains this value.
   * When omitted, no tag filter is applied.
   */
  readonly tag?: string;
}

/** Response type alias for `list_notes`. Sorted by created_at descending (newest first). */
export type ListNotesResponse = readonly NoteEntry[];

// ---------------------------------------------------------------------------
// search_notes
// ---------------------------------------------------------------------------

/** Arguments for the `search_notes` IPC command. */
export interface SearchNotesArgs {
  /** Non-empty query string. Rust side performs case-insensitive str::contains match. */
  readonly query: string;
  /** Optional inclusive start date filter. Same format as ListNotesArgs.from_date. */
  readonly from_date?: string;
  /** Optional inclusive end date filter. Same format as ListNotesArgs.to_date. */
  readonly to_date?: string;
  /** Optional single-tag filter. Same semantics as ListNotesArgs.tag. */
  readonly tag?: string;
}

/** Response type alias for `search_notes`. Sorted by created_at descending (newest first). */
export type SearchNotesResponse = readonly NoteEntry[];

// ---------------------------------------------------------------------------
// get_config
// ---------------------------------------------------------------------------

/** Response type alias for `get_config`. */
export type GetConfigResponse = Config;

// ---------------------------------------------------------------------------
// set_config
// ---------------------------------------------------------------------------

/** Arguments for the `set_config` IPC command. */
export interface SetConfigArgs {
  /**
   * New absolute path for the notes directory.
   * Rust backend validates existence and write permissions before persisting to config.json.
   * Frontend MUST NOT perform filesystem path operations directly.
   */
  readonly notes_dir: string;
}
