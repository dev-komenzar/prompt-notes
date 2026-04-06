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
// Error type definitions for PromptNotes IPC error handling.
// OQ-006 Decision: Toast notification (non-intrusive) as primary user notification.
// Critical errors use persistent toasts requiring manual dismissal.
// Auto-save errors use a subtle status indicator with automatic retry.

/**
 * Severity levels for error notifications.
 *
 * - info: Informational, auto-dismisses quickly (e.g., "Copied to clipboard")
 * - warning: Recoverable issue, auto-dismisses after longer delay (e.g., "Retrying save...")
 * - error: Operation failed, auto-dismisses but shown prominently (e.g., "Search failed")
 * - critical: Requires user action, persistent until dismissed (e.g., "Notes directory not found")
 */
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Module identifiers matching the PromptNotes module architecture.
 */
export type AppModule = 'editor' | 'grid' | 'storage' | 'settings' | 'shell';

/**
 * Storage-layer error codes returned by the Rust backend via Tauri IPC.
 * These correspond to error variants in the Rust `module:storage` implementation.
 */
export enum StorageErrorCode {
  /** File not found in notes directory */
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  /** Notes directory does not exist or is inaccessible */
  DIRECTORY_NOT_FOUND = 'DIRECTORY_NOT_FOUND',
  /** Permission denied when reading/writing file */
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  /** Disk full or write failure */
  WRITE_FAILED = 'WRITE_FAILED',
  /** File read failure */
  READ_FAILED = 'READ_FAILED',
  /** Invalid filename (path traversal attempt or format violation) */
  INVALID_FILENAME = 'INVALID_FILENAME',
  /** Frontmatter YAML parse error (non-fatal, tags default to []) */
  FRONTMATTER_PARSE_ERROR = 'FRONTMATTER_PARSE_ERROR',
  /** Config file read/write failure */
  CONFIG_IO_ERROR = 'CONFIG_IO_ERROR',
  /** Invalid directory path provided for config */
  INVALID_DIRECTORY = 'INVALID_DIRECTORY',
  /** Directory exists but is not writable */
  DIRECTORY_NOT_WRITABLE = 'DIRECTORY_NOT_WRITABLE',
  /** Unknown/unclassified error */
  UNKNOWN = 'UNKNOWN',
}

/**
 * Structured application error with module context and severity classification.
 */
export interface AppError {
  /** Module where the error originated */
  readonly module: AppModule;
  /** Specific storage error code (if applicable) */
  readonly code: StorageErrorCode;
  /** Human-readable error message for developers/logs */
  readonly message: string;
  /** User-facing message (localized/friendly) */
  readonly userMessage: string;
  /** Severity level determining notification behavior */
  readonly severity: ErrorSeverity;
  /** Whether the operation can be retried */
  readonly retryable: boolean;
  /** Original error from Tauri IPC layer */
  readonly cause?: unknown;
  /** ISO 8601 timestamp of when the error occurred */
  readonly timestamp: string;
}

/**
 * Toast notification item displayed to the user.
 */
export interface ToastNotification {
  /** Unique identifier for this toast instance */
  readonly id: string;
  /** User-facing message */
  readonly message: string;
  /** Severity determines styling and auto-dismiss behavior */
  readonly severity: ErrorSeverity;
  /** Duration in milliseconds before auto-dismiss. 0 = persistent (manual dismiss required) */
  readonly durationMs: number;
  /** Optional action label (e.g., "Open Settings") */
  readonly actionLabel?: string;
  /** Optional callback when action is clicked */
  readonly onAction?: () => void;
  /** Timestamp when the toast was created */
  readonly createdAt: number;
}

/**
 * Result type for IPC operations. Encapsulates success or typed error.
 * All api.ts wrapper functions return this type instead of throwing.
 */
export type IpcResult<T> = IpcSuccess<T> | IpcFailure;

export interface IpcSuccess<T> {
  readonly ok: true;
  readonly data: T;
}

export interface IpcFailure {
  readonly ok: false;
  readonly error: AppError;
}

/**
 * Auto-save status for the editor status indicator.
 * The editor displays a subtle, non-intrusive indicator rather than toast
 * for auto-save state changes to avoid disrupting the writing flow.
 */
export type AutoSaveStatus =
  | { state: 'idle' }
  | { state: 'saving' }
  | { state: 'saved'; savedAt: number }
  | { state: 'error'; error: AppError; retryAttempt: number; maxRetries: number };
