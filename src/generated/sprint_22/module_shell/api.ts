// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 22-1
// @task-title: `module:shell`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=22, task=22-1, module=module:shell
// Type-safe IPC API — the single entry point for all frontend→backend communication.
// Convention 3: Frontend direct filesystem access is PROHIBITED.
// Convention 4: Settings changes go through Rust backend for persistence.
// Convention 16: All communication via Tauri IPC (invoke).
//
// Every Svelte component (module:editor, module:grid, module:settings UI)
// MUST use these functions instead of calling @tauri-apps/api invoke directly.

import { invokeCommand } from './invoke';
import { IPC_COMMANDS } from './commands';
import type {
  NoteEntry,
  Config,
  CreateNoteResponse,
  ReadNoteResponse,
  ListNotesArgs,
  SearchNotesArgs,
} from './types';

// ---------------------------------------------------------------------------
// module:storage commands
// ---------------------------------------------------------------------------

/**
 * Creates a new note file with a timestamp-based filename.
 * Filename generation (YYYY-MM-DDTHHMMSS.md) is performed exclusively by
 * the Rust backend using the chrono crate. Frontend MUST NOT generate filenames.
 *
 * Called by: module:editor (Cmd+N / Ctrl+N)
 */
export async function createNote(): Promise<CreateNoteResponse> {
  return invokeCommand<CreateNoteResponse>(IPC_COMMANDS.CREATE_NOTE);
}

/**
 * Overwrites the content of an existing note file.
 * The Rust backend validates the filename against the YYYY-MM-DDTHHMMSS.md pattern
 * and rejects path traversal attempts.
 *
 * Called by: module:editor (auto-save after 500ms debounce)
 *
 * @param filename - The note filename (received from createNote, never user-generated)
 * @param content - Full file content including frontmatter
 */
export async function saveNote(
  filename: string,
  content: string,
): Promise<void> {
  await invokeCommand<void>(IPC_COMMANDS.SAVE_NOTE, { filename, content });
}

/**
 * Reads the full content of a note file.
 *
 * Called by: module:editor (when navigating from grid view)
 *
 * @param filename - The note filename
 * @returns The full file content including frontmatter
 */
export async function readNote(filename: string): Promise<ReadNoteResponse> {
  return invokeCommand<ReadNoteResponse>(IPC_COMMANDS.READ_NOTE, { filename });
}

/**
 * Permanently deletes a note file from the filesystem.
 * No soft-delete or trash mechanism exists.
 *
 * Called by: module:editor, module:grid
 *
 * @param filename - The note filename to delete
 */
export async function deleteNote(filename: string): Promise<void> {
  await invokeCommand<void>(IPC_COMMANDS.DELETE_NOTE, { filename });
}

/**
 * Lists notes filtered by date range and/or tag.
 * Results are returned in created_at descending order (newest first).
 * Sorting is performed by the Rust backend; no client-side re-sort needed.
 *
 * Date filtering compares against the filename-derived timestamp.
 * Tag filtering matches against the frontmatter tags array.
 *
 * Called by: module:grid (initial load, filter changes)
 *
 * @param filters - Optional date range and tag filter parameters
 * @returns Sorted array of NoteEntry objects
 */
export async function listNotes(
  filters?: ListNotesArgs,
): Promise<NoteEntry[]> {
  return invokeCommand<NoteEntry[]>(
    IPC_COMMANDS.LIST_NOTES,
    filters as Record<string, unknown> | undefined,
  );
}

/**
 * Full-text searches notes by scanning all .md files.
 * Rust backend performs case-insensitive substring matching (str::contains).
 * No index engine is used; file scan is sufficient for expected note volumes.
 *
 * Supports combining search query with date/tag filters.
 *
 * Called by: module:grid (search input)
 *
 * @param params - Search query and optional filter parameters
 * @returns Matching NoteEntry objects in created_at descending order
 */
export async function searchNotes(
  params: SearchNotesArgs,
): Promise<NoteEntry[]> {
  return invokeCommand<NoteEntry[]>(
    IPC_COMMANDS.SEARCH_NOTES,
    params as Record<string, unknown>,
  );
}

// ---------------------------------------------------------------------------
// module:settings commands
// ---------------------------------------------------------------------------

/**
 * Retrieves the current application configuration.
 *
 * Called by: module:settings UI
 *
 * @returns Current Config including notes_dir
 */
export async function getConfig(): Promise<Config> {
  return invokeCommand<Config>(IPC_COMMANDS.GET_CONFIG);
}

/**
 * Updates the notes storage directory.
 * The Rust backend validates the path (existence check, write permission)
 * before persisting to config.json.
 * Convention 4: Frontend MUST NOT write file paths directly to the filesystem.
 *
 * After change, new notes are saved to the new directory.
 * Existing notes are NOT moved automatically.
 *
 * Called by: module:settings UI
 *
 * @param notesDir - Absolute path to the new notes directory
 */
export async function setConfig(notesDir: string): Promise<void> {
  await invokeCommand<void>(IPC_COMMANDS.SET_CONFIG, { notes_dir: notesDir });
}
