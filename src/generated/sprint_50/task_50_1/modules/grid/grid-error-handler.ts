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

// CoDD Trace: sprint=50, task=50-1, module=grid, resolves=OQ-006
// Grid module error handling: list_notes and search_notes IPC errors.
// On error, grid displays an empty state with an error message.

import type { IpcResult } from '../../types/errors';
import { StorageErrorCode } from '../../types/errors';
import { handleError } from '../../lib/error-handler';
import type { NoteEntry } from '../../lib/api-error-wrapper';

/**
 * Grid error state information for rendering empty/error states.
 */
export interface GridErrorState {
  /** Whether an error has occurred */
  readonly hasError: boolean;
  /** User-facing error message for inline display in the grid area */
  readonly errorMessage: string;
  /** Whether the user should be directed to settings (e.g., missing directory) */
  readonly suggestSettings: boolean;
}

const NO_ERROR: GridErrorState = {
  hasError: false,
  errorMessage: '',
  suggestSettings: false,
};

/**
 * Handles the result of a list_notes or search_notes IPC call.
 *
 * On success: returns the NoteEntry array and a clean error state.
 * On error:
 *   - Shows toast notification via handleError
 *   - Returns an empty array and a descriptive error state for inline display
 *   - For DIRECTORY_NOT_FOUND: suggests opening settings
 *
 * The grid component uses the returned GridErrorState to show an
 * appropriate empty state message within the grid area itself.
 */
export function handleListNotesResult(
  result: IpcResult<NoteEntry[]>,
): { notes: NoteEntry[]; errorState: GridErrorState } {
  if (result.ok) {
    return {
      notes: result.data,
      errorState: NO_ERROR,
    };
  }

  handleError(result.error);

  const suggestSettings =
    result.error.code === StorageErrorCode.DIRECTORY_NOT_FOUND ||
    result.error.code === StorageErrorCode.DIRECTORY_NOT_WRITABLE ||
    result.error.code === StorageErrorCode.PERMISSION_DENIED;

  return {
    notes: [],
    errorState: {
      hasError: true,
      errorMessage: result.error.userMessage,
      suggestSettings,
    },
  };
}

/**
 * Handles search_notes result. Same behavior as list_notes error handling
 * but with a search-specific message on empty results (not an error).
 */
export function handleSearchNotesResult(
  result: IpcResult<NoteEntry[]>,
  query: string,
): { notes: NoteEntry[]; errorState: GridErrorState } {
  if (result.ok) {
    if (result.data.length === 0 && query.length > 0) {
      // No results is not an error — return a helpful message
      return {
        notes: [],
        errorState: {
          hasError: false,
          errorMessage: `「${query}」に一致するノートが見つかりませんでした。`,
          suggestSettings: false,
        },
      };
    }
    return {
      notes: result.data,
      errorState: NO_ERROR,
    };
  }

  handleError(result.error);

  return {
    notes: [],
    errorState: {
      hasError: true,
      errorMessage: result.error.userMessage,
      suggestSettings:
        result.error.code === StorageErrorCode.DIRECTORY_NOT_FOUND ||
        result.error.code === StorageErrorCode.DIRECTORY_NOT_WRITABLE,
    },
  };
}

/**
 * Handles delete_note result from grid view.
 * On success, the caller should remove the deleted note from the local notes array.
 */
export function handleDeleteNoteFromGridResult(
  result: IpcResult<void>,
): boolean {
  if (result.ok) {
    return true;
  }

  handleError(result.error);
  return false;
}
