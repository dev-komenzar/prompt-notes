// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 8-1
// @task-title: 共有層
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=8 task=8-1 module=shared-layer
// Single entry point for all Tauri IPC invoke calls.
// No component may call @tauri-apps/api invoke directly; all calls route through this module.
// References: detail:component_architecture §3.4, detail:editor_clipboard §3.1, detail:grid_search §3.2

import { invoke } from "@tauri-apps/api/core";
import type {
  NoteEntry,
  Config,
  CreateNoteResponse,
  ReadNoteResponse,
  SaveNoteParams,
  ReadNoteParams,
  DeleteNoteParams,
  ListNotesParams,
  SearchNotesParams,
  SetConfigParams,
} from "./types";

/**
 * Create a new note. Rust backend generates the YYYY-MM-DDTHHMMSS.md filename
 * via chrono and creates the file with an empty frontmatter template.
 * Called by module:editor on Cmd+N / Ctrl+N.
 */
export async function createNote(): Promise<CreateNoteResponse> {
  return invoke<CreateNoteResponse>("create_note");
}

/**
 * Overwrite-save the given content (frontmatter + body) to the specified file.
 * Called by module:editor auto-save (500ms debounce).
 * Rust backend validates filename against YYYY-MM-DDTHHMMSS pattern and
 * rejects path traversal attempts.
 */
export async function saveNote(
  filename: string,
  content: string
): Promise<void> {
  const params: SaveNoteParams = { filename, content };
  return invoke<void>("save_note", params);
}

/**
 * Read file content for the specified note.
 * Called by module:editor when navigating from grid view.
 * Rust backend validates filename before reading.
 */
export async function readNote(filename: string): Promise<ReadNoteResponse> {
  const params: ReadNoteParams = { filename };
  return invoke<ReadNoteResponse>("read_note", params);
}

/**
 * Permanently delete the specified note file.
 * Rust backend validates filename before deletion.
 */
export async function deleteNote(filename: string): Promise<void> {
  const params: DeleteNoteParams = { filename };
  return invoke<void>("delete_note", params);
}

/**
 * List notes filtered by date range and/or tag.
 * Returns NoteEntry[] sorted by created_at descending (newest first).
 * Sorting is performed by module:storage on the Rust side.
 * Called by module:grid for default 7-day view, tag filter, and date filter.
 */
export async function listNotes(
  params?: ListNotesParams
): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>("list_notes", params ?? {});
}

/**
 * Full-text search across all note files with optional date/tag filters.
 * Rust backend performs case-insensitive substring matching via str::contains.
 * No client-side search is permitted; all search logic resides in module:storage.
 * Called by module:grid when search query is non-empty.
 */
export async function searchNotes(
  params: SearchNotesParams
): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>("search_notes", params);
}

/**
 * Retrieve current application configuration.
 * Called by module:settings UI to display current notes_dir.
 */
export async function getConfig(): Promise<Config> {
  return invoke<Config>("get_config");
}

/**
 * Update application configuration (notes_dir).
 * Rust backend validates path existence and write permissions before persisting
 * to config.json. Frontend must not write config.json directly.
 * Called by module:settings UI after directory picker selection.
 */
export async function setConfig(notesDir: string): Promise<void> {
  const params: SetConfigParams = { notes_dir: notesDir };
  return invoke<void>("set_config", params);
}
