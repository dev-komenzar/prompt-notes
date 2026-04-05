// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 12-1
// @task-title: 対象モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=12 task=12-1 module=api
// Single entry point for all Tauri IPC invoke calls.
// All frontend modules MUST use these wrappers — direct invoke() calls outside
// this file are prohibited (CONV-1: IPC boundary enforcement).

import { invoke } from '@tauri-apps/api/core';
import type {
  NoteEntry,
  Config,
  CreateNoteResult,
  ReadNoteResult,
  ListNotesArgs,
  SearchNotesArgs,
  SaveNoteArgs,
  FileTargetArgs,
  SetConfigArgs,
} from './types';

// ---------------------------------------------------------------------------
// module:storage IPC commands
// ---------------------------------------------------------------------------

/**
 * Create a new note file with timestamp-based filename.
 * Rust backend generates YYYY-MM-DDTHHMMSS.md using chrono.
 * Called by: module:editor (Cmd+N / Ctrl+N)
 */
export async function createNote(): Promise<CreateNoteResult> {
  return invoke<CreateNoteResult>('create_note');
}

/**
 * Overwrite-save a note file. Content includes frontmatter + body.
 * Rust backend validates filename against YYYY-MM-DDTHHMMSS pattern
 * and rejects path traversal attempts.
 * Called by: module:editor (auto-save debounce)
 */
export async function saveNote(filename: string, content: string): Promise<void> {
  const args: SaveNoteArgs = { filename, content };
  return invoke<void>('save_note', args);
}

/**
 * Read the full content of a note file.
 * Called by: module:editor (note load on navigation from grid)
 */
export async function readNote(filename: string): Promise<ReadNoteResult> {
  const args: FileTargetArgs = { filename };
  return invoke<ReadNoteResult>('read_note', args);
}

/**
 * Permanently delete a note file from the filesystem.
 * Called by: module:editor, module:grid
 */
export async function deleteNote(filename: string): Promise<void> {
  const args: FileTargetArgs = { filename };
  return invoke<void>('delete_note', args);
}

/**
 * List notes filtered by date range and/or tag.
 * Results are sorted by created_at descending (newest first).
 * Sorting is performed on Rust side — no client-side re-sort needed.
 * Called by: module:grid (initial load, filter changes)
 */
export async function listNotes(args?: ListNotesArgs): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>('list_notes', args ?? {});
}

/**
 * Full-text search across all note files (case-insensitive substring match).
 * Rust backend performs file-by-file scan using str::contains.
 * Filter parameters (date, tag) are applied in conjunction with the query.
 * Called by: module:grid (search box)
 */
export async function searchNotes(args: SearchNotesArgs): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>('search_notes', args);
}

// ---------------------------------------------------------------------------
// module:settings IPC commands
// ---------------------------------------------------------------------------

/**
 * Retrieve current application configuration.
 * Called by: module:settings UI
 */
export async function getConfig(): Promise<Config> {
  return invoke<Config>('get_config');
}

/**
 * Update application configuration (notes directory).
 * Rust backend validates path existence and write permissions before persisting.
 * Frontend MUST NOT write config.json directly (CONV-2).
 * Called by: module:settings UI
 */
export async function setConfig(notesDir: string): Promise<void> {
  const args: SetConfigArgs = { notes_dir: notesDir };
  return invoke<void>('set_config', args);
}
