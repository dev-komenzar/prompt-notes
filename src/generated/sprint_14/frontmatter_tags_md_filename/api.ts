// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 14-1
// @task-title: ファイル名生成 → frontmatter テンプレート（空 `tags`）付き `.md` ファイル作成 → `{filename}` 返却
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/component_architecture.md
// @sprint: 14
// @task: 14-1

import type { CreateNoteResult, SaveResult, Frontmatter } from './types';

/**
 * IPC abstraction layer for note-related Tauri commands.
 *
 * All file operations go through Rust backend via Tauri IPC.
 * Direct filesystem access from the frontend is prohibited (NNC-1).
 * Frontend never generates filenames — that is module:storage's responsibility.
 */

/**
 * Dynamically imports the Tauri invoke function.
 * This allows the module to be imported in non-Tauri environments (e.g. tests)
 * without immediately failing.
 */
async function getInvoke(): Promise<(cmd: string, args?: Record<string, unknown>) => Promise<unknown>> {
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke;
}

/**
 * Creates a new note via the Rust backend.
 *
 * The backend generates:
 * 1. A filename in YYYY-MM-DDTHHMMSS.md format from the current timestamp
 * 2. A .md file with empty frontmatter template (tags: [])
 *
 * @returns The generated filename and full path of the created note.
 */
export async function createNote(): Promise<CreateNoteResult> {
  const invoke = await getInvoke();
  return invoke('create_note') as Promise<CreateNoteResult>;
}

/**
 * Reads a note's content from the Rust backend.
 *
 * @param filename - The note filename (e.g. "2026-04-10T143205.md")
 */
export async function readNote(
  filename: string
): Promise<{ frontmatter: Frontmatter; body: string }> {
  const invoke = await getInvoke();
  return invoke('read_note', { filename }) as Promise<{
    frontmatter: Frontmatter;
    body: string;
  }>;
}

/**
 * Saves a note's content via the Rust backend.
 * Called by the autosave debounce mechanism.
 *
 * The backend performs atomic writes (temp file + rename) to prevent corruption.
 *
 * @param filename - The note filename (immutable, set at creation time)
 * @param frontmatter - The frontmatter data (tags only, per NNC-S2)
 * @param body - The note body text
 */
export async function saveNote(
  filename: string,
  frontmatter: Frontmatter,
  body: string
): Promise<SaveResult> {
  const invoke = await getInvoke();
  return invoke('save_note', { filename, frontmatter, body }) as Promise<SaveResult>;
}

/**
 * Deletes a note via the Rust backend.
 * Physical deletion — no trash/recycle bin.
 *
 * @param filename - The note filename to delete
 */
export async function deleteNote(filename: string): Promise<SaveResult> {
  const invoke = await getInvoke();
  return invoke('delete_note', { filename }) as Promise<SaveResult>;
}
