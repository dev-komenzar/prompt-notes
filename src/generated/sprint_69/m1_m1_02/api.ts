// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 69-1
// @task-title: M1（M1-02）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated sprint:69 task:69-1 module:m1_m1_02
// CoDD trace: detail:component_architecture, detail:editor_clipboard, detail:grid_search
// Tauri v2 — Type-safe IPC invoke wrappers
//
// IMPORTANT: This module is the SOLE entry point for Tauri IPC calls.
// Svelte components MUST NOT call invoke() directly.
// All file operations go through Rust backend (module:storage / module:settings).
// Frontend direct filesystem access is PROHIBITED (CONV-1).

// Tauri v2 uses @tauri-apps/api/core (NOT @tauri-apps/api/tauri which was v1)
import { invoke } from '@tauri-apps/api/core';

import { IPC_COMMANDS } from './ipc-commands';
import type {
  CreateNoteResult,
  ReadNoteResult,
  NoteEntry,
  Config,
  ListNotesArgs,
  SearchNotesArgs,
} from './types';

// ---------------------------------------------------------------------------
// module:storage commands (file CRUD, search)
// ---------------------------------------------------------------------------

/**
 * Create a new note. Filename (YYYY-MM-DDTHHMMSS.md) is generated
 * exclusively by Rust backend using chrono crate. Frontend MUST NOT
 * generate filenames.
 *
 * Called by: module:editor (Cmd+N / Ctrl+N handler)
 */
export async function createNote(): Promise<CreateNoteResult> {
  return invoke<CreateNoteResult>(IPC_COMMANDS.CREATE_NOTE);
}

/**
 * Overwrite-save a note. Rust backend validates filename against
 * /^\d{4}-\d{2}-\d{2}T\d{6}(_\d+)?\.md$/ and rejects path traversal.
 *
 * Called by: module:editor (auto-save debounce timer)
 */
export async function saveNote(filename: string, content: string): Promise<void> {
  return invoke<void>(IPC_COMMANDS.SAVE_NOTE, { filename, content });
}

/**
 * Read full file content (frontmatter + body) for a single note.
 *
 * Called by: module:editor (on mount when navigating from grid)
 */
export async function readNote(filename: string): Promise<ReadNoteResult> {
  return invoke<ReadNoteResult>(IPC_COMMANDS.READ_NOTE, { filename });
}

/**
 * Physically delete a note file. No soft-delete / trash.
 *
 * Called by: module:editor, module:grid
 */
export async function deleteNote(filename: string): Promise<void> {
  return invoke<void>(IPC_COMMANDS.DELETE_NOTE, { filename });
}

/**
 * List notes with optional date and tag filters.
 * Results are sorted by created_at descending (newest first) on Rust side.
 * Frontend MUST NOT re-sort.
 *
 * Default 7-day filter: from_date/to_date are computed by module:grid (Svelte side)
 * and passed here. Rust side has no concept of default values.
 *
 * Called by: module:grid (initial load, filter changes)
 */
export async function listNotes(args: ListNotesArgs = {}): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>(IPC_COMMANDS.LIST_NOTES, {
    from_date: args.from_date,
    to_date: args.to_date,
    tag: args.tag,
  });
}

/**
 * Full-text search via file scan (str::contains, case-insensitive) on Rust side.
 * No index engine. Filters (date, tag) can be combined with query.
 *
 * Called by: module:grid (search box, debounced)
 */
export async function searchNotes(args: SearchNotesArgs): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>(IPC_COMMANDS.SEARCH_NOTES, {
    query: args.query,
    from_date: args.from_date,
    to_date: args.to_date,
    tag: args.tag,
  });
}

// ---------------------------------------------------------------------------
// module:settings commands (config persistence)
// ---------------------------------------------------------------------------

/**
 * Retrieve current configuration from Rust backend.
 * Config is owned by module:settings (Rust). Frontend reads only.
 *
 * Called by: module:settings UI
 */
export async function getConfig(): Promise<Config> {
  return invoke<Config>(IPC_COMMANDS.GET_CONFIG);
}

/**
 * Update notes directory. Rust backend validates path existence and
 * write permissions before persisting to config.json.
 * Frontend MUST NOT perform path validation or write config directly (CONV-2).
 *
 * Called by: module:settings UI (after directory picker selection)
 */
export async function setConfig(notesDir: string): Promise<void> {
  return invoke<void>(IPC_COMMANDS.SET_CONFIG, { notes_dir: notesDir });
}
