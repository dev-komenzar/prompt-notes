// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 70-1
// @task-title: M5（M5-02）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated sprint:70 task:70-1 module:m5_m5_02 file:with-error-handling.ts
// IPC Error Handling Wrapper — Utility to wrap Tauri invoke calls with error handling
// Integrates with api.ts IPC wrapper functions per component architecture (lib/api.ts)

import type { InvokeFn } from './types';
import { ErrorHandler, errorHandler as defaultErrorHandler } from './error-handler';

interface SafeInvokeResult<T> {
  readonly ok: true;
  readonly data: T;
}

interface SafeInvokeError {
  readonly ok: false;
  readonly error: unknown;
  readonly notificationId?: string;
}

export type SafeResult<T> = SafeInvokeResult<T> | SafeInvokeError;

/**
 * Wraps a Tauri IPC invoke call with automatic error handling.
 * On failure, the error is classified and routed to the appropriate
 * notification channel (toast, inline, or dialog).
 *
 * @example
 * ```ts
 * const result = await withErrorHandling(invoke, 'save_note', { filename, content });
 * if (result.ok) {
 *   // success
 * }
 * // Error notification was already shown to the user
 * ```
 */
export async function withErrorHandling<T>(
  invoke: InvokeFn,
  command: string,
  args?: Record<string, unknown>,
  handler?: ErrorHandler,
): Promise<SafeResult<T>> {
  const errorHandlerInstance = handler ?? defaultErrorHandler;
  try {
    const data = await invoke<T>(command, args);
    return { ok: true, data };
  } catch (rawError: unknown) {
    const notificationResult = errorHandlerInstance.handleIpcError(command, rawError, args);
    const notificationId = typeof notificationResult === 'string'
      ? notificationResult
      : undefined;
    return { ok: false, error: rawError, notificationId };
  }
}

/**
 * Creates a type-safe IPC invoke wrapper with built-in error handling.
 * Intended for use in lib/api.ts to wrap all IPC commands.
 *
 * @example
 * ```ts
 * import { invoke } from '@tauri-apps/api';
 * const safeInvoke = createSafeInvoker(invoke);
 *
 * export async function createNote() {
 *   return safeInvoke<{ filename: string; path: string }>('create_note');
 * }
 *
 * export async function saveNote(filename: string, content: string) {
 *   return safeInvoke<void>('save_note', { filename, content });
 * }
 * ```
 */
export function createSafeInvoker(
  invoke: InvokeFn,
  handler?: ErrorHandler,
): <T>(command: string, args?: Record<string, unknown>) => Promise<SafeResult<T>> {
  return <T>(command: string, args?: Record<string, unknown>) =>
    withErrorHandling<T>(invoke, command, args, handler);
}

/**
 * Higher-order function that wraps an async IPC call with error handling.
 * Unlike withErrorHandling, this re-throws the error after notification
 * so the caller can choose to handle it further (e.g., for retry logic).
 *
 * @example
 * ```ts
 * const saveNote = wrapIpcCall(
 *   async (filename: string, content: string) => {
 *     await invoke('save_note', { filename, content });
 *   },
 *   'save_note',
 * );
 * ```
 */
export function wrapIpcCall<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  command: string,
  handler?: ErrorHandler,
): (...args: TArgs) => Promise<TResult> {
  const errorHandlerInstance = handler ?? defaultErrorHandler;
  return async (...args: TArgs): Promise<TResult> => {
    try {
      return await fn(...args);
    } catch (rawError: unknown) {
      errorHandlerInstance.handleIpcError(command, rawError);
      throw rawError;
    }
  };
}

/**
 * Wraps an async IPC call and silently handles errors by showing notifications.
 * Returns undefined on failure instead of throwing.
 * Useful for fire-and-forget operations like auto-save.
 */
export function wrapIpcCallSilent<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  command: string,
  handler?: ErrorHandler,
): (...args: TArgs) => Promise<TResult | undefined> {
  const errorHandlerInstance = handler ?? defaultErrorHandler;
  return async (...args: TArgs): Promise<TResult | undefined> => {
    try {
      return await fn(...args);
    } catch (rawError: unknown) {
      errorHandlerInstance.handleIpcError(command, rawError);
      return undefined;
    }
  };
}
