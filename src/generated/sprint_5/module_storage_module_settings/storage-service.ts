// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 5-1
// @task-title: `module:storage`, `module:settings`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=5, task=5-1, modules=[storage]
// Frontend service layer for module:storage.
// Encapsulates IPC call patterns for module:editor and module:grid consumers.
// All filesystem operations are exclusively performed by Rust backend.

import { createNote, saveNote, readNote, deleteNote, listNotes, searchNotes } from './api';
import type {
  NoteEntry,
  CreateNoteResponse,
  ReadNoteResponse,
  ListNotesParams,
  SearchNotesParams,
} from './types';
import { getDefaultDateRange } from './date-utils';

/**
 * Creates a new note and returns the filename and path.
 * Filename (YYYY-MM-DDTHHMMSS.md) is generated exclusively by Rust backend.
 * Frontend must never generate filenames.
 *
 * Called by: module:editor Cmd+N / Ctrl+N handler.
 */
export async function createNewNote(): Promise<CreateNoteResponse> {
  return createNote();
}

/**
 * Persists the full note content (frontmatter + body) to disk.
 * Called by auto-save debounce callback in module:editor.
 * Rust backend validates filename and performs atomic overwrite.
 */
export async function persistNoteContent(
  filename: string,
  content: string,
): Promise<void> {
  return saveNote({ filename, content });
}

/**
 * Loads a note's full content from disk.
 * Called by module:editor when transitioning from grid view.
 */
export async function loadNoteContent(
  filename: string,
): Promise<ReadNoteResponse> {
  return readNote({ filename });
}

/**
 * Permanently deletes a note file from disk.
 * No undo mechanism. Called by module:editor or module:grid delete actions.
 */
export async function removeNote(filename: string): Promise<void> {
  return deleteNote({ filename });
}

/**
 * Fetches notes for the default grid view (last 7 days).
 * Date range is computed client-side and passed to Rust backend for filtering.
 * Sorting (created_at descending) is performed by Rust backend.
 */
export async function fetchDefaultNotes(): Promise<NoteEntry[]> {
  const { from_date, to_date } = getDefaultDateRange();
  return listNotes({ from_date, to_date });
}

/**
 * Fetches notes with custom filter parameters.
 * All filtering logic is performed by Rust backend.
 * Client-side filtering of the result set is prohibited.
 */
export async function fetchFilteredNotes(
  params: ListNotesParams,
): Promise<NoteEntry[]> {
  return listNotes(params);
}

/**
 * Performs a full-text search across all notes via file system scan.
 * Search logic (case-insensitive str::contains) is performed by Rust backend.
 * Client-side search is prohibited.
 *
 * When query is empty, callers should use fetchFilteredNotes instead.
 */
export async function searchNotesByQuery(
  params: SearchNotesParams,
): Promise<NoteEntry[]> {
  if (!params.query || params.query.trim().length === 0) {
    return fetchFilteredNotes({
      from_date: params.from_date,
      to_date: params.to_date,
      tag: params.tag,
    });
  }
  return searchNotes({
    ...params,
    query: params.query.trim(),
  });
}

/**
 * Collects unique tags from a set of NoteEntry results.
 * Used by TagFilter.svelte to dynamically populate the tag selection UI.
 * No IPC call needed — tags are extracted from already-fetched NoteEntry data.
 */
export function collectUniqueTags(notes: readonly NoteEntry[]): string[] {
  const tagSet = new Set<string>();
  for (const note of notes) {
    for (const tag of note.tags) {
      if (tag.trim().length > 0) {
        tagSet.add(tag.trim());
      }
    }
  }
  return Array.from(tagSet).sort();
}
