// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 4-1
// @task-title: `module:shell`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Trace: sprint:4 task:4-1 module:shell file:ipc.ts
// This is the ONLY file permitted to import @tauri-apps/api invoke.
// All other modules MUST use api.ts wrappers. Direct invoke calls elsewhere are prohibited.

import { invoke } from '@tauri-apps/api/core';
import type { IpcCommandMap, IpcCommandName } from './types';

/**
 * Type-safe invoke wrapper. This function is the sole bridge between the
 * Svelte frontend and the Rust backend. No other code path may call
 * `@tauri-apps/api` invoke directly.
 *
 * @param command - Registered IPC command name (must match a #[tauri::command])
 * @param args    - Command arguments matching the Rust-side parameter struct
 * @returns       - Deserialized response from the Rust backend
 * @throws        - Re-throws Tauri IPC errors with command context
 */
export async function typedInvoke<C extends IpcCommandName>(
  command: C,
  args: IpcCommandMap[C]['args'],
): Promise<IpcCommandMap[C]['response']> {
  try {
    const response = await invoke<IpcCommandMap[C]['response']>(command, args);
    return response;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : String(error);
    throw new IpcError(command, message);
  }
}

/**
 * Structured IPC error with command context for diagnostics.
 */
export class IpcError extends Error {
  public readonly command: IpcCommandName;

  constructor(command: IpcCommandName, cause: string) {
    super(`IPC command "${command}" failed: ${cause}`);
    this.name = 'IpcError';
    this.command = command;
  }
}
