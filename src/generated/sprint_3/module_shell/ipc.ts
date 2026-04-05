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

// module:shell – Tauri v2 IPC bridge (INTERNAL – do not import from outside module:shell)
// Sprint 3 – OQ-005 Resolution: Tauri v2 selected
//
// Decision rationale (OQ-005):
//   Tauri v2 has been the stable release since 2024.
//   Key advantages over v1 for PromptNotes:
//     - Permissions-based security model replaces v1 allowlist.
//       Capabilities are declared per-window in src-tauri/capabilities/.
//       fs plugin is NOT granted to the main window, enforcing CONV-1
//       (no direct filesystem access from frontend).
//     - invoke imported from @tauri-apps/api/core (v2 path).
//     - Plugin architecture: dialog → @tauri-apps/plugin-dialog.
//     - Improved IPC performance with reduced serialization overhead.
//
// This file is the ONLY location where @tauri-apps/api/core invoke is imported.
// All other modules MUST use api.ts.
// Ref: detail:component_architecture §3.4, CONV-1, CONV-2

import { invoke as tauriInvoke } from '@tauri-apps/api/core';
import { IpcError } from './errors';

/**
 * Strips undefined values from an args object before IPC serialization.
 * Tauri v2 uses JSON serialization; undefined → omitted so Rust receives None
 * for Option<T> parameters.
 */
function stripUndefined(
  args: Record<string, unknown>,
): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const key of Object.keys(args)) {
    const value = args[key];
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Type-safe Tauri v2 invoke wrapper with automatic error mapping
 * and undefined-stripping for optional IPC parameters.
 *
 * @internal Only api.ts should call this function.
 */
export async function invoke<T>(
  command: string,
  args?: Record<string, unknown>,
): Promise<T> {
  try {
    const cleanedArgs = args ? stripUndefined(args) : undefined;
    return await tauriInvoke<T>(command, cleanedArgs);
  } catch (error: unknown) {
    throw new IpcError(command, error);
  }
}
