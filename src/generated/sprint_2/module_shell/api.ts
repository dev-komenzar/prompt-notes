// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 2-1
// @task-title: `module:shell`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint:2 task:2-1 module:shell node:detail:component_architecture
// Single entry-point for all Tauri IPC communication.
// CONSTRAINT: No other file in the frontend may import `invoke` from @tauri-apps/api.
// All Svelte components call functions exported from this module exclusively.

import { invoke } from '@tauri-apps/api/core';

import type {
  NoteEntry,
  CreateNoteResponse,
  ReadNoteResponse,
  Config,
  ListNotesParams,
  SearchNotesParams,
  SaveNoteParams,
  FilenameParams,
  SetConfigParams,
} from './types';

import {
  CMD_CREATE_NOTE,
  CMD_SAVE_NOTE,
  CMD_READ_NOTE,
  CMD_DELETE_NOTE,
  CMD_LIST_NOTES,
  CMD_SEARCH_NOTES,
  CMD_GET_CONFIG,
  CMD_SET_CONFIG,
} from './ipc-commands';

// ---------------------------------------------------------------------------
// module:storage — Note CRUD
// ---------------------------------------------------------------------------

/**
 * Create a new note. Filename (YYYY-MM-DDTHHMMSS.md) is generated
 * exclusively by the Rust backend via `chrono`. Frontend never fabricates
 * filenames.
 */
export async function createNote(): Promise<CreateNoteResponse> {
  return invoke<CreateNoteResponse>(CMD_CREATE_NOTE);
}

/**
 * Persist note content (frontmatter + body) via overwrite.
 * Called by the auto-save debounce timer in module:editor.
 */
export async function saveNote(
  filename: string,
  content: string,
): Promise<void> {
  const params: SaveNoteParams = { filename, content };
  return invoke<void>(CMD_SAVE_NOTE, params);
}

/**
 * Read full file content for a given note.
 */
export async function readNote(filename: string): Promise<ReadNoteResponse> {
  const params: FilenameParams = { filename };
  return invoke<ReadNoteResponse>(CMD_READ_NOTE, params);
}

/**
 * Physically delete a note file.
 */
export async function deleteNote(filename: string): Promise<void> {
  const params: FilenameParams = { filename };
  return invoke<void>(CMD_DELETE_NOTE, params);
}

// ---------------------------------------------------------------------------
// module:storage — Listing & Search
// ---------------------------------------------------------------------------

/**
 * List notes filtered by date range and/or tag.
 * Returns NoteEntry[] sorted by created_at descending (newest first).
 * Sorting is performed on the Rust side — no client-side re-sort needed.
 */
export async function listNotes(
  params: ListNotesParams = {},
): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>(CMD_LIST_NOTES, params);
}

/**
 * Full-text search across all note files via Rust str::contains
 * (case-insensitive). Filter params are applied conjunctively.
 */
export async function searchNotes(
  params: SearchNotesParams,
): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>(CMD_SEARCH_NOTES, params);
}

// ---------------------------------------------------------------------------
// module:settings — Config
// ---------------------------------------------------------------------------

/**
 * Retrieve current application configuration.
 */
export async function getConfig(): Promise<Config> {
  return invoke<Config>(CMD_GET_CONFIG);
}

/**
 * Persist a new notes directory. Path validation and permission checks
 * are performed on the Rust side. Frontend must not write config.json
 * directly (CONV-2).
 */
export async function setConfig(notesDir: string): Promise<void> {
  const params: SetConfigParams = { notes_dir: notesDir };
  return invoke<void>(CMD_SET_CONFIG, params);
}
