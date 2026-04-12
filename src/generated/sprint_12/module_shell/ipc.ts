// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 12-1
// @task-title: `module:shell`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @traceability: sprint:12, task:12-1, module:shell
// @depends-on: docs/detailed_design/component_architecture.md §4.4
// @convention: All frontend IPC calls MUST go through this module.
//              Direct import of @tauri-apps/api/core is prohibited in components.

import { invoke } from '@tauri-apps/api/core';
import type { Note, NoteFilter, NoteMetadata, AppConfig } from './types';

// ---------------------------------------------------------------------------
// Storage commands
// ---------------------------------------------------------------------------

/**
 * Creates a new empty note file (YYYY-MM-DDTHHMMSS.md) on the Rust backend
 * and returns its metadata. Latency target: < 100 ms.
 */
export function createNote(): Promise<NoteMetadata> {
  return invoke<NoteMetadata>('create_note');
}

/**
 * Overwrites the content of an existing note. Called by the auto-save
 * debounce pipeline (500 ms) in EditorView; never called from a save button.
 */
export function saveNote(
  id: string,
  frontmatter: { tags: string[] },
  body: string,
): Promise<void> {
  return invoke<void>('save_note', { id, frontmatter, body });
}

/**
 * Reads the full content (frontmatter + body) of a note by its id.
 */
export function readNote(id: string): Promise<Note> {
  return invoke<Note>('read_note', { id });
}

/**
 * Permanently deletes the note file from the filesystem.
 */
export function deleteNote(id: string): Promise<void> {
  return invoke<void>('delete_note', { id });
}

/**
 * Lists note metadata matching optional filter criteria.
 * Uses metadata-only scanning (no full-text search).
 */
export function listNotes(filter?: NoteFilter): Promise<NoteMetadata[]> {
  return invoke<NoteMetadata[]>('list_notes', { filter: filter ?? null });
}

// ---------------------------------------------------------------------------
// Search command
// ---------------------------------------------------------------------------

/**
 * Performs a case-insensitive full-text scan of all note files, optionally
 * combined with tag / date range filters. Debounce (300 ms) must be applied
 * by the caller before invoking this command.
 */
export function searchNotes(
  query: string,
  filter?: NoteFilter,
): Promise<NoteMetadata[]> {
  return invoke<NoteMetadata[]>('search_notes', {
    query,
    filter: filter ?? null,
  });
}

// ---------------------------------------------------------------------------
// Config commands
// ---------------------------------------------------------------------------

/**
 * Reads the current application configuration from config.json via the
 * Rust backend. Called on app startup and by SettingsView on mount.
 */
export function getConfig(): Promise<AppConfig> {
  return invoke<AppConfig>('get_config');
}

/**
 * Persists the application configuration to config.json via the Rust backend.
 * The frontend must not write config values to localStorage or IndexedDB.
 */
export function setConfig(config: AppConfig): Promise<void> {
  return invoke<void>('set_config', { config });
}
