// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 12-2
// @task-title: .local
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/storage_fileformat_design.md
// sprint: 12, task: 12-2 (.local)
// Traceability: detail:storage_fileformat §4.3 — create_dir_all auto-creation

import { invoke } from '@tauri-apps/api/core';

/**
 * Result of ensuring a notes directory exists on disk.
 * Maps to the Rust-side create_dir_all + validation logic.
 */
export interface EnsureDirResult {
  path: string;
  created: boolean;
  writable: boolean;
}

/**
 * Asks the Rust backend to ensure the notes directory exists.
 * If the directory does not exist, the backend calls create_dir_all.
 * All filesystem operations are performed exclusively by the Rust backend
 * (NNC-1: no direct filesystem access from frontend).
 *
 * @param customDir - Optional user-specified directory override.
 *                    When provided, takes priority over OS default.
 */
export async function ensureNotesDir(customDir?: string): Promise<EnsureDirResult> {
  return invoke<EnsureDirResult>('ensure_notes_dir', {
    customDir: customDir ?? null,
  });
}
