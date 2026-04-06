// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 65-1
// @task-title: 解決マイルストーン
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=65, task=65-1, module=editor+grid+settings
// Error handling utilities for IPC call failures.
// OQ-006: User notification method (toast, inline, dialog) TBD in prototype.
// This module provides structured error types and a handler hook.

/**
 * Categorized IPC error for UI-layer handling.
 */
export interface IPCError {
  /** The IPC command that failed */
  readonly command: string;
  /** Human-readable error message */
  readonly message: string;
  /** Error category for UI routing */
  readonly category: IPCErrorCategory;
  /** Original error object if available */
  readonly cause?: unknown;
}

export type IPCErrorCategory =
  | "file_not_found"
  | "permission_denied"
  | "directory_not_found"
  | "validation_error"
  | "io_error"
  | "unknown";

/**
 * Wraps an IPC call with structured error handling.
 * Catches invoke rejections and maps them to IPCError.
 *
 * @param command - IPC command name (for error context)
 * @param fn - Async function performing the IPC call
 * @returns Result tuple: [data, null] on success, [null, IPCError] on failure
 */
export async function withIPCErrorHandling<T>(
  command: string,
  fn: () => Promise<T>,
): Promise<[T, null] | [null, IPCError]> {
  try {
    const result = await fn();
    return [result, null];
  } catch (err: unknown) {
    const message = extractErrorMessage(err);
    const category = categorizeError(message);
    return [
      null,
      {
        command,
        message,
        category,
        cause: err,
      },
    ];
  }
}

/**
 * Extracts a human-readable message from an unknown error.
 */
function extractErrorMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  if (err !== null && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return "An unknown error occurred";
}

/**
 * Categorizes an error message into a known category for UI handling.
 */
function categorizeError(message: string): IPCErrorCategory {
  const lower = message.toLowerCase();
  if (lower.includes("not found") || lower.includes("no such file")) {
    return "file_not_found";
  }
  if (lower.includes("permission") || lower.includes("access denied")) {
    return "permission_denied";
  }
  if (lower.includes("directory") && lower.includes("not")) {
    return "directory_not_found";
  }
  if (lower.includes("invalid") || lower.includes("validation")) {
    return "validation_error";
  }
  if (lower.includes("io error") || lower.includes("write") || lower.includes("read")) {
    return "io_error";
  }
  return "unknown";
}
