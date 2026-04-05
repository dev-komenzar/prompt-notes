// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 13-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:13 task:13-1 module:storage
// Single entry point for all Tauri IPC invoke calls.
// Components MUST call these wrappers; direct invoke() usage in components is prohibited.
// All file operations route through Rust backend (module:storage / module:settings).
// No direct filesystem access from the frontend is permitted.

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
 * Creates a new note file with a YYYY-MM-DDTHHMMSS.md filename.
 * Filename generation is exclusively owned by the Rust backend (chrono crate).
 */
export async function createNote(): Promise<CreateNoteResponse> {
  return invoke<CreateNoteResponse>('create_note');
}

/**
 * Overwrites the content of an existing note file.
 * Rust backend validates the filename pattern and prevents path traversal.
 */
export async function saveNote(filename: string, content: string): Promise<void> {
  return invoke<void>('save_note', { filename, content });
}

/**
 * Reads the full content (frontmatter + body) of a note file.
 */
export async function readNote(filename: string): Promise<ReadNoteResponse> {
  return invoke<ReadNoteResponse>('read_note', { filename });
}

/**
 * Permanently deletes a note file from the filesystem.
 * No soft-delete or trash mechanism exists.
 */
export async function deleteNote(filename: string): Promise<void> {
  return invoke<void>('delete_note', { filename });
}

/**
 * Lists notes filtered by date range and/or tag.
 * Results are sorted by created_at descending (newest first) by the Rust backend.
 * Svelte-side re-sorting is unnecessary.
 */
export async function listNotes(params: ListNotesParams = {}): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>('list_notes', params);
}

/**
 * Full-text search across all note files (Rust-side str::contains, case-insensitive).
 * Supports combined filtering with date range and tag parameters.
 */
export async function searchNotes(params: SearchNotesParams): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>('search_notes', params);
}

/**
 * Retrieves the current application configuration.
 */
export async function getConfig(): Promise<Config> {
  return invoke<Config>('get_config');
}

/**
 * Updates the notes directory. Rust backend validates the path exists and is writable
 * before persisting to config.json. Existing notes are NOT moved automatically.
 */
export async function setConfig(notes_dir: string): Promise<void> {
  return invoke<void>('set_config', { notes_dir });
}
