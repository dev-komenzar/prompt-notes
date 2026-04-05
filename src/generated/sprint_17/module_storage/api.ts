// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 17-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// module:storage — Tauri IPC wrappers
// All file operations go through Rust backend via Tauri IPC (invoke).
// Direct filesystem access from frontend is prohibited.
// This file is the single entry point for IPC calls related to storage.
// Components must use these functions instead of calling invoke() directly.

import { invoke } from '@tauri-apps/api/core';
import type {
  NoteEntry,
  Config,
  CreateNoteResponse,
  ReadNoteResponse,
  ListNotesParams,
  SearchNotesParams,
} from './types';

/**
 * Creates a new note file.
 * Rust backend generates the YYYY-MM-DDTHHMMSS.md filename from current timestamp.
 * Returns the generated filename and full path.
 */
export async function createNote(): Promise<CreateNoteResponse> {
  return invoke<CreateNoteResponse>('create_note');
}

/**
 * Overwrites a note file with new content (frontmatter + body).
 * Called by the auto-save mechanism after debounce.
 * Filename is validated on Rust side against YYYY-MM-DDTHHMMSS[_N].md pattern.
 */
export async function saveNote(
  filename: string,
  content: string,
): Promise<void> {
  return invoke<void>('save_note', { filename, content });
}

/**
 * Reads the full content of a note file.
 * Used when opening a note from grid view or reloading editor state.
 */
export async function readNote(filename: string): Promise<ReadNoteResponse> {
  return invoke<ReadNoteResponse>('read_note', { filename });
}

/**
 * Permanently deletes a note file from the filesystem.
 * No soft-delete or trash mechanism.
 */
export async function deleteNote(filename: string): Promise<void> {
  return invoke<void>('delete_note', { filename });
}

/**
 * Lists notes with optional date range and tag filters.
 * Results are sorted by created_at descending (newest first).
 * Rust backend scans the notes directory, parses filenames and frontmatter.
 *
 * Default 7-day filter: callers should compute from_date / to_date
 * using getDefaultFromDate() / getDefaultToDate() from filename.ts.
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
 * Rust backend performs case-insensitive substring matching via file scan.
 * Supports combined filtering with date range and tag.
 * No index engine — file scan is sufficient for expected volume (< 5000 notes).
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

/**
 * Retrieves the current application configuration.
 * Owned by module:settings (Rust backend).
 */
export async function getConfig(): Promise<Config> {
  return invoke<Config>('get_config');
}

/**
 * Updates the notes directory path in config.json.
 * Path validation and write permission checks are performed on Rust side.
 * Frontend must not manipulate file paths directly.
 */
export async function setConfig(notesDir: string): Promise<void> {
  return invoke<void>('set_config', { notes_dir: notesDir });
}
