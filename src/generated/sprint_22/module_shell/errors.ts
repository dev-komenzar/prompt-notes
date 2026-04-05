// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 22-1
// @task-title: `module:shell`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=22, task=22-1, module=module:shell
// Error types for Tauri IPC communication failures.
// All IPC errors are wrapped in ShellIpcError to provide uniform
// error handling across the frontend.

/**
 * Error thrown when a Tauri IPC command invocation fails.
 * Wraps the underlying Tauri/Rust error with the command name for diagnostics.
 */
export class ShellIpcError extends Error {
  public readonly command: string;
  public override readonly cause: unknown;

  constructor(command: string, cause: unknown) {
    const detail =
      cause instanceof Error
        ? cause.message
        : typeof cause === 'string'
          ? cause
          : String(cause);
    super(`IPC command "${command}" failed: ${detail}`);
    this.name = 'ShellIpcError';
    this.command = command;
    this.cause = cause;
  }
}
