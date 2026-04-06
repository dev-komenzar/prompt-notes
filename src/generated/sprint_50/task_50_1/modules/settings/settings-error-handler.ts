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

// CoDD Trace: sprint=50, task=50-1, module=settings, resolves=OQ-006
// Settings module error handling: get_config and set_config IPC errors.
// Settings errors are particularly important because a bad notes_dir
// will prevent all note operations from working.

import type { IpcResult } from '../../types/errors';
import { StorageErrorCode } from '../../types/errors';
import { handleError } from '../../lib/error-handler';
import { toastStore } from '../../lib/toast-store';
import type { Config } from '../../lib/api-error-wrapper';

/**
 * Validation result for directory path change.
 */
export interface ConfigUpdateResult {
  readonly success: boolean;
  /** User-facing validation/error message for inline display in settings UI */
  readonly message: string;
}

/**
 * Handles the result of a get_config IPC call.
 *
 * On success: returns the Config object.
 * On error: shows toast and returns a fallback config with empty notes_dir.
 *   The settings UI should detect the empty notes_dir and prompt the user.
 */
export function handleGetConfigResult(
  result: IpcResult<Config>,
): Config {
  if (result.ok) {
    return result.data;
  }

  handleError(result.error);

  // Return fallback config — settings UI will detect empty dir and show guidance
  return { notes_dir: '' };
}

/**
 * Handles the result of a set_config IPC call.
 *
 * For settings changes, we provide detailed inline feedback in addition
 * to toast notifications, because the user is actively in the settings screen
 * and expects immediate validation feedback.
 *
 * On success: shows success toast and returns success result.
 * On error: shows error toast + returns inline error message.
 */
export function handleSetConfigResult(
  result: IpcResult<void>,
): ConfigUpdateResult {
  if (result.ok) {
    toastStore.push({
      message: '保存ディレクトリを変更しました',
      severity: 'info',
      durationMs: 2000,
    });
    return {
      success: true,
      message: '保存ディレクトリを変更しました。',
    };
  }

  handleError(result.error);

  // Provide specific inline messages based on error code
  switch (result.error.code) {
    case StorageErrorCode.INVALID_DIRECTORY:
      return {
        success: false,
        message: '指定されたパスは有効なディレクトリではありません。',
      };
    case StorageErrorCode.DIRECTORY_NOT_FOUND:
      return {
        success: false,
        message: '指定されたディレクトリが存在しません。',
      };
    case StorageErrorCode.DIRECTORY_NOT_WRITABLE:
      return {
        success: false,
        message: '指定されたディレクトリに書き込み権限がありません。',
      };
    case StorageErrorCode.PERMISSION_DENIED:
      return {
        success: false,
        message: 'アクセスが拒否されました。権限を確認してください。',
      };
    case StorageErrorCode.CONFIG_IO_ERROR:
      return {
        success: false,
        message: '設定ファイルの保存に失敗しました。',
      };
    default:
      return {
        success: false,
        message: result.error.userMessage,
      };
  }
}
