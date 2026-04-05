// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 38-1
// @task-title: `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:38 task:38-1 module:grid — Tauri IPC wrappers for grid-related commands
// All file operations are delegated to module:storage via Tauri IPC.
// Direct filesystem access from the frontend is prohibited (CONV-IPC).
// invoke is the sole IPC entry point; components must not call invoke directly.

import { invoke } from '@tauri-apps/api/core';
import type { NoteEntry, ListNotesParams, SearchNotesParams } from './types';

function buildParams(
  params: Record<string, string | undefined>,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      result[key] = value;
    }
  }
  return result;
}

export async function listNotes(params: ListNotesParams): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>(
    'list_notes',
    buildParams({
      from_date: params.from_date,
      to_date: params.to_date,
      tag: params.tag,
    }),
  );
}

export async function searchNotes(
  params: SearchNotesParams,
): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>(
    'search_notes',
    buildParams({
      query: params.query,
      from_date: params.from_date,
      to_date: params.to_date,
      tag: params.tag,
    }),
  );
}

export async function deleteNote(filename: string): Promise<void> {
  return invoke<void>('delete_note', { filename });
}
