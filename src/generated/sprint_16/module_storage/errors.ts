// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 16-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated Sprint 16 — Task 16-1 — module:storage
// CoDD traceability: detail:component_architecture §4.1, OQ-006

/**
 * Base error class for all storage IPC failures.
 * Wraps the raw Tauri invoke rejection with a typed structure.
 */
export class StorageIpcError extends Error {
  override readonly name = "StorageIpcError" as const;
  /** The IPC command that failed */
  readonly command: string;
  /** Raw error payload from Tauri invoke rejection */
  readonly cause: unknown;

  constructor(command: string, cause: unknown) {
    const message =
      cause instanceof Error
        ? cause.message
        : typeof cause === "string"
          ? cause
          : `IPC command "${command}" failed`;
    super(message);
    this.command = command;
    this.cause = cause;
    Object.setPrototypeOf(this, StorageIpcError.prototype);
  }
}

/**
 * Error thrown specifically when delete_note IPC command fails.
 * Separating this allows callers to handle delete failures distinctly
 * (e.g. file-not-found vs permission-denied).
 */
export class DeleteNoteError extends StorageIpcError {
  override readonly name = "DeleteNoteError" as const;
  readonly filename: string;

  constructor(filename: string, cause: unknown) {
    super("delete_note", cause);
    this.filename = filename;
    Object.setPrototypeOf(this, DeleteNoteError.prototype);
  }
}
