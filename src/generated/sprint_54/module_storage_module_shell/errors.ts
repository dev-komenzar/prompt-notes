// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 54-1
// @task-title: `module:storage`, `module:shell`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Trace: sprint=54, task=54-1, modules=storage+shell, node=detail:component_architecture
// Typed error handling for IPC operations.

/** Base error for all IPC-related failures */
export class IpcError extends Error {
  public readonly command: string;
  public readonly cause?: unknown;

  constructor(command: string, message: string, cause?: unknown) {
    super(`[IPC:${command}] ${message}`);
    this.name = 'IpcError';
    this.command = command;
    this.cause = cause;
  }
}

/** Filename failed security validation before IPC dispatch */
export class FilenameValidationError extends Error {
  public readonly filename: string;

  constructor(filename: string) {
    super(
      `Filename "${filename}" rejected by client-side validation. ` +
      `Expected pattern: YYYY-MM-DDTHHMMSS.md or YYYY-MM-DDTHHMMSS_N.md`
    );
    this.name = 'FilenameValidationError';
    this.filename = filename;
  }
}

/** Directory path failed security validation */
export class PathValidationError extends Error {
  public readonly path: string;

  constructor(path: string, reason: string) {
    super(`Path "${path}" rejected: ${reason}`);
    this.name = 'PathValidationError';
    this.path = path;
  }
}

/** Storage operation failed on the Rust backend */
export class StorageError extends IpcError {
  constructor(command: string, message: string, cause?: unknown) {
    super(command, message, cause);
    this.name = 'StorageError';
  }
}
