// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 15-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// module:storage — Tauri IPC wrapper functions
// All file operations MUST go through these wrappers.
// Direct @tauri-apps/api invoke calls outside this file are prohibited.
// Direct filesystem access from frontend is prohibited (CONV-1).
// Sprint 15 · M2-03 · read_note IPC コマンド実装

import { invoke } from '@tauri-apps/api/core';
import type {
  CreateNoteResponse,
  ReadNoteParams,
  ReadNoteResponse,
  SaveNoteParams,
  DeleteNoteParams,
  ListNotesParams,
  SearchNotesParams,
  SetConfigParams,
  NoteEntry,
  Config,
} from './types';

/**
 * Create a new note file with timestamp-based filename (YYYY-MM-DDTHHMMSS.md).
 * Filename generation is exclusively owned by Rust module:storage (chrono crate).
 * Frontend MUST NOT generate filenames.
 */
export async function createNote(): Promise<CreateNoteResponse> {
  return invoke<CreateNoteResponse>('create_note');
}

/**
 * Read the full content of a note file.
 * Filename is validated server-side against the pattern ^\d{4}-\d{2}-\d{2}T\d{6}(_\d+)?\.md$
 * to prevent path traversal.
 */
export async function readNote(params: ReadNoteParams): Promise<ReadNoteResponse> {
  return invoke<ReadNoteResponse>('read_note', { filename: params.filename });
}

/**
 * Overwrite a note file with the given content (frontmatter + body).
 * Called by the auto-save debounce mechanism in module:editor.
 * Rust side performs stateless full-content overwrite via std::fs::write.
 */
export async function saveNote(params: SaveNoteParams): Promise<void> {
  return invoke<void>('save_note', {
    filename: params.filename,
    content: params.content,
  });
}

/**
 * Physically delete a note file via std::fs::remove_file.
 * No soft-delete or trash mechanism.
 */
export async function deleteNote(params: DeleteNoteParams): Promise<void> {
  return invoke<void>('delete_note', { filename: params.filename });
}

/**
 * List notes with optional date range and tag filters.
 * Results are sorted by created_at descending (newest first) on the Rust side.
 * Frontend MUST NOT re-sort or re-filter the results (CONV-IPC).
 *
 * Default 7-day filter dates are computed by the caller (module:grid),
 * NOT by the Rust backend.
 */
export async function listNotes(params?: ListNotesParams): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>('list_notes', params ?? {});
}

/**
 * Full-text search via Rust-side file scan (str::to_lowercase().contains()).
 * No index engine. Supports combined date/tag filters.
 * Use listNotes() when query is empty.
 */
export async function searchNotes(params: SearchNotesParams): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>('search_notes', params);
}

/**
 * Read current application configuration.
 * Owned by module:settings (Rust backend).
 */
export async function getConfig(): Promise<Config> {
  return invoke<Config>('get_config');
}

/**
 * Update application configuration (notes_dir).
 * Path validation and permission checks are performed Rust-side.
 * Frontend MUST NOT write config.json directly (CONV-2).
 */
export async function setConfig(params: SetConfigParams): Promise<void> {
  return invoke<void>('set_config', { notes_dir: params.notes_dir });
}
