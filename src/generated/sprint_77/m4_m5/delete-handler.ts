// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 77-1
// @task-title: M4 または M5
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

/**
 * Core delete execution logic with filename validation.
 *
 * Security: validates filename format before delegating to the IPC layer.
 * Pattern enforcement prevents path traversal attacks.
 * All actual file deletion is performed by module:storage (Rust backend)
 * via Tauri IPC — no direct filesystem access from frontend.
 */

import type { DeleteResult, DeleteNoteFn } from './types';

/**
 * Regex enforcing the YYYY-MM-DDTHHMMSS.md filename convention.
 * Also allows collision-avoidance suffix: YYYY-MM-DDTHHMMSS_N.md
 * Rejects any path separator characters (/, \, ..)
 *
 * Reference: storage_fileformat_design.md §1.1
 */
const VALID_FILENAME_RE = /^\d{4}-\d{2}-\d{2}T\d{6}(_\d+)?\.md$/;

/**
 * Validate that a filename conforms to the expected note filename pattern.
 * Used as a frontend guard before IPC calls. The Rust backend performs
 * its own validation as the authoritative check.
 */
export function isValidNoteFilename(filename: string): boolean {
  return VALID_FILENAME_RE.test(filename);
}

/**
 * Execute a note deletion via the IPC layer.
 *
 * 1. Validates filename format (path traversal prevention)
 * 2. Delegates to deleteNoteFn (lib/api.ts → Tauri IPC → module:storage)
 * 3. Returns a typed DeleteResult indicating success or failure
 *
 * @param filename - The note filename to delete (e.g. "2026-04-04T143052.md")
 * @param deleteNoteFn - The IPC wrapper from lib/api.ts (deleteNote function)
 */
export async function executeDeleteNote(
  filename: string,
  deleteNoteFn: DeleteNoteFn
): Promise<DeleteResult> {
  if (!isValidNoteFilename(filename)) {
    return {
      success: false,
      filename,
      error: `無効なファイル名形式です: ${filename}`,
    };
  }

  try {
    await deleteNoteFn(filename);
    return { success: true, filename };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      filename,
      error: message,
    };
  }
}
