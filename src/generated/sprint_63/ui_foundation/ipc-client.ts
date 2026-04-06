// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 63-1
// @task-title: Linux, macOS
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated Sprint 63 — Task 63-1 — Linux, macOS smoke test UI foundation
// trace: plan:implementation_plan > detail:component_architecture > detail:editor_clipboard
//
// SECURITY: This module is the SOLE entry point for Tauri IPC invoke calls in the frontend.
// No Svelte component may call @tauri-apps/api invoke directly.
// All file operations are delegated to module:storage (Rust backend) — CONV-1 enforced.
// Frontend filesystem access is PROHIBITED.

import type {
  NoteEntry,
  Config,
  CreateNoteResult,
  ReadNoteResult,
  ListNotesParams,
  SearchNotesParams,
  SaveNoteParams,
  SetConfigParams,
} from './types';

/**
 * Internal invoke wrapper. Centralises the single import of Tauri's invoke so that
 * no other module in the frontend ever imports it directly.
 */
async function tauriInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<T>(cmd, args);
}

// ---------------------------------------------------------------------------
// module:storage IPC commands
// ---------------------------------------------------------------------------

/**
 * Creates a new note. Filename (YYYY-MM-DDTHHMMSS.md) is generated exclusively
 * by module:storage (Rust, chrono crate). Frontend never fabricates filenames.
 */
export async function createNote(): Promise<CreateNoteResult> {
  return tauriInvoke<CreateNoteResult>('create_note');
}

/**
 * Overwrites an existing note file with the provided content (frontmatter + body).
 * Called by the auto-save debounce timer in module:editor.
 * filename is validated server-side against YYYY-MM-DDTHHMMSS(_N)?.md regex.
 */
export async function saveNote(params: SaveNoteParams): Promise<void> {
  return tauriInvoke<void>('save_note', {
    filename: params.filename,
    content: params.content,
  });
}

/**
 * Reads the full content of a note file.
 * Called by module:editor when navigating from grid view.
 */
export async function readNote(filename: string): Promise<ReadNoteResult> {
  return tauriInvoke<ReadNoteResult>('read_note', { filename });
}

/**
 * Physically deletes a note file. No soft-delete / trash mechanism.
 */
export async function deleteNote(filename: string): Promise<void> {
  return tauriInvoke<void>('delete_note', { filename });
}

/**
 * Lists notes filtered by date range and/or tag.
 * Response is pre-sorted by created_at descending (newest first) on the Rust side.
 * Default 7-day window is computed by the calling component (module:grid), not here.
 */
export async function listNotes(params: ListNotesParams): Promise<NoteEntry[]> {
  return tauriInvoke<NoteEntry[]>('list_notes', {
    from_date: params.from_date,
    to_date: params.to_date,
    tag: params.tag,
  });
}

/**
 * Full-text search via file-scan (str::contains, case-insensitive) on the Rust side.
 * No client-side search is permitted — CONV-IPC enforced.
 */
export async function searchNotes(params: SearchNotesParams): Promise<NoteEntry[]> {
  return tauriInvoke<NoteEntry[]>('search_notes', {
    query: params.query,
    from_date: params.from_date,
    to_date: params.to_date,
    tag: params.tag,
  });
}

// ---------------------------------------------------------------------------
// module:settings IPC commands
// ---------------------------------------------------------------------------

/**
 * Retrieves current application config (notes_dir).
 */
export async function getConfig(): Promise<Config> {
  return tauriInvoke<Config>('get_config');
}

/**
 * Persists a new notes_dir. Path validation (existence, write permission) is performed
 * exclusively on the Rust side — CONV-2 enforced. Frontend never writes config.json.
 */
export async function setConfig(params: SetConfigParams): Promise<void> {
  return tauriInvoke<void>('set_config', { notes_dir: params.notes_dir });
}
