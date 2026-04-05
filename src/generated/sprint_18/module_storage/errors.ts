// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 18-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:18 task:18-1 module:storage
// Typed error wrappers for IPC command failures.

/**
 * Error codes aligned with Rust backend error responses.
 */
export const StorageErrorCode = {
  /** Filename failed regex validation. */
  INVALID_FILENAME: 'INVALID_FILENAME',
  /** Target file was not found on disk. */
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  /** File I/O failure (permission denied, disk full, etc). */
  IO_ERROR: 'IO_ERROR',
  /** Notes directory does not exist or is inaccessible. */
  DIRECTORY_NOT_FOUND: 'DIRECTORY_NOT_FOUND',
  /** Frontmatter YAML parsing failed (non-fatal in Rust, surfaced for diagnostics). */
  FRONTMATTER_PARSE_ERROR: 'FRONTMATTER_PARSE_ERROR',
  /** Generic/unknown IPC error. */
  UNKNOWN: 'UNKNOWN',
} as const;

export type StorageErrorCode =
  (typeof StorageErrorCode)[keyof typeof StorageErrorCode];

/**
 * Structured error from module:storage IPC commands.
 */
export class StorageError extends Error {
  public readonly code: StorageErrorCode;

  constructor(code: StorageErrorCode, message: string) {
    super(message);
    this.name = 'StorageError';
    this.code = code;
  }
}

/**
 * Wraps a raw Tauri IPC error into a typed StorageError.
 * Tauri invoke rejections can be strings or objects depending on
 * how the Rust command returns errors.
 */
export function toStorageError(raw: unknown): StorageError {
  if (raw instanceof StorageError) {
    return raw;
  }

  if (typeof raw === 'string') {
    if (raw.includes('INVALID_FILENAME') || raw.includes('filename')) {
      return new StorageError(StorageErrorCode.INVALID_FILENAME, raw);
    }
    if (raw.includes('not found') || raw.includes('NotFound')) {
      return new StorageError(StorageErrorCode.FILE_NOT_FOUND, raw);
    }
    if (raw.includes('directory')) {
      return new StorageError(StorageErrorCode.DIRECTORY_NOT_FOUND, raw);
    }
    return new StorageError(StorageErrorCode.UNKNOWN, raw);
  }

  if (raw instanceof Error) {
    return new StorageError(StorageErrorCode.UNKNOWN, raw.message);
  }

  return new StorageError(
    StorageErrorCode.UNKNOWN,
    typeof raw === 'object' && raw !== null
      ? JSON.stringify(raw)
      : String(raw),
  );
}
