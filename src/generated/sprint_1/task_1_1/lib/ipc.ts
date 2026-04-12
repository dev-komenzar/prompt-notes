// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 1-1
// @task-title: 担当モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// Typed IPC wrapper layer for all Tauri invoke calls.
// All frontend code MUST import from this module only.
// Direct imports of @tauri-apps/api/core are prohibited in components.

import { invoke } from '@tauri-apps/api/core';
import type { Note, NoteMetadata, NoteFilter, AppConfig } from './types';

/**
 * Create a new note. Returns metadata for the newly created note.
 * Rust creates YYYY-MM-DDTHHMMSS.md with empty frontmatter and body.
 */
export const createNote = (): Promise<NoteMetadata> =>
  invoke<NoteMetadata>('create_note');

/**
 * Save note content. Called automatically by the debounce pipeline (500ms).
 * The id identifies the target file; frontmatter and body are written atomically.
 */
export const saveNote = (
  id: string,
  frontmatter: Frontmatter,
  body: string,
): Promise<void> =>
  invoke<void>('save_note', { id, frontmatter, body });

/**
 * Read a note's full content including frontmatter and body.
 */
export const readNote = (id: string): Promise<Note> =>
  invoke<Note>('read_note', { id });

/**
 * Delete a note file permanently. No undo (trash is out of scope).
 */
export const deleteNote = (id: string): Promise<void> =>
  invoke<void>('delete_note', { id });

/**
 * List notes matching an optional filter. Returns metadata sorted by
 * created_at descending. Used when search query is empty.
 */
export const listNotes = (filter?: NoteFilter): Promise<NoteMetadata[]> =>
  invoke<NoteMetadata[]>('list_notes', { filter: filter ?? null });

/**
 * Full-text search across all note files on the Rust side (file scan).
 * Combines query with optional metadata filter (AND condition).
 * Used when search query is non-empty.
 */
export const searchNotes = (
  query: string,
  filter?: NoteFilter,
): Promise<NoteMetadata[]> =>
  invoke<NoteMetadata[]>('search_notes', { query, filter: filter ?? null });

/**
 * Retrieve current application configuration.
 */
export const getConfig = (): Promise<AppConfig> =>
  invoke<AppConfig>('get_config');

/**
 * Persist updated application configuration (e.g. notes_dir change).
 * Must always go through this IPC call; localStorage/IndexedDB is forbidden.
 */
export const setConfig = (config: AppConfig): Promise<void> =>
  invoke<void>('set_config', { config });

// Re-export Frontmatter so callers can use it without importing from types.ts separately.
import type { Frontmatter } from './types';
export type { Frontmatter };
