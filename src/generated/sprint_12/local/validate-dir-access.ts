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
// @sprint: 12
// @task: 12-2
// @description: IPC wrapper for validating directory write access on the Rust backend

import { invoke } from '@tauri-apps/api/core';
import type { ValidationResult } from '@/generated/sprint_12/ui_foundation/settings-types';

/**
 * Backend response from the validate_notes_dir IPC command.
 */
interface ValidateDirResponse {
  readonly valid: boolean;
  readonly error?: string;
  readonly exists: boolean;
  readonly writable: boolean;
}

/**
 * Validates that a given directory path is usable as a notes directory.
 *
 * Validation is performed entirely on the Rust backend and includes:
 * - Path syntax validation (no path traversal)
 * - Directory existence check
 * - Write permission verification
 *
 * If the directory does not exist but the parent is writable,
 * validation succeeds (create_dir_all will handle creation).
 *
 * The frontend never performs path validation or file system checks directly.
 */
export async function validateDirAccess(
  dirPath: string,
): Promise<ValidationResult> {
  try {
    const response = await invoke<ValidateDirResponse>('validate_notes_dir', {
      path: dirPath,
    });

    if (response.valid) {
      return { valid: true };
    }

    return {
      valid: false,
      error: response.error ?? 'Directory validation failed',
    };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Checks whether a path contains suspicious characters that could
 * indicate a path traversal attempt. This is a lightweight frontend
 * pre-check; the authoritative validation is on the Rust backend.
 */
export function hasPathTraversalRisk(path: string): boolean {
  const normalized = path.replace(/\\/g, '/');
  return normalized.includes('../') || normalized.includes('/..') || normalized === '..';
}
