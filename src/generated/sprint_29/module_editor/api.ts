// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 29-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated sprint:29 task:29-1 module:editor
// CoDD trace: detail:component_architecture §3.3, detail:editor_clipboard §4.6
// All file operations go through Tauri IPC. Direct filesystem access from
// frontend is prohibited (CONV-1).

import { invoke } from '@tauri-apps/api/core';
import type {
  NoteEntry,
  Config,
  CreateNoteResult,
  ReadNoteResult,
  ListNotesParams,
  SearchNotesParams,
} from './types';

export async function createNote(): Promise<CreateNoteResult> {
  return invoke<CreateNoteResult>('create_note');
}

export async function saveNote(filename: string, content: string): Promise<void> {
  return invoke<void>('save_note', { filename, content });
}

export async function readNote(filename: string): Promise<ReadNoteResult> {
  return invoke<ReadNoteResult>('read_note', { filename });
}

export async function deleteNote(filename: string): Promise<void> {
  return invoke<void>('delete_note', { filename });
}

export async function listNotes(params: ListNotesParams): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>('list_notes', params);
}

export async function searchNotes(params: SearchNotesParams): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>('search_notes', params);
}

export async function getConfig(): Promise<Config> {
  return invoke<Config>('get_config');
}

export async function setConfig(params: { notes_dir: string }): Promise<void> {
  return invoke<void>('set_config', params);
}
