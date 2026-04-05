// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 1-1
// @task-title: 対象モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD trace: plan:implementation_plan > sprint:1 > task:1-1
// Single entry point for all Tauri IPC invoke calls.
// Components must NOT call @tauri-apps/api invoke directly.
// All file operations route through module:storage (Rust backend) via these wrappers.

import { invoke } from '@tauri-apps/api/core';
import type {
  NoteEntry,
  Config,
  CreateNoteResult,
  ReadNoteResult,
  ListNotesParams,
  SearchNotesParams,
} from './types';

// ─── module:storage IPC commands ────────────────────────────

/**
 * Creates a new note file with a timestamp-based filename.
 *
 * Filename generation (YYYY-MM-DDTHHMMSS.md) is exclusively owned by
 * module:storage (Rust chrono crate). The frontend never generates filenames.
 *
 * @returns Created file's filename and absolute path
 */
export async function createNote(): Promise<CreateNoteResult> {
  return invoke<CreateNoteResult>('create_note');
}

/**
 * Overwrites the specified note file with the given content.
 *
 * Content must include the full file text (frontmatter + body).
 * Rust side performs filename validation (regex) and path-traversal prevention.
 * Called by module:editor auto-save (500ms debounce).
 *
 * @param filename - The note filename (received from createNote, never generated client-side)
 * @param content  - Full file content to persist
 */
export async function saveNote(filename: string, content: string): Promise<void> {
  return invoke<void>('save_note', { filename, content });
}

/**
 * Reads the full content of the specified note file.
 *
 * Called by module:editor when navigating from grid view.
 *
 * @param filename - The note filename to read
 * @returns File content (frontmatter + body)
 */
export async function readNote(filename: string): Promise<ReadNoteResult> {
  return invoke<ReadNoteResult>('read_note', { filename });
}

/**
 * Physically deletes the specified note file.
 *
 * No soft-delete or trash mechanism. Deletion is permanent.
 *
 * @param filename - The note filename to delete
 */
export async function deleteNote(filename: string): Promise<void> {
  return invoke<void>('delete_note', { filename });
}

/**
 * Lists notes filtered by date range and/or tag.
 *
 * Results are pre-sorted by created_at descending (newest first).
 * Sorting logic is owned by module:storage (Rust side); client must not re-sort.
 * Frontmatter parsing (serde_yaml) is performed on Rust side.
 *
 * @param params - Optional filter parameters
 * @returns Filtered and sorted array of NoteEntry
 */
export async function listNotes(params: ListNotesParams = {}): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>('list_notes', params);
}

/**
 * Full-text searches notes with optional date/tag filters.
 *
 * Search logic (case-insensitive str::contains on file content) is exclusively
 * owned by module:storage (Rust side). Client-side search is prohibited.
 *
 * @param params - Search query and optional filters
 * @returns Matching notes sorted by created_at descending
 */
export async function searchNotes(params: SearchNotesParams): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>('search_notes', params);
}

// ─── module:settings IPC commands ───────────────────────────

/**
 * Retrieves current application configuration from config.json.
 *
 * config.json is exclusively owned by module:settings (Rust backend).
 *
 * @returns Current configuration
 */
export async function getConfig(): Promise<Config> {
  return invoke<Config>('get_config');
}

/**
 * Updates the notes directory in application configuration.
 *
 * Rust backend performs:
 * - Directory existence check
 * - Write permission verification
 * - config.json persistence
 *
 * Frontend must not perform filesystem path operations directly.
 * Existing notes are NOT moved to the new directory.
 *
 * @param notesDir - Absolute path to the new notes directory
 */
export async function setConfig(notesDir: string): Promise<void> {
  return invoke<void>('set_config', { notes_dir: notesDir });
}
