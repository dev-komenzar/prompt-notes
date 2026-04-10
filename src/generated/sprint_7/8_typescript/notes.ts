// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 7-1
// @task-title: 8 コマンドの TypeScript ラッパー関数が型付きで定義される
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/component_architecture.md
// @generated-by: codd generate --sprint 7

import { invoke } from '@tauri-apps/api/core';
import type {
  CreateNoteResult,
  ReadNoteResult,
  SuccessResult,
  NotesListResult,
  ListNotesParams,
  SearchNotesParams,
  Frontmatter,
} from './types';

/**
 * Create a new note. Filename is generated server-side from current timestamp
 * in YYYY-MM-DDTHHMMSS.md format. Frontend never generates filenames.
 */
export async function createNote(): Promise<CreateNoteResult> {
  return invoke<CreateNoteResult>('create_note');
}

/**
 * Save (overwrite) a note's content. Called by the autosave debounce logic.
 * All file path resolution is handled by the Rust backend.
 *
 * @param filename - Note filename (e.g. "2026-04-10T091530.md")
 * @param frontmatter - Frontmatter containing tags only
 * @param body - Note body text (without frontmatter)
 */
export async function saveNote(
  filename: string,
  frontmatter: Frontmatter,
  body: string,
): Promise<SuccessResult> {
  return invoke<SuccessResult>('save_note', { filename, frontmatter, body });
}

/**
 * Read a note's content by filename.
 *
 * @param filename - Note filename (e.g. "2026-04-10T091530.md")
 */
export async function readNote(filename: string): Promise<ReadNoteResult> {
  return invoke<ReadNoteResult>('read_note', { filename });
}

/**
 * List notes matching filter criteria. Returns metadata sorted by created_at descending.
 * Default behaviour (no params) returns notes from the last 7 days.
 *
 * @param params - Optional filter parameters (days, tags, date range)
 */
export async function listNotes(params?: ListNotesParams): Promise<NotesListResult> {
  return invoke<NotesListResult>('list_notes', {
    days: params?.days,
    tags: params?.tags,
    date_from: params?.date_from,
    date_to: params?.date_to,
  });
}

/**
 * Full-text search across all notes via file scanning on the Rust backend.
 * Search is case-insensitive substring match on body text (excluding frontmatter).
 *
 * @param params - Search query and optional filter parameters
 */
export async function searchNotes(params: SearchNotesParams): Promise<NotesListResult> {
  return invoke<NotesListResult>('search_notes', {
    query: params.query,
    tags: params.tags,
    date_from: params.date_from,
    date_to: params.date_to,
  });
}

/**
 * Delete a note by filename. This is a permanent physical deletion with no trash.
 *
 * @param filename - Note filename (e.g. "2026-04-10T091530.md")
 */
export async function deleteNote(filename: string): Promise<SuccessResult> {
  return invoke<SuccessResult>('delete_note', { filename });
}
