// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 2-1
// @task-title: `module:shell`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/component_architecture.md
// @codd-sprint: 2 | module:shell | Typed Tauri IPC wrappers
//
// CONVENTION: All file I/O must go through these wrappers.
// Direct @tauri-apps/api/core imports in components are prohibited.
// Direct @tauri-apps/plugin-fs imports are prohibited.

import { invoke } from '@tauri-apps/api/core';
import type { AppConfig, Note, NoteFilter, NoteMetadata } from './types';

export function createNote(): Promise<NoteMetadata> {
  return invoke<NoteMetadata>('create_note');
}

export function saveNote(
  id: string,
  frontmatter: { tags: string[] },
  body: string,
): Promise<void> {
  return invoke<void>('save_note', { id, frontmatter, body });
}

export function readNote(id: string): Promise<Note> {
  return invoke<Note>('read_note', { id });
}

export function deleteNote(id: string): Promise<void> {
  return invoke<void>('delete_note', { id });
}

export function listNotes(filter?: NoteFilter): Promise<NoteMetadata[]> {
  return invoke<NoteMetadata[]>('list_notes', { filter });
}

export function searchNotes(
  query: string,
  filter?: NoteFilter,
): Promise<NoteMetadata[]> {
  return invoke<NoteMetadata[]>('search_notes', { query, filter });
}

export function getConfig(): Promise<AppConfig> {
  return invoke<AppConfig>('get_config');
}

export function setConfig(config: AppConfig): Promise<void> {
  return invoke<void>('set_config', { config });
}
