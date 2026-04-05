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
// Core invoke wrapper enforcing the Tauri IPC boundary.
// Convention 3: All file operations MUST go through Rust backend via IPC.
// Convention 16: Frontend↔Rust communication exclusively via Tauri IPC (invoke).
//
// This module is the ONLY location that imports @tauri-apps/api.
// All other frontend code MUST use api.ts functions instead of calling invoke directly.

import { invoke as tauriInvoke } from '@tauri-apps/api/core';
import { ShellIpcError } from './errors';

/**
 * Strips undefined values from an args object before sending to Tauri.
 * Ensures clean serialization for Rust serde deserialization of Option<T> fields.
 */
function stripUndefined(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Type-safe wrapper around Tauri's invoke function.
 * Catches all IPC errors and wraps them in ShellIpcError for uniform handling.
 *
 * @param command - The IPC command name (must match a #[tauri::command] on Rust side)
 * @param args - Optional arguments object. Undefined values are stripped before sending.
 * @returns The deserialized response from the Rust backend
 * @throws ShellIpcError if the IPC call fails
 */
export async function invokeCommand<TResponse>(
  command: string,
  args?: Record<string, unknown>,
): Promise<TResponse> {
  try {
    const cleanedArgs = args ? stripUndefined(args) : undefined;
    const result = await tauriInvoke<TResponse>(command, cleanedArgs);
    return result;
  } catch (error: unknown) {
    throw new ShellIpcError(command, error);
  }
}
