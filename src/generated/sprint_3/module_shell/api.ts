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

// module:shell – Type-safe IPC API (public entry point)
// Sprint 3 – Tauri v2 (OQ-005 resolved)
//
// This module is the SINGLE entry point for all Tauri IPC communication.
// Frontend components (module:editor, module:grid, module:settings UI) MUST
// call functions from this module. Direct @tauri-apps/api/core invoke usage
// outside this module is PROHIBITED.
//
// Ref: detail:component_architecture §3.3, §3.4
// Ref: design:system-design §2.2.1 – IPC command table
// Ref: detail:storage_fileformat §3.3 – IPC boundary

import { invoke } from './ipc';
import { assertValidFilename } from './validation';
import type {
  NoteEntry,
  Config,
  CreateNoteResult,
  ReadNoteResult,
  SaveNoteParams,
  ReadNoteParams,
  DeleteNoteParams,
  ListNotesParams,
  SearchNotesParams,
  SetConfigParams,
} from './types';

// ---------------------------------------------------------------------------
// module:storage commands
// ---------------------------------------------------------------------------

/**
 * Creates a new note with a YYYY-MM-DDTHHMMSS.md filename.
 * Filename generation is exclusively owned by module:storage (Rust/chrono).
 * Frontend does NOT generate filenames.
 *
 * Called by: module:editor (Cmd+N / Ctrl+N handler)
 * Rust command: create_note
 */
export async function createNote(): Promise<CreateNoteResult> {
  return invoke<CreateNoteResult>('create_note');
}

/**
 * Overwrites the note file with the given content (frontmatter + body).
 * Content is written as-is; Rust side does not parse on write.
 * Debounce is managed by the caller (module:editor, 500ms).
 *
 * Called by: module:editor (auto-save debounce timer)
 * Rust command: save_note
 */
export async function saveNote(params: SaveNoteParams): Promise<void> {
  assertValidFilename(params.filename);
  await invoke<null>('save_note', {
    filename: params.filename,
    content: params.content,
  });
}

/**
 * Reads the full content of a note file.
 *
 * Called by: module:editor (note load on grid→editor transition)
 * Rust command: read_note
 */
export async function readNote(params: ReadNoteParams): Promise<ReadNoteResult> {
  assertValidFilename(params.filename);
  return invoke<ReadNoteResult>('read_note', {
    filename: params.filename,
  });
}

/**
 * Permanently deletes a note file. No soft-delete / trash.
 *
 * Called by: module:editor, module:grid
 * Rust command: delete_note
 */
export async function deleteNote(params: DeleteNoteParams): Promise<void> {
  assertValidFilename(params.filename);
  await invoke<null>('delete_note', {
    filename: params.filename,
  });
}

/**
 * Lists notes filtered by date range and/or tag.
 * Results are sorted by created_at descending (newest first) on Rust side.
 * Frontend does NOT re-sort or re-filter the results.
 *
 * Date format: YYYY-MM-DD (parsed by chrono::NaiveDate on Rust side).
 * Default 7-day range is calculated by the caller (module:grid).
 *
 * Called by: module:grid (initial load, filter changes)
 * Rust command: list_notes
 */
export async function listNotes(
  params: ListNotesParams = {},
): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>('list_notes', {
    from_date: params.from_date,
    to_date: params.to_date,
    tag: params.tag,
  });
}

/**
 * Full-text search across all note files.
 * Rust side performs case-insensitive substring match (str::contains).
 * No client-side search is performed; all search logic is in module:storage.
 * Filter parameters (date, tag) are applied in conjunction with the query.
 *
 * Called by: module:grid (search box input, debounced)
 * Rust command: search_notes
 */
export async function searchNotes(
  params: SearchNotesParams,
): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>('search_notes', {
    query: params.query,
    from_date: params.from_date,
    to_date: params.to_date,
    tag: params.tag,
  });
}

// ---------------------------------------------------------------------------
// module:settings commands
// ---------------------------------------------------------------------------

/**
 * Retrieves the current application configuration.
 *
 * Called by: module:settings UI
 * Rust command: get_config
 */
export async function getConfig(): Promise<Config> {
  return invoke<Config>('get_config');
}

/**
 * Updates the notes directory path.
 * Rust backend validates path existence and write permissions before persisting.
 * Frontend MUST NOT write to config.json directly (CONV-2).
 *
 * Called by: module:settings UI (directory picker confirmation)
 * Rust command: set_config
 */
export async function setConfig(params: SetConfigParams): Promise<void> {
  await invoke<null>('set_config', {
    notes_dir: params.notes_dir,
  });
}
