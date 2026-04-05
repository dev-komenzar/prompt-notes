// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 3-1
// @task-title: `module:shell`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// module:shell – IPC error types
// Sprint 3 – Tauri v2 (OQ-005 resolved)
// Ref: detail:component_architecture §4.1, OQ-006 (notification TBD)

/**
 * Wraps errors from Tauri IPC invoke calls.
 * Preserves the original command name and underlying cause for diagnostics.
 */
export class IpcError extends Error {
  public readonly name = 'IpcError' as const;

  constructor(
    public readonly command: string,
    public readonly cause: unknown,
    message?: string,
  ) {
    super(message ?? `IPC command "${command}" failed: ${String(cause)}`);
  }
}

/**
 * Thrown when a filename fails client-side validation before IPC dispatch.
 * Rust backend performs authoritative validation; this is defense-in-depth.
 * Ref: detail:storage_fileformat §1.1, §4.7
 */
export class FilenameValidationError extends Error {
  public readonly name = 'FilenameValidationError' as const;

  constructor(public readonly filename: string) {
    super(
      `Invalid filename "${filename}". ` +
      'Expected pattern: YYYY-MM-DDTHHMMSS.md (with optional _N suffix)',
    );
  }
}
