// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 44-1
// @task-title: `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// trace: sprint_44 / task 44-1 / module:grid
// design-ref: detail:component_architecture §3.3, §3.4
// CONV-IPC: All file operations go through Rust backend via Tauri IPC.
//           @tauri-apps/api invoke is called ONLY inside this module.
//           Components must NOT call invoke directly.

import type {
  NoteEntry,
  ListNotesParams,
  SearchNotesParams,
  DeleteNoteParams,
} from './types';

// Tauri v2 core invoke – the single authorised IPC entry-point.
// In Tauri v1 the import path is '@tauri-apps/api/tauri'.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { invoke } from '@tauri-apps/api/core';

/**
 * Retrieve notes filtered by date range and/or tag.
 *
 * Called when the search query is empty.
 * Rust side returns NoteEntry[] sorted by created_at descending.
 */
export async function listNotes(params: ListNotesParams): Promise<NoteEntry[]> {
  const ipcArgs: Record<string, string | undefined> = {
    from_date: params.from_date,
    to_date: params.to_date,
    tag: params.tag,
  };
  // Remove undefined keys so Rust sees Option::None
  const cleaned = Object.fromEntries(
    Object.entries(ipcArgs).filter(([, v]) => v !== undefined),
  );
  return invoke<NoteEntry[]>('list_notes', cleaned);
}

/**
 * Full-text search across all notes.
 *
 * Called when the search query is non-empty.
 * Filter parameters (from_date, to_date, tag) are also forwarded so
 * search and filters can be combined (detail:grid_search §2.3).
 */
export async function searchNotes(params: SearchNotesParams): Promise<NoteEntry[]> {
  const ipcArgs: Record<string, string | undefined> = {
    query: params.query,
    from_date: params.from_date,
    to_date: params.to_date,
    tag: params.tag,
  };
  const cleaned = Object.fromEntries(
    Object.entries(ipcArgs).filter(([, v]) => v !== undefined),
  );
  return invoke<NoteEntry[]>('search_notes', cleaned);
}

/**
 * Delete a note by filename.
 *
 * Filename validation (path-traversal prevention) is enforced on the
 * Rust side (module:storage). Frontend does not validate filenames
 * beyond forwarding what it received from list_notes / search_notes.
 */
export async function deleteNote(params: DeleteNoteParams): Promise<void> {
  return invoke<void>('delete_note', { filename: params.filename });
}
