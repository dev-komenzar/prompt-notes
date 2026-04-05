// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 35-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// module:editor — Tauri IPC wrappers (single entry-point for invoke calls).
// All file-system operations are delegated to module:storage via these commands.
// Direct invoke usage outside this file is prohibited per component_architecture CONV-1.

import { invoke } from '@tauri-apps/api/core';
import type {
  CreateNoteResult,
  ReadNoteResult,
  SaveNoteParams,
  ReadNoteParams,
  DeleteNoteParams,
  ListNotesParams,
  SearchNotesParams,
  NoteEntry,
  Config,
} from './types';

export async function createNote(): Promise<CreateNoteResult> {
  return invoke<CreateNoteResult>('create_note');
}

export async function saveNote(params: SaveNoteParams): Promise<void> {
  await invoke<void>('save_note', params as unknown as Record<string, unknown>);
}

export async function readNote(params: ReadNoteParams): Promise<ReadNoteResult> {
  return invoke<ReadNoteResult>('read_note', params as unknown as Record<string, unknown>);
}

export async function deleteNote(params: DeleteNoteParams): Promise<void> {
  await invoke<void>('delete_note', params as unknown as Record<string, unknown>);
}

export async function listNotes(params: ListNotesParams): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>('list_notes', params as unknown as Record<string, unknown>);
}

export async function searchNotes(params: SearchNotesParams): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>('search_notes', params as unknown as Record<string, unknown>);
}

export async function getConfig(): Promise<Config> {
  return invoke<Config>('get_config');
}

export async function setConfig(params: { notes_dir: string }): Promise<void> {
  await invoke<void>('set_config', params as unknown as Record<string, unknown>);
}
