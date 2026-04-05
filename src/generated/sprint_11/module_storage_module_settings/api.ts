// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 11-1
// @task-title: `module:storage`, `module:settings`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=11, task=11-1, modules=[storage,settings]
// Single entry-point for ALL Tauri IPC invoke calls.
// Components MUST NOT call @tauri-apps/api invoke directly; use these wrappers.
// Rust backend is the exclusive owner of file I/O and config persistence.

import { invoke } from '@tauri-apps/api/core';
import type {
  NoteEntry,
  Config,
  CreateNoteResponse,
  SaveNoteParams,
  ReadNoteParams,
  ReadNoteResponse,
  DeleteNoteParams,
  ListNotesParams,
  SearchNotesParams,
  SetConfigParams,
} from './types';

// ---------------------------------------------------------------------------
// module:storage IPC wrappers
// ---------------------------------------------------------------------------

/**
 * Create a new note. Rust generates the YYYY-MM-DDTHHMMSS.md filename
 * using chrono::Local::now(). Frontend MUST NOT generate filenames.
 */
export async function createNote(): Promise<CreateNoteResponse> {
  return invoke<CreateNoteResponse>('create_note');
}

/**
 * Overwrite-save a note's full content (frontmatter + body).
 * Called by the editor's debounced auto-save; no manual save UI exists.
 * Rust validates `filename` against the canonical regex before writing.
 */
export async function saveNote(
  filename: string,
  content: string,
): Promise<void> {
  const params: SaveNoteParams = { filename, content };
  return invoke<void>('save_note', params);
}

/**
 * Read the full content of a note file.
 * Rust validates `filename` to prevent path traversal.
 */
export async function readNote(filename: string): Promise<ReadNoteResponse> {
  const params: ReadNoteParams = { filename };
  return invoke<ReadNoteResponse>('read_note', params);
}

/**
 * Physically delete a note file. No soft-delete / trash.
 * Rust validates `filename` to prevent path traversal.
 */
export async function deleteNote(filename: string): Promise<void> {
  const params: DeleteNoteParams = { filename };
  return invoke<void>('delete_note', params);
}

/**
 * List notes filtered by date range and/or tag.
 * Results are sorted by created_at descending (newest first) on the Rust side.
 * Frontend does NOT re-sort.
 *
 * For the default 7-day view the caller computes from_date/to_date
 * and passes them here; Rust has no concept of a default range.
 */
export async function listNotes(
  params?: ListNotesParams,
): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>('list_notes', params ?? {});
}

/**
 * Full-text search via Rust file-scan (str::to_lowercase().contains()).
 * No client-side search is permitted.
 * Filters (from_date, to_date, tag) are applied in conjunction with query.
 */
export async function searchNotes(
  params: SearchNotesParams,
): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>('search_notes', params);
}

// ---------------------------------------------------------------------------
// module:settings IPC wrappers
// ---------------------------------------------------------------------------

/**
 * Retrieve current application configuration (notes_dir).
 */
export async function getConfig(): Promise<Config> {
  return invoke<Config>('get_config');
}

/**
 * Persist a new notes directory.
 * Rust validates path existence and write permissions before writing config.json.
 * Frontend MUST NOT write to the filesystem or config.json directly.
 * Existing notes are NOT moved automatically.
 */
export async function setConfig(notesDir: string): Promise<void> {
  const params: SetConfigParams = { notes_dir: notesDir };
  return invoke<void>('set_config', params);
}
