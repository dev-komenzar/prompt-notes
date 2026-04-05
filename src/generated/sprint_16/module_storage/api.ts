// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 16-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated Sprint 16 — Task 16-1 — module:storage
// CoDD traceability: detail:component_architecture §3.3, §3.4
// detail:storage_fileformat §3.3, detail:editor_clipboard §4.6
//
// This module is the SINGLE entry-point for all module:storage IPC calls.
// Components MUST NOT call @tauri-apps/api invoke() directly.
// All filesystem operations are delegated to the Rust backend via Tauri IPC.
// Frontend filesystem access is PROHIBITED (CONV-1).

import { invoke } from "@tauri-apps/api/core";

import type {
  CreateNoteResult,
  DeleteNoteArgs,
  ListNotesArgs,
  NoteEntry,
  ReadNoteArgs,
  ReadNoteResult,
  SaveNoteArgs,
  SearchNotesArgs,
} from "./types";
import { assertValidNoteFilename } from "./validation";
import { DeleteNoteError, StorageIpcError } from "./errors";

/**
 * Creates a new note file with a timestamp-derived filename.
 * Filename generation is owned exclusively by module:storage (Rust/chrono).
 * Frontend MUST NOT generate filenames.
 *
 * @returns The generated filename and absolute path.
 */
export async function createNote(): Promise<CreateNoteResult> {
  try {
    return await invoke<CreateNoteResult>("create_note");
  } catch (err: unknown) {
    throw new StorageIpcError("create_note", err);
  }
}

/**
 * Persists note content (frontmatter + body) by overwriting the file.
 * Called by module:editor's auto-save debounce timer (500 ms).
 * Rust backend performs stateless full-content write via std::fs::write.
 *
 * @param args.filename - Must conform to YYYY-MM-DDTHHMMSS.md pattern.
 * @param args.content  - Full file content including YAML frontmatter.
 */
export async function saveNote(args: SaveNoteArgs): Promise<void> {
  assertValidNoteFilename(args.filename);
  try {
    await invoke<void>("save_note", {
      filename: args.filename,
      content: args.content,
    });
  } catch (err: unknown) {
    throw new StorageIpcError("save_note", err);
  }
}

/**
 * Reads a note file and returns its full content.
 *
 * @param args.filename - Must conform to YYYY-MM-DDTHHMMSS.md pattern.
 * @returns The file content (frontmatter + body).
 */
export async function readNote(args: ReadNoteArgs): Promise<ReadNoteResult> {
  assertValidNoteFilename(args.filename);
  try {
    return await invoke<ReadNoteResult>("read_note", {
      filename: args.filename,
    });
  } catch (err: unknown) {
    throw new StorageIpcError("read_note", err);
  }
}

/**
 * Deletes a note file permanently (physical deletion via std::fs::remove_file).
 * No trash/soft-delete mechanism exists.
 *
 * Sprint 16 primary deliverable — delete_note IPC command integration.
 *
 * Called from:
 *   - module:editor (future delete UI)
 *   - module:grid   (card-level delete action)
 *
 * Security:
 *   - Filename validated client-side (defense-in-depth) AND server-side (authoritative).
 *   - Path traversal is impossible: Rust backend joins filename with notes_dir
 *     and rejects any filename not matching the canonical regex.
 *
 * @param args.filename - Must conform to YYYY-MM-DDTHHMMSS.md pattern.
 * @throws {DeleteNoteError} If the Rust backend rejects the operation.
 */
export async function deleteNote(args: DeleteNoteArgs): Promise<void> {
  assertValidNoteFilename(args.filename);
  try {
    await invoke<void>("delete_note", {
      filename: args.filename,
    });
  } catch (err: unknown) {
    throw new DeleteNoteError(args.filename, err);
  }
}

/**
 * Lists notes filtered by date range and/or tag.
 * Results are sorted by created_at descending (newest first).
 * Sort logic is owned by module:storage (Rust); no client-side re-sort needed.
 *
 * @param args.from_date - Optional ISO date lower bound "YYYY-MM-DD".
 * @param args.to_date   - Optional ISO date upper bound "YYYY-MM-DD".
 * @param args.tag       - Optional single tag filter.
 */
export async function listNotes(
  args: ListNotesArgs = {}
): Promise<NoteEntry[]> {
  try {
    return await invoke<NoteEntry[]>("list_notes", {
      from_date: args.from_date,
      to_date: args.to_date,
      tag: args.tag,
    });
  } catch (err: unknown) {
    throw new StorageIpcError("list_notes", err);
  }
}

/**
 * Full-text search across all note files via Rust backend file scan.
 * Uses str::to_lowercase().contains() — case-insensitive substring match.
 * No index engine; adequate for ≤5000 notes.
 *
 * Client-side search is PROHIBITED. All search logic resides in Rust.
 *
 * @param args.query     - Non-empty search query string.
 * @param args.from_date - Optional ISO date lower bound.
 * @param args.to_date   - Optional ISO date upper bound.
 * @param args.tag       - Optional single tag filter.
 */
export async function searchNotes(args: SearchNotesArgs): Promise<NoteEntry[]> {
  try {
    return await invoke<NoteEntry[]>("search_notes", {
      query: args.query,
      from_date: args.from_date,
      to_date: args.to_date,
      tag: args.tag,
    });
  } catch (err: unknown) {
    throw new StorageIpcError("search_notes", err);
  }
}
