// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 24-1
// @task-title: 対象モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// PromptNotes — Tauri IPC Wrapper
// Single entry point for all invoke() calls. Components must not call invoke() directly.
// All file operations route through module:storage (Rust backend) via Tauri IPC.
// Direct filesystem access from frontend is prohibited (CONV-1).

import { invoke } from '@tauri-apps/api/core';
import type {
  NoteEntry,
  Config,
  CreateNoteResponse,
  ReadNoteResponse,
  SaveNoteParams,
  ReadNoteParams,
  DeleteNoteParams,
  ListNotesParams,
  SearchNotesParams,
  SetConfigParams,
} from './types';

/**
 * Create a new note. Rust backend generates YYYY-MM-DDTHHMMSS.md filename
 * and writes initial frontmatter template.
 * Frontend must not generate filenames.
 */
export async function createNote(): Promise<CreateNoteResponse> {
  return invoke<CreateNoteResponse>('create_note');
}

/**
 * Persist note content (frontmatter + body) to the file identified by filename.
 * Rust backend validates filename pattern and performs atomic overwrite.
 * Called by auto-save debounce timer; no manual save operation exists.
 */
export async function saveNote(params: SaveNoteParams): Promise<void> {
  return invoke<void>('save_note', {
    filename: params.filename,
    content: params.content,
  });
}

/**
 * Read full file content (frontmatter + body) for the given filename.
 * Rust backend validates filename pattern before filesystem access.
 */
export async function readNote(params: ReadNoteParams): Promise<ReadNoteResponse> {
  return invoke<ReadNoteResponse>('read_note', {
    filename: params.filename,
  });
}

/**
 * Permanently delete a note file. No trash/soft-delete mechanism.
 * Rust backend validates filename pattern before deletion.
 */
export async function deleteNote(params: DeleteNoteParams): Promise<void> {
  return invoke<void>('delete_note', {
    filename: params.filename,
  });
}

/**
 * List notes filtered by date range and/or tag.
 * Results are sorted by created_at descending (newest first).
 * Sorting is performed on Rust side; no client-side re-sort needed.
 */
export async function listNotes(params: ListNotesParams = {}): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>('list_notes', {
    from_date: params.from_date,
    to_date: params.to_date,
    tag: params.tag,
  });
}

/**
 * Full-text search across all notes via file system scan.
 * Rust backend performs case-insensitive substring match (str::contains).
 * No index engine; practical for up to ~5000 notes.
 * Supports combining with date/tag filters.
 */
export async function searchNotes(params: SearchNotesParams): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>('search_notes', {
    query: params.query,
    from_date: params.from_date,
    to_date: params.to_date,
    tag: params.tag,
  });
}

/**
 * Retrieve current application configuration.
 * notes_dir is the only configuration field.
 */
export async function getConfig(): Promise<Config> {
  return invoke<Config>('get_config');
}

/**
 * Update notes directory. Rust backend validates path existence and
 * write permissions before persisting to config.json.
 * Frontend must not write to config.json directly (CONV-2).
 * Existing notes are not moved; only new notes use the updated directory.
 */
export async function setConfig(params: SetConfigParams): Promise<void> {
  return invoke<void>('set_config', {
    notes_dir: params.notes_dir,
  });
}
