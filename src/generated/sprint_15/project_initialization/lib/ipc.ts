// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 15-1
// @task-title: フロントエンド基盤
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/plan/implementation_plan.md sprint:15 task:15-1
// @generated-by: codd implement --sprint 15
//
// All file I/O goes through these typed wrappers — never call invoke() directly
// from components. This enforces the IPC boundary (module:shell / framework:tauri).

import { invoke } from '@tauri-apps/api/core';
import type { NoteMetadata, Note, NoteFilter, AppConfig } from './types';

/**
 * Create a new empty note. Returns metadata with the generated id
 * (YYYY-MM-DDTHHMMSS). Must complete in < 100ms per AC-EDIT-03.
 */
export const createNote = (): Promise<NoteMetadata> =>
  invoke<NoteMetadata>('create_note');

/**
 * Persist note content. Called by the 500ms debounce autosave pipeline.
 * Never expose a manual save button or Cmd+S — autosave is the only path (CONV-3).
 */
export const saveNote = (
  id: string,
  frontmatter: { tags: string[] },
  body: string,
): Promise<void> => invoke<void>('save_note', { id, frontmatter, body });

/**
 * Load full note content for editing.
 */
export const readNote = (id: string): Promise<Note> =>
  invoke<Note>('read_note', { id });

/**
 * Permanently delete a note file from the filesystem.
 */
export const deleteNote = (id: string): Promise<void> =>
  invoke<void>('delete_note', { id });

/**
 * List note metadata with optional filter. Used when search query is empty.
 */
export const listNotes = (filter?: NoteFilter): Promise<NoteMetadata[]> =>
  invoke<NoteMetadata[]>('list_notes', { filter });

/**
 * Full-text search across all note files on the Rust side (no frontend search).
 * Used when search query is non-empty. Debounce 300ms before calling.
 */
export const searchNotes = (
  query: string,
  filter?: NoteFilter,
): Promise<NoteMetadata[]> =>
  invoke<NoteMetadata[]>('search_notes', { query, filter });

/**
 * Read current app configuration from Rust backend.
 * Never read config from localStorage — config.json is the single source.
 */
export const getConfig = (): Promise<AppConfig> =>
  invoke<AppConfig>('get_config');

/**
 * Persist updated app configuration via Rust backend.
 * Only SettingsView may call this function.
 */
export const setConfig = (config: AppConfig): Promise<void> =>
  invoke<void>('set_config', { config });
