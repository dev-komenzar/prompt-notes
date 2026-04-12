// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 34-1
// @task-title: 担当モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

import { invoke } from '@tauri-apps/api/core';
import type { NoteMetadata, Note, NoteFilter, AppConfig } from './types';

export const createNote = (): Promise<NoteMetadata> =>
  invoke<NoteMetadata>('create_note');

export const saveNote = (
  id: string,
  frontmatter: { tags: string[] },
  body: string
): Promise<void> => invoke<void>('save_note', { id, frontmatter, body });

export const readNote = (id: string): Promise<Note> =>
  invoke<Note>('read_note', { id });

export const deleteNote = (id: string): Promise<void> =>
  invoke<void>('delete_note', { id });

export const listNotes = (filter?: NoteFilter): Promise<NoteMetadata[]> =>
  invoke<NoteMetadata[]>('list_notes', { filter });

export const searchNotes = (
  query: string,
  filter?: NoteFilter
): Promise<NoteMetadata[]> =>
  invoke<NoteMetadata[]>('search_notes', { query, filter });

export const getConfig = (): Promise<AppConfig> =>
  invoke<AppConfig>('get_config');

export const setConfig = (config: AppConfig): Promise<void> =>
  invoke<void>('set_config', { config });
