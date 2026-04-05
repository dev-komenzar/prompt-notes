// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 9-1
// @task-title: 共有層
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Trace: sprint=9, task=9-1, module=shared, file=api.ts
// Design refs: detail:component_architecture §3.4, detail:editor_clipboard §4.6
// Single entry-point for all Tauri IPC invoke calls.
// Components must NOT call @tauri-apps/api invoke directly.

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
// module:storage IPC commands
// ---------------------------------------------------------------------------

/**
 * Create a new note. Rust backend generates YYYY-MM-DDTHHMMSS.md filename
 * via chrono and writes an empty frontmatter template.
 * Called by: module:editor (Cmd+N / Ctrl+N handler)
 */
export async function createNote(): Promise<CreateNoteResult> {
  return invoke<CreateNoteResult>('create_note');
}

/**
 * Overwrite-save full file content (frontmatter + body).
 * Rust validates filename against /^\d{4}-\d{2}-\d{2}T\d{6}(_\d+)?\.md$/
 * Called by: module:editor auto-save (debounced 500ms)
 */
export async function saveNote(
  filename: string,
  content: string,
): Promise<void> {
  const params: SaveNoteParams = { filename, content };
  return invoke<void>('save_note', params);
}

/**
 * Read full file content of a note.
 * Called by: module:editor on mount (note load from grid navigation)
 */
export async function readNote(filename: string): Promise<ReadNoteResult> {
  return invoke<ReadNoteResult>('read_note', { filename });
}

/**
 * Physically delete a note file.
 * Called by: module:editor / module:grid delete actions
 */
export async function deleteNote(filename: string): Promise<void> {
  return invoke<void>('delete_note', { filename });
}

/**
 * List notes with optional date-range and tag filters.
 * Returns NoteEntry[] sorted by created_at descending (Rust-side sort).
 * Called by: module:grid (default 7-day view, tag/date filter changes)
 */
export async function listNotes(
  params?: ListNotesParams,
): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>('list_notes', params ?? {});
}

/**
 * Full-text search across all note files (Rust str::contains, case-insensitive).
 * Supports combined filtering with date range and tag.
 * Called by: module:grid (search input, debounced 300ms)
 */
export async function searchNotes(
  params: SearchNotesParams,
): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>('search_notes', params);
}

// ---------------------------------------------------------------------------
// module:settings IPC commands
// ---------------------------------------------------------------------------

/**
 * Retrieve current application config (notes_dir).
 * Called by: module:settings UI on mount
 */
export async function getConfig(): Promise<Config> {
  return invoke<Config>('get_config');
}

/**
 * Persist a new notes directory path. Rust backend validates path existence
 * and write permissions before writing config.json.
 * Called by: module:settings UI on directory change confirmation
 */
export async function setConfig(params: SetConfigParams): Promise<void> {
  return invoke<void>('set_config', params);
}
