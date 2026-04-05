// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 46-1
// @task-title: 共有層
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=46 task=46-1 node=detail:component_architecture,detail:grid_search,detail:editor_clipboard
// Single entry-point for all Tauri IPC invoke calls.
// Components MUST use these wrappers — direct @tauri-apps/api invoke calls outside this file are prohibited.

import { invoke } from '@tauri-apps/api/core';
import type {
  NoteEntry,
  Config,
  CreateNoteResult,
  SaveNoteArgs,
  ReadNoteArgs,
  ReadNoteResult,
  DeleteNoteArgs,
  ListNotesArgs,
  SearchNotesArgs,
  SetConfigArgs,
} from './types';

// ── module:editor IPC wrappers ──────────────────────────────────────────

/**
 * Create a new note. Rust backend generates the YYYY-MM-DDTHHMMSS.md filename
 * using chrono::Local::now(). Frontend never generates filenames.
 */
export async function createNote(): Promise<CreateNoteResult> {
  return invoke<CreateNoteResult>('create_note');
}

/**
 * Overwrite-save the full content (frontmatter + body) of an existing note.
 * Called by the auto-save debounce timer in module:editor.
 * Rust side validates filename against ^\d{4}-\d{2}-\d{2}T\d{6}(_\d+)?\.md$
 */
export async function saveNote(filename: string, content: string): Promise<void> {
  const args: SaveNoteArgs = { filename, content };
  return invoke<void>('save_note', args);
}

/**
 * Read full content of a note file. Used when navigating from grid to editor.
 */
export async function readNote(filename: string): Promise<ReadNoteResult> {
  const args: ReadNoteArgs = { filename };
  return invoke<ReadNoteResult>('read_note', args);
}

/**
 * Permanently delete a note file. No soft-delete / trash.
 */
export async function deleteNote(filename: string): Promise<void> {
  const args: DeleteNoteArgs = { filename };
  return invoke<void>('delete_note', args);
}

// ── module:grid IPC wrappers ────────────────────────────────────────────

/**
 * List notes filtered by date range and/or tag.
 * Returns NoteEntry[] sorted by created_at descending (newest first).
 * Sorting is performed on the Rust side — no client-side re-sort needed.
 *
 * Default 7-day filter: caller (GridView.svelte) computes from_date/to_date
 * and passes them here. Rust side has no concept of a default range.
 *
 * Date format for from_date / to_date: "YYYY-MM-DD"
 */
export async function listNotes(filters?: ListNotesArgs): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>('list_notes', filters ?? {});
}

/**
 * Full-text search across all note files using Rust str::contains (case-insensitive).
 * Supports combining with date/tag filters.
 * Returns NoteEntry[] sorted by created_at descending.
 *
 * When query is empty, callers should use listNotes() instead.
 */
export async function searchNotes(args: SearchNotesArgs): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>('search_notes', args);
}

// ── module:settings IPC wrappers ────────────────────────────────────────

/**
 * Retrieve current application configuration (notes_dir etc.).
 */
export async function getConfig(): Promise<Config> {
  return invoke<Config>('get_config');
}

/**
 * Update the notes storage directory. Rust backend validates the path
 * (existence check, write permission) before persisting to config.json.
 * Frontend MUST NOT write paths to the filesystem directly.
 */
export async function setConfig(notesDir: string): Promise<void> {
  const args: SetConfigArgs = { notes_dir: notesDir };
  return invoke<void>('set_config', args);
}
