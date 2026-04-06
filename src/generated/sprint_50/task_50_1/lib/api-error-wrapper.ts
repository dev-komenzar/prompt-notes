// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 50-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Trace: sprint=50, task=50-1, module=all, resolves=OQ-006
// Type-safe IPC wrapper functions for all PromptNotes IPC commands.
// This module replaces the raw invoke() calls in lib/api.ts with
// error-handling-aware wrappers that return IpcResult<T>.
//
// Convention: All frontend modules import from this file (or the original api.ts
// which delegates here) rather than calling invoke() directly.
// @tauri-apps/api invoke is ONLY called via ipc-safe-invoke.ts.

import type { IpcResult } from '../types/errors';
import { safeInvoke, invokeWithNotify } from './ipc-safe-invoke';

// ──────────────────────────────────────────────
// Shared types (mirrors Rust canonical definitions)
// ──────────────────────────────────────────────

export interface NoteEntry {
  readonly filename: string;
  readonly created_at: string;
  readonly tags: string[];
  readonly body_preview: string;
}

export interface CreateNoteResponse {
  readonly filename: string;
  readonly path: string;
}

export interface ReadNoteResponse {
  readonly content: string;
}

export interface Config {
  readonly notes_dir: string;
}

// ──────────────────────────────────────────────
// module:editor IPC wrappers
// ──────────────────────────────────────────────

/**
 * Creates a new note. Rust backend generates the YYYY-MM-DDTHHMMSS.md filename.
 * Called on Cmd+N / Ctrl+N.
 */
export async function createNote(): Promise<IpcResult<CreateNoteResponse>> {
  return safeInvoke<CreateNoteResponse>('create_note', {}, 'editor', 'create_note');
}

/**
 * Saves note content (auto-save). Overwrites the full file content
 * including frontmatter. Used by the debounced auto-save in module:editor.
 *
 * NOTE: Auto-save errors are handled by the editor's dedicated auto-save
 * error handler (autosave-error-handler.ts), not the generic toast flow.
 * Callers should use safeInvoke result to drive retry logic.
 */
export async function saveNote(
  filename: string,
  content: string,
): Promise<IpcResult<void>> {
  return safeInvoke<void>(
    'save_note',
    { filename, content },
    'editor',
    'save_note',
  );
}

/**
 * Reads a note's content. Called when navigating from grid to editor.
 */
export async function readNote(
  filename: string,
): Promise<IpcResult<ReadNoteResponse>> {
  return safeInvoke<ReadNoteResponse>(
    'read_note',
    { filename },
    'editor',
    'read_note',
  );
}

/**
 * Deletes a note file.
 */
export async function deleteNote(
  filename: string,
): Promise<IpcResult<void>> {
  return safeInvoke<void>(
    'delete_note',
    { filename },
    'editor',
    'delete_note',
  );
}

// ──────────────────────────────────────────────
// module:grid IPC wrappers
// ──────────────────────────────────────────────

export interface ListNotesParams {
  from_date?: string;
  to_date?: string;
  tag?: string;
}

export interface SearchNotesParams {
  query: string;
  from_date?: string;
  to_date?: string;
  tag?: string;
}

/**
 * Lists notes with optional date/tag filters.
 * Returns NoteEntry[] sorted by created_at descending (Rust side).
 * On error, returns IpcResult with error — grid module shows empty state + toast.
 */
export async function listNotes(
  params: ListNotesParams,
): Promise<IpcResult<NoteEntry[]>> {
  return safeInvoke<NoteEntry[]>(
    'list_notes',
    params as Record<string, unknown>,
    'grid',
    'list_notes',
  );
}

/**
 * Full-text search across all notes (file scan, no index engine).
 * Returns matching NoteEntry[] sorted by created_at descending.
 */
export async function searchNotes(
  params: SearchNotesParams,
): Promise<IpcResult<NoteEntry[]>> {
  return safeInvoke<NoteEntry[]>(
    'search_notes',
    params as Record<string, unknown>,
    'grid',
    'search_notes',
  );
}

// ──────────────────────────────────────────────
// module:settings IPC wrappers
// ──────────────────────────────────────────────

/**
 * Reads the current configuration (notes directory).
 */
export async function getConfig(): Promise<IpcResult<Config>> {
  return safeInvoke<Config>('get_config', {}, 'settings', 'get_config');
}

/**
 * Updates the notes directory. Rust backend validates the path
 * (existence check, write permission check) before persisting to config.json.
 */
export async function setConfig(notesDir: string): Promise<IpcResult<void>> {
  return safeInvoke<void>(
    'set_config',
    { notes_dir: notesDir },
    'settings',
    'set_config',
  );
}
