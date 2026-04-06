// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 54-1
// @task-title: `module:storage`, `module:shell`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Trace: sprint=54, task=54-1, modules=storage+shell, node=detail:component_architecture,detail:storage_fileformat
// SINGLE ENTRY POINT for all Tauri IPC invoke() calls.
// Convention 3 (CONV-1): All file operations go through Rust backend via IPC.
// Convention 4 (CONV-2): Settings changes go through Rust backend.
// Direct @tauri-apps/api invoke() calls MUST NOT appear outside this file.
// Components call these typed wrapper functions exclusively.

import { invoke } from '@tauri-apps/api/core';
import { StorageCommands, SettingsCommands } from './ipc-commands';
import { assertValidFilename } from './security';
import { assertValidDirectoryPath, assertValidDateFilter, sanitizeSearchQuery } from './security';
import { IpcError, StorageError } from './errors';
import type {
  CreateNoteResult,
  SaveNoteArgs,
  ReadNoteArgs,
  ReadNoteResult,
  DeleteNoteArgs,
  ListNotesArgs,
  SearchNotesArgs,
  SetConfigArgs,
  NoteEntry,
  Config,
} from './types';

// ── module:storage commands ─────────────────────────────────────────

/**
 * Creates a new note file with timestamp-based filename.
 * Filename generation is exclusively owned by Rust backend (chrono crate).
 * Frontend MUST NOT generate filenames.
 *
 * Convention 9: YYYY-MM-DDTHHMMSS.md format, immutable after creation.
 */
export async function createNote(): Promise<CreateNoteResult> {
  try {
    return await invoke<CreateNoteResult>(StorageCommands.CREATE_NOTE);
  } catch (err) {
    throw new StorageError(
      StorageCommands.CREATE_NOTE,
      'Failed to create new note',
      err
    );
  }
}

/**
 * Saves note content to an existing file (auto-save target).
 * Client-side filename validation is defense-in-depth; Rust backend is authoritative.
 *
 * Convention 11: Auto-save mandatory. Called via debounce timer, not by user action.
 */
export async function saveNote(filename: string, content: string): Promise<void> {
  assertValidFilename(filename);

  const args: SaveNoteArgs = { filename, content };
  try {
    await invoke<void>(StorageCommands.SAVE_NOTE, args as unknown as Record<string, unknown>);
  } catch (err) {
    throw new StorageError(
      StorageCommands.SAVE_NOTE,
      `Failed to save note: ${filename}`,
      err
    );
  }
}

/**
 * Reads the full content of a note file.
 * Called by module:editor when loading a note (e.g. after grid card click).
 */
export async function readNote(filename: string): Promise<ReadNoteResult> {
  assertValidFilename(filename);

  const args: ReadNoteArgs = { filename };
  try {
    return await invoke<ReadNoteResult>(StorageCommands.READ_NOTE, args as unknown as Record<string, unknown>);
  } catch (err) {
    throw new StorageError(
      StorageCommands.READ_NOTE,
      `Failed to read note: ${filename}`,
      err
    );
  }
}

/**
 * Deletes a note file permanently. No soft-delete or trash mechanism.
 */
export async function deleteNote(filename: string): Promise<void> {
  assertValidFilename(filename);

  const args: DeleteNoteArgs = { filename };
  try {
    await invoke<void>(StorageCommands.DELETE_NOTE, args as unknown as Record<string, unknown>);
  } catch (err) {
    throw new StorageError(
      StorageCommands.DELETE_NOTE,
      `Failed to delete note: ${filename}`,
      err
    );
  }
}

/**
 * Lists notes filtered by date range and/or tag.
 * Returns NoteEntry[] sorted by created_at descending (newest first).
 * Sorting is owned by Rust backend — no client-side re-sort needed.
 *
 * Convention: Default 7-day window is computed by the calling component,
 * not by this function or the Rust backend.
 */
export async function listNotes(filters?: ListNotesArgs): Promise<NoteEntry[]> {
  const args: ListNotesArgs = {
    from_date: filters?.from_date,
    to_date: filters?.to_date,
    tag: filters?.tag,
  };

  // Validate date filters if provided
  if (args.from_date) assertValidDateFilter(args.from_date);
  if (args.to_date) assertValidDateFilter(args.to_date);

  try {
    return await invoke<NoteEntry[]>(StorageCommands.LIST_NOTES, args as unknown as Record<string, unknown>);
  } catch (err) {
    throw new StorageError(
      StorageCommands.LIST_NOTES,
      'Failed to list notes',
      err
    );
  }
}

/**
 * Full-text search across all notes (Rust-side file scan, str::contains).
 * No index engine — suitable for < 5000 notes.
 * Filters (date, tag) can be combined with the search query.
 *
 * Convention 17: Search is local file scan only. No DB, no cloud.
 */
export async function searchNotes(params: SearchNotesArgs): Promise<NoteEntry[]> {
  const sanitizedQuery = sanitizeSearchQuery(params.query);
  if (sanitizedQuery.length === 0) {
    // Empty query: fall back to list_notes behavior
    return listNotes({
      from_date: params.from_date,
      to_date: params.to_date,
      tag: params.tag,
    });
  }

  const args: SearchNotesArgs = {
    query: sanitizedQuery,
    from_date: params.from_date,
    to_date: params.to_date,
    tag: params.tag,
  };

  if (args.from_date) assertValidDateFilter(args.from_date);
  if (args.to_date) assertValidDateFilter(args.to_date);

  try {
    return await invoke<NoteEntry[]>(StorageCommands.SEARCH_NOTES, args as unknown as Record<string, unknown>);
  } catch (err) {
    throw new StorageError(
      StorageCommands.SEARCH_NOTES,
      `Failed to search notes for query: "${sanitizedQuery}"`,
      err
    );
  }
}

// ── module:settings commands ────────────────────────────────────────

/**
 * Retrieves the current application configuration.
 * Convention 4: Config is read via Rust backend only.
 */
export async function getConfig(): Promise<Config> {
  try {
    return await invoke<Config>(SettingsCommands.GET_CONFIG);
  } catch (err) {
    throw new IpcError(
      SettingsCommands.GET_CONFIG,
      'Failed to read configuration',
      err
    );
  }
}

/**
 * Updates the notes storage directory.
 * Path validation (existence, write permissions) is performed by Rust backend.
 * Client-side validation is defense-in-depth only.
 *
 * Convention 4 (CONV-2): Frontend MUST NOT write to filesystem directly.
 * Convention 12: Default dirs are platform-specific; custom dir allowed via this command.
 */
export async function setConfig(notesDir: string): Promise<void> {
  assertValidDirectoryPath(notesDir);

  const args: SetConfigArgs = { notes_dir: notesDir };
  try {
    await invoke<void>(SettingsCommands.SET_CONFIG, args as unknown as Record<string, unknown>);
  } catch (err) {
    throw new IpcError(
      SettingsCommands.SET_CONFIG,
      `Failed to update configuration (notes_dir: ${notesDir})`,
      err
    );
  }
}
