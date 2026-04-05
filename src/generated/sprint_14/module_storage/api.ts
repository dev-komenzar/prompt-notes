// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 14-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:14 task:14-1 module:storage
// Single entry point for all Tauri IPC calls to module:storage and module:settings.
// CONVENTION: No other file in the frontend may call invoke() directly.
// All file operations are routed through Rust backend via these wrappers.

import { invoke } from '@tauri-apps/api/core';
import type {
  NoteEntry,
  CreateNoteResponse,
  ReadNoteResponse,
  ListNotesArgs,
  SearchNotesArgs,
  Config,
} from './types';
import { assertValidFilename } from './validators';

/**
 * Creates a new note. Rust backend generates the YYYY-MM-DDTHHMMSS.md filename
 * using chrono::Local::now(). Frontend must NOT generate filenames.
 *
 * @returns The generated filename and full path.
 */
export async function createNote(): Promise<CreateNoteResponse> {
  return invoke<CreateNoteResponse>('create_note');
}

/**
 * Saves (overwrites) the note content. Called by auto-save after debounce.
 * Content includes frontmatter + body as a single string.
 * Rust side performs path traversal validation on filename.
 *
 * @param filename - Must match YYYY-MM-DDTHHMMSS.md pattern.
 * @param content  - Full file content (frontmatter + body).
 */
export async function saveNote(filename: string, content: string): Promise<void> {
  assertValidFilename(filename);
  return invoke<void>('save_note', { filename, content });
}

/**
 * Reads the full content of a note file.
 *
 * @param filename - Must match YYYY-MM-DDTHHMMSS.md pattern.
 * @returns The file content as a string.
 */
export async function readNote(filename: string): Promise<ReadNoteResponse> {
  assertValidFilename(filename);
  return invoke<ReadNoteResponse>('read_note', { filename });
}

/**
 * Permanently deletes a note file. No soft-delete / trash mechanism.
 *
 * @param filename - Must match YYYY-MM-DDTHHMMSS.md pattern.
 */
export async function deleteNote(filename: string): Promise<void> {
  assertValidFilename(filename);
  return invoke<void>('delete_note', { filename });
}

/**
 * Lists notes filtered by date range and/or tag.
 * Results are sorted by created_at descending (newest first) by Rust backend.
 * Frontend should NOT re-sort.
 *
 * @param args - Optional filters. Omit all for unfiltered list.
 */
export async function listNotes(args: ListNotesArgs = {}): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>('list_notes', {
    from_date: args.from_date ?? null,
    to_date: args.to_date ?? null,
    tag: args.tag ?? null,
  });
}

/**
 * Full-text search across all notes via Rust-side file scan (str::contains).
 * No client-side search is permitted — all search logic resides in Rust.
 *
 * @param args - query is required; filters are optional.
 */
export async function searchNotes(args: SearchNotesArgs): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>('search_notes', {
    query: args.query,
    from_date: args.from_date ?? null,
    to_date: args.to_date ?? null,
    tag: args.tag ?? null,
  });
}

/**
 * Retrieves the current application configuration.
 */
export async function getConfig(): Promise<Config> {
  return invoke<Config>('get_config');
}

/**
 * Updates the notes directory. Rust backend validates path existence and
 * write permissions before persisting to config.json.
 * Frontend must NOT write to config.json or manipulate file paths directly.
 *
 * @param notesDir - Absolute path to the new notes directory.
 */
export async function setConfig(notesDir: string): Promise<void> {
  return invoke<void>('set_config', { notes_dir: notesDir });
}
