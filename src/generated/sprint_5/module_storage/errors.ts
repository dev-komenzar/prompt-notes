// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 5-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/storage_fileformat_design.md
// @generated-by: codd implement --sprint 5

/**
 * Mirrors Rust's StorageError enum (src-tauri/src/error.rs).
 * Tauri IPC serializes these as { type: string, message: string }.
 */
export type StorageErrorKind =
  | 'NotFound'
  | 'InvalidFilename'
  | 'MalformedFrontmatter'
  | 'Io'
  | 'DirectoryCreation';

export interface StorageError {
  type: StorageErrorKind;
  message: string;
}

/**
 * Mirrors Rust's ConfigError enum (src-tauri/src/error.rs).
 */
export type ConfigErrorKind =
  | 'ReadFailed'
  | 'WriteFailed'
  | 'ParseFailed'
  | 'InvalidPath';

export interface ConfigError {
  type: ConfigErrorKind;
  message: string;
}

export type AppError = StorageError | ConfigError;

export function isStorageError(err: unknown): err is StorageError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'type' in err &&
    'message' in err &&
    (
      (err as StorageError).type === 'NotFound' ||
      (err as StorageError).type === 'InvalidFilename' ||
      (err as StorageError).type === 'MalformedFrontmatter' ||
      (err as StorageError).type === 'Io' ||
      (err as StorageError).type === 'DirectoryCreation'
    )
  );
}

export function isConfigError(err: unknown): err is ConfigError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'type' in err &&
    'message' in err &&
    (
      (err as ConfigError).type === 'ReadFailed' ||
      (err as ConfigError).type === 'WriteFailed' ||
      (err as ConfigError).type === 'ParseFailed' ||
      (err as ConfigError).type === 'InvalidPath'
    )
  );
}

export function formatError(err: AppError): string {
  return `[${err.type}] ${err.message}`;
}
