// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 30-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:30 | module:editor | CoDD trace: detail:component_architecture
// Single entry point for all Tauri IPC invoke calls.
// Components MUST NOT call @tauri-apps/api invoke directly.
// All file operations route through module:storage (Rust backend) via IPC.

import { invoke } from '@tauri-apps/api/core';
import type {
  CreateNoteResponse,
  ReadNoteResponse,
  NoteEntry,
  Config,
  ListNotesParams,
  SearchNotesParams,
} from './types';

export async function createNote(): Promise<CreateNoteResponse> {
  return invoke<CreateNoteResponse>('create_note');
}

export async function saveNote(filename: string, content: string): Promise<void> {
  return invoke<void>('save_note', { filename, content });
}

export async function readNote(filename: string): Promise<ReadNoteResponse> {
  return invoke<ReadNoteResponse>('read_note', { filename });
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

export async function setConfig(notes_dir: string): Promise<void> {
  return invoke<void>('set_config', { notes_dir });
}
