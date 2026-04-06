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
// Safe IPC invocation wrapper for Tauri invoke().
// All api.ts functions use this wrapper to ensure consistent error handling.
// Prevents unhandled promise rejections and returns typed IpcResult<T>.

import type { AppModule, IpcResult, IpcSuccess, IpcFailure } from '../types/errors';
import { extractIpcError } from './ipc-error-extractor';

/**
 * Wraps a Tauri IPC invoke() call with error extraction and typed result.
 *
 * Usage in api.ts:
 *   export async function createNote(): Promise<IpcResult<CreateNoteResponse>> {
 *     return safeInvoke('create_note', {}, 'storage', 'create_note');
 *   }
 *
 * All IPC calls go through this single function, ensuring:
 * 1. Errors are always caught (no unhandled rejections)
 * 2. Errors are classified into AppError with module context
 * 3. Callers receive IpcResult<T> and can handle ok/error branches
 *
 * @param command - The Tauri IPC command name (e.g., 'create_note')
 * @param args - Arguments to pass to the command
 * @param module - The module context for error classification
 * @param operation - Human-readable operation name for logging
 */
export async function safeInvoke<T>(
  command: string,
  args: Record<string, unknown>,
  module: AppModule,
  operation: string,
): Promise<IpcResult<T>> {
  try {
    // Tauri's invoke is accessed dynamically to support both:
    // - Runtime in Tauri WebView (where @tauri-apps/api is available)
    // - Unit testing (where invoke can be mocked)
    const { invoke } = await import('@tauri-apps/api/core');
    const data = await invoke<T>(command, args);
    const success: IpcSuccess<T> = { ok: true, data };
    return success;
  } catch (error: unknown) {
    const appError = extractIpcError(error, module, operation);
    const failure: IpcFailure = { ok: false, error: appError };
    return failure;
  }
}

/**
 * Wraps a Tauri IPC invoke() call with automatic error notification.
 * Unlike safeInvoke, this immediately routes errors to the error handler
 * and returns T | null for simpler call sites that just need the data.
 *
 * Usage:
 *   const notes = await invokeWithNotify<NoteEntry[]>(
 *     'list_notes', { from_date, to_date }, 'grid', 'list_notes'
 *   );
 *   if (notes != null) { ... }
 *
 * @returns The result data or null on error (error is auto-notified via toast)
 */
export async function invokeWithNotify<T>(
  command: string,
  args: Record<string, unknown>,
  module: AppModule,
  operation: string,
): Promise<T | null> {
  const result = await safeInvoke<T>(command, args, module, operation);
  if (result.ok) {
    return result.data;
  }
  // Import lazily to avoid circular dependency
  const { handleError } = await import('./error-handler');
  handleError(result.error);
  return null;
}
