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

// CoDD Trace: sprint=50, task=50-1, module=all, resolves=OQ-006
// Central error handler that routes AppErrors to the toast notification store.
// Provides module-specific handling strategies and logging.

import type { AppError, ErrorSeverity } from '../types/errors';
import { StorageErrorCode } from '../types/errors';
import { toastStore } from './toast-store';

/**
 * Callback type for navigating to settings screen.
 * Injected at app initialization to avoid circular dependencies with App.svelte.
 */
type NavigateToSettingsCallback = () => void;

let navigateToSettings: NavigateToSettingsCallback | null = null;

/**
 * Registers the navigation callback for directing users to the settings screen.
 * Must be called once during app initialization (e.g., in App.svelte onMount).
 */
export function registerSettingsNavigation(callback: NavigateToSettingsCallback): void {
  navigateToSettings = callback;
}

/**
 * Handles an AppError by routing it to the appropriate notification channel.
 *
 * Error handling strategy (OQ-006 resolution):
 * - info/warning: Toast auto-dismisses. No user action required.
 * - error: Toast auto-dismisses after 5s. Logged to console.
 * - critical: Persistent toast with optional action button. Logged to console.error.
 *
 * Special cases:
 * - DIRECTORY_NOT_FOUND / DIRECTORY_NOT_WRITABLE: Persistent toast with "Open Settings" action.
 * - FRONTMATTER_PARSE_ERROR: Silent (warning-level toast). Data is preserved with empty tags.
 * - Auto-save errors: Handled separately by the editor module's status indicator (not routed here).
 */
export function handleError(error: AppError): void {
  // Console logging for all errors
  logToConsole(error);

  // Deduplicate: skip if an identical message is already visible
  // (handled by toast store's max limit, but we add severity-specific behavior)

  // Route to toast notification based on error characteristics
  switch (error.code) {
    case StorageErrorCode.DIRECTORY_NOT_FOUND:
    case StorageErrorCode.DIRECTORY_NOT_WRITABLE:
      toastStore.push({
        message: error.userMessage,
        severity: 'critical',
        durationMs: 0, // persistent
        actionLabel: '設定を開く',
        onAction: () => {
          if (navigateToSettings != null) {
            navigateToSettings();
          }
        },
      });
      break;

    case StorageErrorCode.FRONTMATTER_PARSE_ERROR:
      // Frontmatter parse errors are non-fatal (tags default to []).
      // Show brief warning toast rather than alarming the user.
      toastStore.push({
        message: error.userMessage,
        severity: 'warning',
        durationMs: 3000,
      });
      break;

    case StorageErrorCode.INVALID_FILENAME:
      // Security-related: log prominently but don't expose internals to user
      toastStore.push({
        message: '操作を実行できませんでした。',
        severity: 'error',
      });
      break;

    default:
      toastStore.push({
        message: error.userMessage,
        severity: error.severity,
      });
      break;
  }
}

/**
 * Handles an error specifically for auto-save operations.
 * Returns true if the error is retryable and the caller should attempt retry.
 * Auto-save errors are NOT shown as toast to avoid disrupting writing flow.
 * Instead, the editor status indicator reflects the save state.
 */
export function handleAutoSaveError(error: AppError): boolean {
  logToConsole(error);

  // Critical directory errors should still show a toast even during auto-save
  if (
    error.code === StorageErrorCode.DIRECTORY_NOT_FOUND ||
    error.code === StorageErrorCode.DIRECTORY_NOT_WRITABLE ||
    error.code === StorageErrorCode.PERMISSION_DENIED
  ) {
    handleError(error);
    return false; // not retryable for these
  }

  return error.retryable;
}

/**
 * Console logging with appropriate level based on severity.
 */
function logToConsole(error: AppError): void {
  const logEntry = `[PromptNotes:${error.module}] ${error.message}`;

  const logMap: Record<ErrorSeverity, (msg: string, cause?: unknown) => void> = {
    info: (msg) => console.info(msg),
    warning: (msg) => console.warn(msg),
    error: (msg, cause) => console.error(msg, cause),
    critical: (msg, cause) => console.error(msg, cause),
  };

  logMap[error.severity](logEntry, error.cause);
}
