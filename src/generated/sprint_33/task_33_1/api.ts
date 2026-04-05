// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 33-1
// @task-title: 共有層
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=33, task=33-1, module=shared, node=detail:component_architecture
// Single entry point for all Tauri IPC invoke calls.
// Components MUST NOT call @tauri-apps/api invoke directly — use these wrappers.

import { invoke } from '@tauri-apps/api/core';
import type {
  NoteEntry,
  CreateNoteResult,
  ReadNoteResult,
  Config,
  ListNotesParams,
  SearchNotesParams,
  SaveNoteParams,
  SetConfigParams,
} from './types';

// ---------------------------------------------------------------------------
// module:storage — Note CRUD
// ---------------------------------------------------------------------------

/**
 * Create a new note file with an auto-generated YYYY-MM-DDTHHMMSS.md filename
 * and an empty frontmatter template.
 *
 * IPC command: create_note
 * Caller: module:editor (Cmd+N / Ctrl+N)
 */
export async function createNote(): Promise<CreateNoteResult> {
  return invoke<CreateNoteResult>('create_note');
}

/**
 * Overwrite the content of an existing note file.
 * The filename is validated server-side against the YYYY-MM-DDTHHMMSS pattern;
 * path traversal attempts are rejected.
 *
 * IPC command: save_note
 * Caller: module:editor (auto-save after 500 ms debounce)
 */
export async function saveNote(
  filename: string,
  content: string,
): Promise<void> {
  const params: SaveNoteParams = { filename, content };
  return invoke<void>('save_note', params);
}

/**
 * Read the full content (frontmatter + body) of a note file.
 *
 * IPC command: read_note
 * Caller: module:editor (on mount / note switch)
 */
export async function readNote(filename: string): Promise<ReadNoteResult> {
  return invoke<ReadNoteResult>('read_note', { filename });
}

/**
 * Permanently delete a note file from disk.
 *
 * IPC command: delete_note
 * Caller: module:editor, module:grid
 */
export async function deleteNote(filename: string): Promise<void> {
  return invoke<void>('delete_note', { filename });
}

// ---------------------------------------------------------------------------
// module:storage — List / Search
// ---------------------------------------------------------------------------

/**
 * List notes filtered by date range and/or tag.
 * Results are sorted by created_at descending (newest first).
 *
 * IPC command: list_notes
 * Caller: module:grid (initial load, filter changes)
 */
export async function listNotes(
  params: ListNotesParams = {},
): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>('list_notes', {
    from_date: params.from_date ?? null,
    to_date: params.to_date ?? null,
    tag: params.tag ?? null,
  });
}

/**
 * Full-text search across all note files (case-insensitive substring match).
 * Optionally combined with date range and tag filters.
 * Results are sorted by created_at descending (newest first).
 *
 * IPC command: search_notes
 * Caller: module:grid (search box input)
 */
export async function searchNotes(
  params: SearchNotesParams,
): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>('search_notes', {
    query: params.query,
    from_date: params.from_date ?? null,
    to_date: params.to_date ?? null,
    tag: params.tag ?? null,
  });
}

// ---------------------------------------------------------------------------
// module:settings — Configuration
// ---------------------------------------------------------------------------

/**
 * Retrieve the current application configuration (notes_dir, etc.).
 *
 * IPC command: get_config
 * Caller: module:settings UI
 */
export async function getConfig(): Promise<Config> {
  return invoke<Config>('get_config');
}

/**
 * Persist a new configuration.  The notes_dir path is validated server-side
 * (existence check + write-permission check).
 *
 * IPC command: set_config
 * Caller: module:settings UI
 */
export async function setConfig(params: SetConfigParams): Promise<void> {
  return invoke<void>('set_config', { notes_dir: params.notes_dir });
}
