// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 20-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd:generated sprint=20 task=20-1 module=storage
// Single entry-point for all Tauri IPC calls related to module:storage and module:settings.
// Components MUST use these wrappers instead of calling invoke() directly.
// CONV-1: All file operations go through Rust backend via Tauri IPC.
// CONV-2: Config changes are persisted by Rust backend exclusively.

import { invoke } from '@tauri-apps/api/core';
import type {
  NoteEntry,
  CreateNoteResponse,
  ReadNoteResponse,
  SaveNoteArgs,
  NoteFilenameArgs,
  ListNotesArgs,
  SearchNotesArgs,
  Config,
  SetConfigArgs,
} from './types';

/**
 * Create a new note. Rust backend generates the YYYY-MM-DDTHHMMSS.md filename
 * and writes an initial frontmatter template to disk.
 *
 * Called by module:editor on Cmd+N / Ctrl+N.
 */
export async function createNote(): Promise<CreateNoteResponse> {
  return invoke<CreateNoteResponse>('create_note');
}

/**
 * Overwrite the content of an existing note file.
 * The filename is validated server-side against the YYYY-MM-DDTHHMMSS pattern.
 *
 * Called by module:editor auto-save (debounced).
 */
export async function saveNote(filename: string, content: string): Promise<void> {
  const args: SaveNoteArgs = { filename, content };
  return invoke<void>('save_note', args);
}

/**
 * Read the full content (frontmatter + body) of a note file.
 *
 * Called by module:editor when loading an existing note.
 */
export async function readNote(filename: string): Promise<ReadNoteResponse> {
  const args: NoteFilenameArgs = { filename };
  return invoke<ReadNoteResponse>('read_note', args);
}

/**
 * Permanently delete a note file from disk.
 * No soft-delete / trash mechanism exists.
 *
 * Called by module:editor or module:grid.
 */
export async function deleteNote(filename: string): Promise<void> {
  const args: NoteFilenameArgs = { filename };
  return invoke<void>('delete_note', args);
}

/**
 * List notes matching optional date-range and tag filters.
 * Results are sorted by created_at descending (newest first).
 * Sorting is performed by the Rust backend; no client-side re-sort needed.
 *
 * Called by module:grid for filtered views (default: last 7 days).
 */
export async function listNotes(filters?: ListNotesArgs): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>('list_notes', filters ?? {});
}

/**
 * Full-text search across all note files using str::contains (case-insensitive).
 * Supports optional date-range and tag filters in combination.
 * No index engine; Rust backend performs file-by-file scan.
 *
 * Called by module:grid when search query is non-empty.
 */
export async function searchNotes(args: SearchNotesArgs): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>('search_notes', args);
}

/**
 * Retrieve current application configuration (notes_dir).
 *
 * Called by module:settings UI on mount.
 */
export async function getConfig(): Promise<Config> {
  return invoke<Config>('get_config');
}

/**
 * Update application configuration.
 * Rust backend validates the path (existence + write permission) before persisting.
 * Frontend MUST NOT write config.json directly (CONV-2).
 *
 * Called by module:settings UI after directory selection.
 */
export async function setConfig(notesDir: string): Promise<void> {
  const args: SetConfigArgs = { notes_dir: notesDir };
  return invoke<void>('set_config', args);
}
