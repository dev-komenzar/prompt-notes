// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 5-1
// @task-title: `module:storage`, `module:settings`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=5, task=5-1, modules=[storage,settings]
// Single entry point for all Tauri IPC invoke calls.
// Components must use these functions exclusively; direct invoke() calls in components are prohibited.

import { invoke } from '@tauri-apps/api/core';
import type {
  NoteEntry,
  Config,
  CreateNoteResponse,
  ReadNoteResponse,
  SaveNoteParams,
  ReadNoteParams,
  DeleteNoteParams,
  ListNotesParams,
  SearchNotesParams,
  SetConfigParams,
} from './types';

// ---------------------------------------------------------------------------
// module:storage IPC commands
// ---------------------------------------------------------------------------

/**
 * Creates a new note file with timestamp-based filename (YYYY-MM-DDTHHMMSS.md).
 * Filename generation is exclusively owned by Rust backend (chrono crate).
 * Frontend must not generate filenames.
 *
 * Called by: module:editor (Cmd+N / Ctrl+N handler)
 */
export async function createNote(): Promise<CreateNoteResponse> {
  return invoke<CreateNoteResponse>('create_note');
}

/**
 * Saves note content to an existing file via atomic overwrite.
 * Rust backend validates filename against pattern and rejects path traversal attempts.
 * Content includes frontmatter + body as a single string.
 *
 * Called by: module:editor (auto-save debounce callback)
 */
export async function saveNote(params: SaveNoteParams): Promise<void> {
  return invoke<void>('save_note', {
    filename: params.filename,
    content: params.content,
  });
}

/**
 * Reads a note file and returns its full content (frontmatter + body).
 * Rust backend validates filename against pattern.
 *
 * Called by: module:editor (note load on grid-to-editor transition)
 */
export async function readNote(params: ReadNoteParams): Promise<ReadNoteResponse> {
  return invoke<ReadNoteResponse>('read_note', {
    filename: params.filename,
  });
}

/**
 * Permanently deletes a note file from the filesystem.
 * No soft-delete or trash mechanism. Rust backend validates filename.
 *
 * Called by: module:editor, module:grid (delete action)
 */
export async function deleteNote(params: DeleteNoteParams): Promise<void> {
  return invoke<void>('delete_note', {
    filename: params.filename,
  });
}

/**
 * Lists notes filtered by date range and/or tag.
 * Returns NoteEntry[] sorted by created_at descending (newest first).
 * Sorting is performed by Rust backend; no client-side re-sorting needed.
 *
 * Date filtering compares against filename timestamps.
 * Tag filtering checks frontmatter tags array.
 * When query is empty, use this instead of searchNotes.
 *
 * Called by: module:grid (initial load, filter changes)
 */
export async function listNotes(params: ListNotesParams): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>('list_notes', {
    from_date: params.from_date,
    to_date: params.to_date,
    tag: params.tag,
  });
}

/**
 * Full-text searches notes via file system scan (str::contains, case-insensitive).
 * Filter parameters (date range, tag) are applied in conjunction with the query.
 * Returns NoteEntry[] sorted by created_at descending.
 * No index engine is used; Rust backend performs sequential file scan.
 *
 * Called by: module:grid (search box input after debounce)
 */
export async function searchNotes(params: SearchNotesParams): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>('search_notes', {
    query: params.query,
    from_date: params.from_date,
    to_date: params.to_date,
    tag: params.tag,
  });
}

// ---------------------------------------------------------------------------
// module:settings IPC commands
// ---------------------------------------------------------------------------

/**
 * Retrieves the current application configuration.
 * Config includes notes_dir (storage directory path).
 *
 * Called by: module:settings UI (on mount)
 */
export async function getConfig(): Promise<Config> {
  return invoke<Config>('get_config');
}

/**
 * Updates the application configuration.
 * Rust backend validates the path (existence check, write permission check)
 * before persisting to config.json.
 * Frontend must not perform path validation or filesystem writes.
 *
 * After successful update, new notes are saved to the new directory.
 * Existing notes are NOT automatically moved.
 *
 * Called by: module:settings UI (directory change confirmation)
 */
export async function setConfig(params: SetConfigParams): Promise<void> {
  return invoke<void>('set_config', {
    notes_dir: params.notes_dir,
  });
}
