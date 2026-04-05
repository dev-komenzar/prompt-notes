// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 40-1
// @task-title: `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint:40 task:40-1 module:grid detail:component_architecture
// Single entry point for all Tauri IPC calls. Direct invoke() usage outside this file is prohibited.

import { invoke } from '@tauri-apps/api/core';
import type { NoteEntry, ListNotesParams, SearchNotesParams } from './types';

export async function listNotes(params: ListNotesParams): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>('list_notes', params);
}

export async function searchNotes(params: SearchNotesParams): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>('search_notes', params);
}

export async function deleteNote(filename: string): Promise<void> {
  return invoke<void>('delete_note', { filename });
}

export async function createNote(): Promise<{ filename: string; path: string }> {
  return invoke<{ filename: string; path: string }>('create_note');
}

export async function saveNote(filename: string, content: string): Promise<void> {
  return invoke<void>('save_note', { filename, content });
}

export async function readNote(filename: string): Promise<{ content: string }> {
  return invoke<{ content: string }>('read_note', { filename });
}
