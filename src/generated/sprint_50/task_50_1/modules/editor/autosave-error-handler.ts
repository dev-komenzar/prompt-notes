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
// Auto-save specific error handling with retry logic and status tracking.
//
// Design Decision (OQ-006):
//   Auto-save errors use a SUBTLE STATUS INDICATOR, not toast notifications.
//   Toasts during typing would disrupt the core "write fast" UX.
//   After max retries are exhausted, a single persistent toast is shown.
//
// Retry Strategy:
//   - Up to 3 retries with exponential backoff (1s, 2s, 4s).
//   - WRITE_FAILED and READ_FAILED are retryable.
//   - DIRECTORY_NOT_FOUND, PERMISSION_DENIED are NOT retryable (immediate toast).

import type { AppError, AutoSaveStatus } from '../../types/errors';
import { StorageErrorCode } from '../../types/errors';
import { handleAutoSaveError } from '../../lib/error-handler';
import { toastStore } from '../../lib/toast-store';

const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1000;

type StatusSubscriber = (status: AutoSaveStatus) => void;

/**
 * Creates an auto-save error handler instance for a single editor session.
 * Each Editor.svelte component creates one instance on mount and disposes on destroy.
 */
export function createAutoSaveErrorHandler() {
  let currentStatus: AutoSaveStatus = { state: 'idle' };
  let retryCount = 0;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  const subscribers = new Set<StatusSubscriber>();

  function notify(): void {
    const snapshot = { ...currentStatus };
    for (const sub of subscribers) {
      sub(snapshot);
    }
  }

  function setStatus(status: AutoSaveStatus): void {
    currentStatus = status;
    notify();
  }

  /**
   * Subscribes to auto-save status changes.
   * Svelte-compatible: returns an unsubscribe function.
   */
  function subscribe(subscriber: StatusSubscriber): () => void {
    subscribers.add(subscriber);
    subscriber({ ...currentStatus });
    return () => {
      subscribers.delete(subscriber);
    };
  }

  /**
   * Called when a save operation starts.
   */
  function onSaveStart(): void {
    setStatus({ state: 'saving' });
  }

  /**
   * Called when a save operation succeeds.
   */
  function onSaveSuccess(): void {
    retryCount = 0;
    if (retryTimer != null) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    setStatus({ state: 'saved', savedAt: Date.now() });
  }

  /**
   * Called when a save operation fails.
   * Returns a retry function if the error is retryable and retries remain,
   * or null if retries are exhausted or the error is non-retryable.
   *
   * @param error - The AppError from the failed save_note IPC call
   * @param retrySaveFn - Callback to re-attempt the save operation
   */
  function onSaveError(
    error: AppError,
    retrySaveFn: () => Promise<void>,
  ): void {
    const shouldRetry = handleAutoSaveError(error);

    if (!shouldRetry) {
      // Non-retryable: show status and stop
      retryCount = 0;
      setStatus({
        state: 'error',
        error,
        retryAttempt: 0,
        maxRetries: MAX_RETRIES,
      });
      return;
    }

    retryCount += 1;

    if (retryCount > MAX_RETRIES) {
      // Retries exhausted: show persistent toast
      retryCount = 0;
      setStatus({
        state: 'error',
        error,
        retryAttempt: MAX_RETRIES,
        maxRetries: MAX_RETRIES,
      });
      toastStore.push({
        message: '自動保存に繰り返し失敗しました。ディスク容量またはディレクトリを確認してください。',
        severity: 'error',
        durationMs: 0, // persistent
      });
      return;
    }

    // Schedule retry with exponential backoff
    const delayMs = BASE_RETRY_DELAY_MS * Math.pow(2, retryCount - 1);
    setStatus({
      state: 'error',
      error,
      retryAttempt: retryCount,
      maxRetries: MAX_RETRIES,
    });

    retryTimer = setTimeout(() => {
      retryTimer = null;
      retrySaveFn();
    }, delayMs);
  }

  /**
   * Cleans up timers. Must be called in onDestroy of Editor.svelte.
   */
  function dispose(): void {
    if (retryTimer != null) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    subscribers.clear();
    retryCount = 0;
  }

  return {
    subscribe,
    onSaveStart,
    onSaveSuccess,
    onSaveError,
    dispose,
  };
}

export type AutoSaveErrorHandler = ReturnType<typeof createAutoSaveErrorHandler>;
