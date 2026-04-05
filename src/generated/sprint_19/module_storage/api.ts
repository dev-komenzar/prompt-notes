// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 19-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=19, task=19-1, module=storage, node=detail:component_architecture
// Single entry point for all module:storage IPC commands.
// All Tauri invoke calls are confined to this file.
// Components must use these wrapper functions instead of calling invoke directly.

import { invoke } from '@tauri-apps/api/core';
import type {
  NoteEntry,
  CreateNoteResponse,
  ReadNoteResponse,
  SaveNoteParams,
  NoteFileParams,
  ListNotesParams,
  SearchNotesParams,
} from './types';
import { FILENAME_PATTERN } from './types';

/**
 * Creates a new note via create_note IPC command.
 * Rust backend generates the YYYY-MM-DDTHHMMSS.md filename using chrono.
 * Frontend must NOT generate filenames.
 *
 * Called by: module:editor (Cmd+N / Ctrl+N handler)
 */
export async function createNote(): Promise<CreateNoteResponse> {
  return invoke<CreateNoteResponse>('create_note');
}

/**
 * Saves note content via save_note IPC command.
 * Performs client-side filename pattern check before IPC call.
 * Rust backend performs authoritative validation and std::fs::write.
 *
 * Called by: module:editor (auto-save debounce callback)
 */
export async function saveNote(
  filename: string,
  content: string,
): Promise<void> {
  assertValidFilename(filename);
  const params: SaveNoteParams = { filename, content };
  return invoke<void>('save_note', params);
}

/**
 * Reads note content via read_note IPC command.
 * Returns full file content including frontmatter.
 *
 * Called by: module:editor (note load on grid→editor transition)
 */
export async function readNote(filename: string): Promise<ReadNoteResponse> {
  assertValidFilename(filename);
  const params: NoteFileParams = { filename };
  return invoke<ReadNoteResponse>('read_note', params);
}

/**
 * Deletes a note via delete_note IPC command.
 * Physical file deletion via std::fs::remove_file on Rust side.
 * No soft-delete or trash mechanism.
 *
 * Called by: module:editor, module:grid
 */
export async function deleteNote(filename: string): Promise<void> {
  assertValidFilename(filename);
  const params: NoteFileParams = { filename };
  return invoke<void>('delete_note', params);
}

/**
 * Lists notes with optional date/tag filters via list_notes IPC command.
 * Returns NoteEntry[] sorted by created_at descending (newest first).
 * Sort order is determined by Rust backend; no client-side re-sorting needed.
 *
 * Called by: module:grid (initial load, filter changes)
 *
 * Per CONV-GRID-1: Default 7-day filter dates are computed by frontend
 * and passed as from_date/to_date parameters.
 */
export async function listNotes(
  params?: ListNotesParams,
): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>('list_notes', params ?? {});
}

/**
 * Searches notes via search_notes IPC command with full-text file scan.
 * Rust backend performs case-insensitive substring matching
 * (str::to_lowercase().contains()) on all .md files.
 *
 * Filter parameters (from_date, to_date, tag) can be combined with query.
 * Returns NoteEntry[] sorted by created_at descending.
 *
 * Called by: module:grid (search box input after debounce)
 *
 * Per design: No index engine (tantivy etc.) is used.
 * File scan is sufficient for expected note count (hundreds to low thousands).
 */
export async function searchNotes(
  params: SearchNotesParams,
): Promise<NoteEntry[]> {
  if (!params.query || params.query.trim().length === 0) {
    throw new Error(
      'searchNotes requires a non-empty query. Use listNotes for listing without search.',
    );
  }
  return invoke<NoteEntry[]>('search_notes', {
    query: params.query,
    ...(params.from_date !== undefined && { from_date: params.from_date }),
    ...(params.to_date !== undefined && { to_date: params.to_date }),
    ...(params.tag !== undefined && { tag: params.tag }),
  });
}

/**
 * Client-side filename validation guard.
 * Matches the Rust-side regex: ^\d{4}-\d{2}-\d{2}T\d{6}(_\d+)?\.md$
 * Prevents path traversal attempts before they reach IPC boundary.
 *
 * @throws {Error} if filename does not match expected pattern
 */
function assertValidFilename(filename: string): void {
  if (!FILENAME_PATTERN.test(filename)) {
    throw new Error(
      `Invalid filename "${filename}". Expected pattern: YYYY-MM-DDTHHMMSS.md`,
    );
  }
}
