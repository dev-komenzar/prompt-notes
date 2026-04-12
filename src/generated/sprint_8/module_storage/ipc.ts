// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 8-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/component_architecture.md
// @sprint: 8 / task: 8-1 / module: storage
// Typed IPC wrappers — all file I/O goes through Rust backend via invoke().
// Components must import from this module, never call invoke() directly.

import { invoke } from '@tauri-apps/api/core';
import type { AppConfig, Note, NoteFilter, NoteMetadata } from './types';

// ── Note CRUD ────────────────────────────────────────────────────────────────

/**
 * Creates a new empty note on disk.
 * Rust generates the filename (YYYY-MM-DDTHHMMSS.md) and handles collisions.
 * Returns the metadata of the newly created note.
 */
export function createNote(): Promise<NoteMetadata> {
  return invoke<NoteMetadata>('create_note');
}

/**
 * Overwrites an existing note file with new frontmatter and body.
 * Called by the auto-save pipeline (debounced 500 ms).
 */
export function saveNote(
  id: string,
  frontmatter: { tags: string[] },
  body: string,
): Promise<void> {
  return invoke<void>('save_note', { id, frontmatter, body });
}

/**
 * Reads the full content (frontmatter + body) of a note by its ID.
 */
export function readNote(id: string): Promise<Note> {
  return invoke<Note>('read_note', { id });
}

/**
 * Permanently deletes a note file from disk.
 */
export function deleteNote(id: string): Promise<void> {
  return invoke<void>('delete_note', { id });
}

/**
 * Lists notes matching an optional filter.
 * Results are sorted by created_at descending (newest first).
 */
export function listNotes(filter?: NoteFilter): Promise<NoteMetadata[]> {
  return invoke<NoteMetadata[]>('list_notes', { filter });
}

// ── Search ───────────────────────────────────────────────────────────────────

/**
 * Full-text search across all note files (Rust-side file scan).
 * Combines body search with optional tag/date filter (AND semantics).
 */
export function searchNotes(
  query: string,
  filter?: NoteFilter,
): Promise<NoteMetadata[]> {
  return invoke<NoteMetadata[]>('search_notes', { query, filter });
}

// ── Config ───────────────────────────────────────────────────────────────────

/**
 * Reads the current application config (notes_dir).
 */
export function getConfig(): Promise<AppConfig> {
  return invoke<AppConfig>('get_config');
}

/**
 * Persists updated application config via Rust backend.
 * Frontend must NOT manipulate file paths directly.
 */
export function setConfig(config: AppConfig): Promise<void> {
  return invoke<void>('set_config', { config });
}
