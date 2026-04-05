// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 11-1
// @task-title: `module:storage`, `module:settings`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=11, task=11-1, modules=[storage,settings]
// Typed error wrappers for IPC operations.
// Notification UX (toast / inline / dialog) is TBD per OQ-006;
// this module provides structured error data for any notification approach.

/**
 * Categories of errors that can originate from module:storage / module:settings IPC.
 */
export const enum StorageErrorKind {
  /** Filename failed regex validation (path traversal attempt) */
  InvalidFilename = 'INVALID_FILENAME',
  /** Target file not found in notes_dir */
  FileNotFound = 'FILE_NOT_FOUND',
  /** File I/O failure (permissions, disk full, etc.) */
  IoError = 'IO_ERROR',
  /** notes_dir does not exist or is not writable */
  DirectoryNotAccessible = 'DIRECTORY_NOT_ACCESSIBLE',
  /** Catch-all for unexpected Tauri IPC errors */
  Unknown = 'UNKNOWN',
}

export interface StorageError {
  readonly kind: StorageErrorKind;
  readonly message: string;
  /** Original error value from the IPC rejection, if available */
  readonly cause?: unknown;
}

/**
 * Wrap an IPC call with structured error handling.
 *
 * Usage:
 * ```ts
 * const result = await wrapIpcCall(() => saveNote(filename, content));
 * if (result.ok) { ... } else { handleError(result.error); }
 * ```
 */
export type IpcResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: StorageError };

export async function wrapIpcCall<T>(
  fn: () => Promise<T>,
): Promise<IpcResult<T>> {
  try {
    const value = await fn();
    return { ok: true, value };
  } catch (err: unknown) {
    return { ok: false, error: classifyError(err) };
  }
}

/**
 * Attempt to classify a Tauri IPC rejection into a StorageErrorKind.
 * Rust commands return string error messages; we pattern-match on known prefixes.
 */
function classifyError(err: unknown): StorageError {
  const message =
    typeof err === 'string'
      ? err
      : err instanceof Error
        ? err.message
        : String(err);

  if (/invalid.*filename/i.test(message) || /path.*traversal/i.test(message)) {
    return { kind: StorageErrorKind.InvalidFilename, message, cause: err };
  }
  if (/not\s*found/i.test(message) || /no\s*such\s*file/i.test(message)) {
    return { kind: StorageErrorKind.FileNotFound, message, cause: err };
  }
  if (/permission/i.test(message) || /access/i.test(message) || /not.*writable/i.test(message)) {
    return { kind: StorageErrorKind.DirectoryNotAccessible, message, cause: err };
  }
  if (/io\s*error/i.test(message) || /disk/i.test(message)) {
    return { kind: StorageErrorKind.IoError, message, cause: err };
  }
  return { kind: StorageErrorKind.Unknown, message, cause: err };
}
