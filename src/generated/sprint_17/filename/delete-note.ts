// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 17-1
// @task-title: パストラバーサル防止バリデーション（`filename` にパス区切り文字が含まれないことを検証）→ ファイル物理削除
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd:sprint=17 task=17-1 module=storage

import { invoke } from '@tauri-apps/api/core';
import { assertValidFilename } from './validate';

export interface DeleteNoteResult {
  success: boolean;
}

/**
 * Deletes the note with the given filename.
 * Validates filename for path traversal before invoking the Rust backend.
 * The Rust backend (delete_note command) performs the physical file deletion.
 */
export async function deleteNote(filename: string): Promise<DeleteNoteResult> {
  assertValidFilename(filename);
  return invoke<DeleteNoteResult>('delete_note', { filename });
}
