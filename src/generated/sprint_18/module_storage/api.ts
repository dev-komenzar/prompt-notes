// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 18-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:18 task:18-1 module:storage
// Single entry point for all module:storage IPC calls.
// All Svelte components MUST use these functions instead of calling invoke() directly.
// Constraint: CONV-1 — all file operations go through Rust backend via Tauri IPC.
// Constraint: CONV-2 — no frontend-only file path manipulation.

import { invoke } from '@tauri-apps/api/core';

import type {
  NoteEntry,
  Config,
  ListNotesParams,
  SearchNotesParams,
  CreateNoteResponse,
  ReadNoteResponse,
  SaveNoteParams,
  ReadNoteParams,
  DeleteNoteParams,
  SetConfigParams,
} from './types';
import { isValidNoteFilename } from './filename';
import { StorageError, StorageErrorCode, toStorageError } from './errors';

// ---------------------------------------------------------------------------
// module:storage IPC commands
// ---------------------------------------------------------------------------

/**
 * Creates a new note file with a timestamp-based filename.
 * Filename generation is Rust-side only (chrono crate). Frontend never generates filenames.
 *
 * IPC command: create_note
 * Called by: module:editor (Cmd+N / Ctrl+N)
 */
export async function createNote(): Promise<CreateNoteResponse> {
  try {
    return await invoke<CreateNoteResponse>('create_note');
  } catch (err) {
    throw toStorageError(err);
  }
}

/**
 * Overwrites a note file with the given content (frontmatter + body).
 * Rust backend validates filename pattern and performs atomic write.
 *
 * IPC command: save_note
 * Called by: module:editor (auto-save debounce 500ms)
 */
export async function saveNote(params: SaveNoteParams): Promise<void> {
  // Client-side pre-validation (defence-in-depth; Rust is authoritative)
  if (!isValidNoteFilename(params.filename)) {
    throw new StorageError(
      StorageErrorCode.INVALID_FILENAME,
      `Invalid filename: ${params.filename}`,
    );
  }

  try {
    await invoke<void>('save_note', {
      filename: params.filename,
      content: params.content,
    });
  } catch (err) {
    throw toStorageError(err);
  }
}

/**
 * Reads the full content of a note file.
 *
 * IPC command: read_note
 * Called by: module:editor (note load from grid navigation)
 */
export async function readNote(params: ReadNoteParams): Promise<ReadNoteResponse> {
  if (!isValidNoteFilename(params.filename)) {
    throw new StorageError(
      StorageErrorCode.INVALID_FILENAME,
      `Invalid filename: ${params.filename}`,
    );
  }

  try {
    return await invoke<ReadNoteResponse>('read_note', {
      filename: params.filename,
    });
  } catch (err) {
    throw toStorageError(err);
  }
}

/**
 * Permanently deletes a note file from disk.
 * No trash/soft-delete mechanism exists.
 *
 * IPC command: delete_note
 * Called by: module:editor, module:grid
 */
export async function deleteNote(params: DeleteNoteParams): Promise<void> {
  if (!isValidNoteFilename(params.filename)) {
    throw new StorageError(
      StorageErrorCode.INVALID_FILENAME,
      `Invalid filename: ${params.filename}`,
    );
  }

  try {
    await invoke<void>('delete_note', {
      filename: params.filename,
    });
  } catch (err) {
    throw toStorageError(err);
  }
}

/**
 * Lists notes filtered by date range and/or tag.
 * Returns NoteEntry[] sorted by created_at descending (newest first).
 * Sorting is performed Rust-side; no client-side re-sort needed.
 *
 * CONV-GRID-1: Default 7-day range is computed by the caller (module:grid)
 * and passed as from_date/to_date. Rust backend has no default logic.
 *
 * IPC command: list_notes
 * Called by: module:grid (initial load, tag filter, date filter)
 */
export async function listNotes(
  params: ListNotesParams = {},
): Promise<NoteEntry[]> {
  try {
    // Build the IPC payload, omitting undefined optional fields
    const payload: Record<string, string> = {};
    if (params.from_date !== undefined) {
      payload.from_date = params.from_date;
    }
    if (params.to_date !== undefined) {
      payload.to_date = params.to_date;
    }
    if (params.tag !== undefined && params.tag !== '') {
      payload.tag = params.tag;
    }

    return await invoke<NoteEntry[]>('list_notes', payload);
  } catch (err) {
    throw toStorageError(err);
  }
}

/**
 * Full-text searches notes via file-scan (no index engine).
 * Rust backend performs case-insensitive substring match via str::contains.
 * Filter parameters (date, tag) are applied in conjunction with the query.
 *
 * When query is empty, callers should use listNotes() instead.
 *
 * IPC command: search_notes
 * Called by: module:grid (search box)
 */
export async function searchNotes(
  params: SearchNotesParams,
): Promise<NoteEntry[]> {
  if (!params.query || params.query.trim() === '') {
    // Rust-side search_notes requires a non-empty query.
    // Fall back to listNotes for empty queries.
    return listNotes({
      from_date: params.from_date,
      to_date: params.to_date,
      tag: params.tag,
    });
  }

  try {
    const payload: Record<string, string> = {
      query: params.query,
    };
    if (params.from_date !== undefined) {
      payload.from_date = params.from_date;
    }
    if (params.to_date !== undefined) {
      payload.to_date = params.to_date;
    }
    if (params.tag !== undefined && params.tag !== '') {
      payload.tag = params.tag;
    }

    return await invoke<NoteEntry[]>('search_notes', payload);
  } catch (err) {
    throw toStorageError(err);
  }
}

// ---------------------------------------------------------------------------
// module:settings IPC commands (co-located for single api entry point)
// ---------------------------------------------------------------------------

/**
 * Retrieves current application configuration.
 *
 * IPC command: get_config
 * Called by: module:settings UI
 */
export async function getConfig(): Promise<Config> {
  try {
    return await invoke<Config>('get_config');
  } catch (err) {
    throw toStorageError(err);
  }
}

/**
 * Updates the notes directory path.
 * Rust backend validates path existence and write permissions before persisting.
 * CONV-2: Frontend never writes config.json directly.
 *
 * IPC command: set_config
 * Called by: module:settings UI
 */
export async function setConfig(params: SetConfigParams): Promise<void> {
  try {
    await invoke<void>('set_config', {
      notes_dir: params.notes_dir,
    });
  } catch (err) {
    throw toStorageError(err);
  }
}
