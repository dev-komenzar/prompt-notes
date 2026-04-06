// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 48-1
// @task-title: 対象モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=48, task=48-1, module=api
// Single entry-point for all Tauri IPC (invoke) calls.
// No other frontend module may import @tauri-apps/api/core directly.
// All file operations are delegated to the Rust backend via these wrappers.

import { invoke } from "@tauri-apps/api/core";
import type {
  CreateNoteResult,
  SaveNoteArgs,
  ReadNoteArgs,
  ReadNoteResult,
  DeleteNoteArgs,
  ListNotesArgs,
  SearchNotesArgs,
  SetConfigArgs,
  NoteEntry,
  Config,
} from "./types";

// ── module:storage IPC commands ──────────────────────────────────────

/**
 * Create a new note file.
 * Rust side generates the YYYY-MM-DDTHHMMSS.md filename (chrono crate)
 * and writes an empty frontmatter template.
 *
 * @returns The generated filename and absolute path.
 */
export async function createNote(): Promise<CreateNoteResult> {
  return invoke<CreateNoteResult>("create_note");
}

/**
 * Overwrite the contents of an existing note.
 * The filename is validated server-side against the strict pattern.
 * Content includes frontmatter + body in full.
 */
export async function saveNote(
  filename: string,
  content: string,
): Promise<void> {
  const args: SaveNoteArgs = { filename, content };
  return invoke<void>("save_note", args);
}

/**
 * Read the full content (frontmatter + body) of a note.
 */
export async function readNote(filename: string): Promise<ReadNoteResult> {
  const args: ReadNoteArgs = { filename };
  return invoke<ReadNoteResult>("read_note", args);
}

/**
 * Permanently delete a note file from disk.
 * No soft-delete / trash mechanism.
 */
export async function deleteNote(filename: string): Promise<void> {
  const args: DeleteNoteArgs = { filename };
  return invoke<void>("delete_note", args);
}

/**
 * List notes filtered by date range and/or tag.
 * Results are sorted by created_at descending (newest first).
 * Rust side performs all filtering; the frontend must NOT re-filter.
 */
export async function listNotes(
  params: ListNotesArgs = {},
): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>("list_notes", params);
}

/**
 * Full-text search across all note files (Rust std::fs + str::contains).
 * Supports optional date/tag filters applied alongside the query.
 * No client-side search is permitted.
 */
export async function searchNotes(
  params: SearchNotesArgs,
): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>("search_notes", params);
}

// ── module:settings IPC commands ─────────────────────────────────────

/**
 * Retrieve the current application configuration.
 */
export async function getConfig(): Promise<Config> {
  return invoke<Config>("get_config");
}

/**
 * Update the notes directory. Rust side validates path existence and
 * write permissions before persisting to config.json.
 * Frontend MUST NOT perform any filesystem path operations directly.
 */
export async function setConfig(notesDir: string): Promise<void> {
  const args: SetConfigArgs = { notes_dir: notesDir };
  return invoke<void>("set_config", args);
}
