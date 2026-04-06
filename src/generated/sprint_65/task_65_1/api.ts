// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 65-1
// @task-title: 解決マイルストーン
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=65, task=65-1, module=shell+storage+settings
// Single entry point for all Tauri IPC invoke calls.
// CONV-1: All file operations go through Rust backend via Tauri IPC.
// CONV-2: Settings persistence is Rust-backend only.
// Components MUST NOT call @tauri-apps/api invoke directly; use these wrappers.

import type {
  NoteEntry,
  Config,
  CreateNoteResponse,
  ReadNoteResponse,
  ListNotesArgs,
  SearchNotesArgs,
  SaveNoteArgs,
  NoteFilenameArgs,
  SetConfigArgs,
} from "./types";

/**
 * Invokes a Tauri IPC command with type-safe arguments and return type.
 * This is the only location in the frontend codebase that calls invoke directly.
 */
async function invokeCommand<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<T>(cmd, args);
}

// ---------------------------------------------------------------------------
// module:storage IPC commands
// ---------------------------------------------------------------------------

/**
 * Creates a new note file with a timestamp-based filename.
 * Filename generation is exclusively owned by module:storage (Rust/chrono).
 * Called by module:editor on Cmd+N / Ctrl+N.
 */
export async function createNote(): Promise<CreateNoteResponse> {
  return invokeCommand<CreateNoteResponse>("create_note");
}

/**
 * Overwrites the content of an existing note file.
 * Called by module:editor auto-save (500ms debounce).
 * Rust side validates filename against YYYY-MM-DDTHHMMSS pattern.
 */
export async function saveNote(filename: string, content: string): Promise<void> {
  const args: SaveNoteArgs = { filename, content };
  return invokeCommand<void>("save_note", args as unknown as Record<string, unknown>);
}

/**
 * Reads the full content (frontmatter + body) of a note file.
 * Called by module:editor when loading an existing note.
 */
export async function readNote(filename: string): Promise<ReadNoteResponse> {
  const args: NoteFilenameArgs = { filename };
  return invokeCommand<ReadNoteResponse>("read_note", args as unknown as Record<string, unknown>);
}

/**
 * Physically deletes a note file from the filesystem.
 * No soft-delete or trash mechanism exists.
 */
export async function deleteNote(filename: string): Promise<void> {
  const args: NoteFilenameArgs = { filename };
  return invokeCommand<void>("delete_note", args as unknown as Record<string, unknown>);
}

/**
 * Lists notes filtered by date range and/or tag.
 * Returns NoteEntry[] sorted by created_at descending (newest first).
 * Sorting is performed by module:storage (Rust); no client-side re-sort needed.
 * Called by module:grid for default 7-day view and filter changes.
 */
export async function listNotes(args: ListNotesArgs): Promise<NoteEntry[]> {
  return invokeCommand<NoteEntry[]>("list_notes", args as unknown as Record<string, unknown>);
}

/**
 * Full-text searches notes via file-scan (str::contains, case-insensitive).
 * Also supports date/tag filters combined with the query.
 * Called by module:grid when search query is non-empty.
 */
export async function searchNotes(args: SearchNotesArgs): Promise<NoteEntry[]> {
  return invokeCommand<NoteEntry[]>("search_notes", args as unknown as Record<string, unknown>);
}

// ---------------------------------------------------------------------------
// module:settings IPC commands
// ---------------------------------------------------------------------------

/**
 * Retrieves the current application configuration.
 * Called by module:settings UI on mount.
 */
export async function getConfig(): Promise<Config> {
  return invokeCommand<Config>("get_config");
}

/**
 * Updates the notes directory path.
 * Rust backend validates path existence and write permissions before persisting.
 * Frontend MUST NOT perform any filesystem path operations directly (CONV-2).
 */
export async function setConfig(notesDir: string): Promise<void> {
  const args: SetConfigArgs = { notes_dir: notesDir };
  return invokeCommand<void>("set_config", args as unknown as Record<string, unknown>);
}
