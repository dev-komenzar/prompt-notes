// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 36-1
// @task-title: 対象モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// PromptNotes — Tauri IPC Wrapper
// Single entry point for all backend communication.
// CONV-1: All file operations go through Rust backend via Tauri IPC.
// CONV-2: Settings persistence exclusively via Rust backend.
// Components MUST NOT call invoke() directly; use these functions instead.
// CoDD trace: detail:component_architecture, detail:editor_clipboard, detail:grid_search, detail:storage_fileformat

import { invoke } from "@tauri-apps/api/core";
import type {
  CreateNoteResult,
  ReadNoteResult,
  SaveNoteParams,
  ReadNoteParams,
  DeleteNoteParams,
  ListNotesParams,
  SearchNotesParams,
  SetConfigParams,
  NoteEntry,
  Config,
} from "./types";

/**
 * Create a new note file.
 * Rust backend generates the YYYY-MM-DDTHHMMSS.md filename using chrono.
 * Frontend MUST NOT generate filenames.
 *
 * Called by: module:editor (Cmd+N / Ctrl+N)
 */
export async function createNote(): Promise<CreateNoteResult> {
  return invoke<CreateNoteResult>("create_note");
}

/**
 * Save note content (frontmatter + body) to an existing file.
 * Rust backend validates filename and performs atomic overwrite.
 *
 * Called by: module:editor (auto-save debounce)
 */
export async function saveNote(params: SaveNoteParams): Promise<void> {
  return invoke<void>("save_note", params);
}

/**
 * Read the full content of a note file.
 *
 * Called by: module:editor (load note from grid navigation)
 */
export async function readNote(params: ReadNoteParams): Promise<ReadNoteResult> {
  return invoke<ReadNoteResult>("read_note", params);
}

/**
 * Delete a note file permanently.
 * No soft-delete or trash mechanism.
 *
 * Called by: module:editor, module:grid
 */
export async function deleteNote(params: DeleteNoteParams): Promise<void> {
  return invoke<void>("delete_note", params);
}

/**
 * List notes with optional date range and tag filters.
 * Results are sorted by created_at descending (newest first).
 * Rust backend handles all filtering logic; no client-side filtering.
 *
 * Called by: module:grid (initial load, filter changes)
 */
export async function listNotes(params: ListNotesParams): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>("list_notes", params);
}

/**
 * Full-text search across all note files.
 * Rust backend performs case-insensitive substring match via str::contains.
 * Supports combined filtering with date range and tag.
 * No client-side search is permitted.
 *
 * Called by: module:grid (search box input)
 */
export async function searchNotes(params: SearchNotesParams): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>("search_notes", params);
}

/**
 * Retrieve current application configuration.
 *
 * Called by: module:settings UI
 */
export async function getConfig(): Promise<Config> {
  return invoke<Config>("get_config");
}

/**
 * Update application configuration.
 * Rust backend validates the directory path (existence, write permissions)
 * before persisting to config.json.
 * Frontend MUST NOT perform direct filesystem path operations.
 *
 * Called by: module:settings UI
 */
export async function setConfig(params: SetConfigParams): Promise<void> {
  return invoke<void>("set_config", params);
}
