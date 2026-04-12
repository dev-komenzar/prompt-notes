// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 4-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd-sprint: 4
// @codd-task: 4-1
// @codd-module: module:storage
// @codd-depends-on: detail:component_architecture, detail:storage_fileformat

import { invoke } from '@tauri-apps/api/core';
import type { AppConfig, Note, NoteFilter, NoteMetadata } from './types';

/**
 * Typed IPC wrapper layer for all Rust backend commands.
 *
 * CONVENTION: All Svelte components and stores must import from this module.
 * Direct use of `invoke` from `@tauri-apps/api/core` in UI code is prohibited.
 * This ensures IPC boundary changes are localized to this single file.
 *
 * All file I/O is performed exclusively by the Rust backend; the frontend
 * must never access the filesystem directly (Tauri capability `fs` is disabled).
 */

// ---------------------------------------------------------------------------
// Note CRUD — owned by storage module (src-tauri/src/storage.rs)
// ---------------------------------------------------------------------------

/**
 * Creates a new empty note file with filename YYYY-MM-DDTHHMMSS.md.
 * The filename is determined at call time and is immutable thereafter.
 * Latency target: ≤ 100 ms.
 */
export function createNote(): Promise<NoteMetadata> {
  return invoke<NoteMetadata>('create_note');
}

/**
 * Overwrites the note identified by `id` with new frontmatter and body.
 * Called automatically by the 500 ms debounce pipeline in EditorView.svelte.
 * No explicit save button or Cmd+S shortcut should trigger this.
 */
export function saveNote(
  id: string,
  frontmatter: { tags: string[] },
  body: string,
): Promise<void> {
  return invoke<void>('save_note', { id, frontmatter, body });
}

/**
 * Reads the full content of a note (frontmatter + body).
 * Called when a note is selected in NoteList or navigated to from GridView.
 */
export function readNote(id: string): Promise<Note> {
  return invoke<Note>('read_note', { id });
}

/**
 * Permanently deletes the note file from the filesystem.
 * No trash / undo support in v1.
 */
export function deleteNote(id: string): Promise<void> {
  return invoke<void>('delete_note', { id });
}

/**
 * Returns metadata for notes matching the optional filter.
 * Results are sorted by created_at descending (newest first).
 * Used when there is no full-text query (query is empty).
 */
export function listNotes(filter?: NoteFilter): Promise<NoteMetadata[]> {
  return invoke<NoteMetadata[]>('list_notes', { filter });
}

// ---------------------------------------------------------------------------
// Search — owned by search module (src-tauri/src/search.rs)
// ---------------------------------------------------------------------------

/**
 * Full-text search across all note files on the filesystem.
 * Case-insensitive substring match against body text and tags.
 * Combined with optional filter (tags + date range) via AND logic.
 * Used when the search query is non-empty.
 * Frontend applies a 300 ms debounce before calling this.
 */
export function searchNotes(
  query: string,
  filter?: NoteFilter,
): Promise<NoteMetadata[]> {
  return invoke<NoteMetadata[]>('search_notes', { query, filter });
}

// ---------------------------------------------------------------------------
// Config — owned by config module (src-tauri/src/config.rs)
// ---------------------------------------------------------------------------

/**
 * Returns the current application configuration.
 * Called on app startup and in SettingsView initial load.
 */
export function getConfig(): Promise<AppConfig> {
  return invoke<AppConfig>('get_config');
}

/**
 * Persists updated application configuration to config.json.
 * The only permitted way to change notes_dir; frontend must not
 * construct or manipulate path strings directly.
 */
export function setConfig(config: AppConfig): Promise<void> {
  return invoke<void>('set_config', { config });
}
