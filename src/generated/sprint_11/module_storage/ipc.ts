// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 11-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd:sprint=11 module:storage — typed Tauri IPC wrappers
// All file operations are routed through Rust backend via invoke().
// Direct filesystem access from the frontend is structurally prohibited.

import { invoke } from '@tauri-apps/api/core';
import type { AppConfig, Note, NoteFilter, NoteMetadata } from './types';

export async function createNote(): Promise<NoteMetadata> {
  return invoke<NoteMetadata>('create_note');
}

export async function saveNote(
  id: string,
  frontmatter: { tags: string[] },
  body: string,
): Promise<void> {
  return invoke<void>('save_note', { id, frontmatter, body });
}

export async function readNote(id: string): Promise<Note> {
  return invoke<Note>('read_note', { id });
}

export async function deleteNote(id: string): Promise<void> {
  return invoke<void>('delete_note', { id });
}

export async function listNotes(filter?: NoteFilter): Promise<NoteMetadata[]> {
  return invoke<NoteMetadata[]>('list_notes', { filter: filter ?? null });
}

export async function searchNotes(
  query: string,
  filter?: NoteFilter,
): Promise<NoteMetadata[]> {
  return invoke<NoteMetadata[]>('search_notes', { query, filter: filter ?? null });
}

export async function getConfig(): Promise<AppConfig> {
  return invoke<AppConfig>('get_config');
}

export async function setConfig(config: AppConfig): Promise<void> {
  return invoke<void>('set_config', { config });
}
