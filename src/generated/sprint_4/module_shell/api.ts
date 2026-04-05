// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 4-1
// @task-title: `module:shell`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Trace: sprint:4 task:4-1 module:shell file:api.ts
// Single entry-point for all IPC communication.
// Svelte components MUST use these functions — never call invoke directly.

import { typedInvoke } from './ipc';
import { assertValidFilename } from './filename-validator';
import type {
  NoteEntry,
  Config,
  CreateNoteResponse,
  ReadNoteResponse,
  ListNotesArgs,
  SearchNotesArgs,
} from './types';

// ── module:storage commands ───────────────────────────────────────────

/**
 * Create a new note. Filename (YYYY-MM-DDTHHMMSS.md) is generated
 * exclusively on the Rust side via chrono. Frontend never fabricates filenames.
 */
export async function createNote(): Promise<CreateNoteResponse> {
  return typedInvoke('create_note', {} as Record<string, never>);
}

/**
 * Persist note content (frontmatter + body) via auto-save.
 * Filename is validated client-side before IPC to fail fast.
 * Rust side performs canonical validation and std::fs::write.
 */
export async function saveNote(
  filename: string,
  content: string,
): Promise<void> {
  assertValidFilename(filename);
  return typedInvoke('save_note', { filename, content });
}

/**
 * Read note content by filename. Used when navigating from grid to editor.
 */
export async function readNote(
  filename: string,
): Promise<ReadNoteResponse> {
  assertValidFilename(filename);
  return typedInvoke('read_note', { filename });
}

/**
 * Delete a note file. Physical removal via std::fs::remove_file on Rust side.
 */
export async function deleteNote(filename: string): Promise<void> {
  assertValidFilename(filename);
  return typedInvoke('delete_note', { filename });
}

/**
 * List notes with optional date range and tag filters.
 * Default 7-day window is computed by the calling component (module:grid),
 * NOT by this function — Rust side is stateless with respect to defaults.
 */
export async function listNotes(
  args: ListNotesArgs = {},
): Promise<NoteEntry[]> {
  return typedInvoke('list_notes', args);
}

/**
 * Full-text search across all note files.
 * Rust side performs str::to_lowercase().contains() scan — no index engine.
 * Filter parameters (date, tag) are forwarded to narrow the scan.
 */
export async function searchNotes(
  args: SearchNotesArgs,
): Promise<NoteEntry[]> {
  return typedInvoke('search_notes', args);
}

// ── module:settings commands ──────────────────────────────────────────

/**
 * Retrieve current application configuration.
 */
export async function getConfig(): Promise<Config> {
  return typedInvoke('get_config', {} as Record<string, never>);
}

/**
 * Update the notes directory. Rust backend validates path existence and
 * write permissions before persisting to config.json.
 * Frontend MUST NOT write config.json or manipulate file paths directly.
 */
export async function setConfig(notesDir: string): Promise<void> {
  return typedInvoke('set_config', { notes_dir: notesDir });
}
