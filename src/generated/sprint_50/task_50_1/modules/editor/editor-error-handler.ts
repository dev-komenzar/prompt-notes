// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 50-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Trace: sprint=50, task=50-1, module=editor, resolves=OQ-006
// Editor module error handling: note creation and note loading errors.

import type { IpcResult } from '../../types/errors';
import { handleError } from '../../lib/error-handler';
import { toastStore } from '../../lib/toast-store';
import type { CreateNoteResponse, ReadNoteResponse } from '../../lib/api-error-wrapper';

/**
 * Handles the result of a create_note IPC call (Cmd+N / Ctrl+N).
 *
 * On success: returns the new filename for the editor to load.
 * On error: shows toast notification and returns null.
 *
 * Since note creation is an explicit user action (keyboard shortcut),
 * errors are shown as standard toast notifications.
 */
export function handleCreateNoteResult(
  result: IpcResult<CreateNoteResponse>,
): CreateNoteResponse | null {
  if (result.ok) {
    return result.data;
  }

  handleError(result.error);
  return null;
}

/**
 * Handles the result of a read_note IPC call (loading from grid → editor).
 *
 * On success: returns the note content for CodeMirror to display.
 * On error: shows toast notification and returns null.
 *   The caller (Editor.svelte) should handle null by staying on current view
 *   or navigating back to grid.
 */
export function handleReadNoteResult(
  result: IpcResult<ReadNoteResponse>,
): string | null {
  if (result.ok) {
    return result.data.content;
  }

  handleError(result.error);
  return null;
}

/**
 * Handles the result of a delete_note IPC call.
 *
 * On success: returns true. Caller should navigate away from deleted note.
 * On error: shows toast and returns false.
 */
export function handleDeleteNoteResult(
  result: IpcResult<void>,
): boolean {
  if (result.ok) {
    toastStore.push({
      message: 'ノートを削除しました',
      severity: 'info',
      durationMs: 2000,
    });
    return true;
  }

  handleError(result.error);
  return false;
}
