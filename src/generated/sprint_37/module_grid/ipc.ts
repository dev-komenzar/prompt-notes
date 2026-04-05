// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 37-1
// @task-title: `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:37 task:37-1 module:grid — Tauri IPC wrappers
// All data fetching goes through this module. Direct invoke() calls
// from Svelte components are prohibited (CONV-IPC).
// This module is the grid's equivalent of the shared lib/api.ts.

import { invoke } from '@tauri-apps/api/core';
import type { NoteEntry, ListNotesParams, SearchNotesParams } from './types';

/**
 * Fetches notes matching the given filter criteria.
 * Delegates to module:storage Rust backend via IPC.
 *
 * @param params - Date range and optional tag filter
 * @returns NoteEntry[] sorted by created_at descending (Rust-side sorting)
 */
export async function listNotes(params: ListNotesParams): Promise<NoteEntry[]> {
  const ipcArgs: Record<string, string | undefined> = {};
  if (params.from_date !== undefined) ipcArgs.from_date = params.from_date;
  if (params.to_date !== undefined) ipcArgs.to_date = params.to_date;
  if (params.tag !== undefined) ipcArgs.tag = params.tag;

  return invoke<NoteEntry[]>('list_notes', ipcArgs);
}

/**
 * Performs full-text search across all notes.
 * Rust side executes file-scan search with str::contains (case-insensitive).
 * No client-side filtering is performed.
 *
 * @param params - Search query plus optional date/tag filters
 * @returns NoteEntry[] of matching notes, sorted by created_at descending
 */
export async function searchNotes(params: SearchNotesParams): Promise<NoteEntry[]> {
  const ipcArgs: Record<string, string | undefined> = {
    query: params.query,
  };
  if (params.from_date !== undefined) ipcArgs.from_date = params.from_date;
  if (params.to_date !== undefined) ipcArgs.to_date = params.to_date;
  if (params.tag !== undefined) ipcArgs.tag = params.tag;

  return invoke<NoteEntry[]>('search_notes', ipcArgs);
}

/**
 * Deletes a note by filename.
 * Physical deletion on Rust side via std::fs::remove_file.
 *
 * @param filename - Must match YYYY-MM-DDTHHMMSS.md pattern (validated Rust-side)
 */
export async function deleteNote(filename: string): Promise<void> {
  return invoke<void>('delete_note', { filename });
}
