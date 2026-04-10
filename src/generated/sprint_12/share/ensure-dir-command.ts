// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 12-3
// @task-title: share
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
// @task: 12-3

/**
 * Tauri IPC command wrappers for ensuring the notes directory exists.
 * Delegates to Rust backend which performs create_dir_all when the directory
 * does not exist. Frontend never performs direct filesystem access.
 */

import { invoke } from '@tauri-apps/api/core';

export interface EnsureDirResult {
  readonly path: string;
  readonly created: boolean;
  readonly writable: boolean;
}

export interface ResolveAndEnsureParams {
  readonly customDir?: string | null;
}

/**
 * Invokes the Rust backend to resolve the notes directory (applying platform
 * defaults and custom directory override) and ensure it exists via create_dir_all.
 *
 * On Linux: defaults to ~/.local/share/promptnotes/notes/
 * On macOS: defaults to ~/Library/Application Support/promptnotes/notes/
 * Custom directory from settings takes priority when set.
 */
export async function resolveAndEnsureNotesDir(
  params?: ResolveAndEnsureParams
): Promise<EnsureDirResult> {
  const customDir = params?.customDir ?? null;
  return invoke<EnsureDirResult>('resolve_and_ensure_notes_dir', {
    customDir,
  });
}

/**
 * Invokes the Rust backend to ensure a specific directory path exists,
 * creating it with create_dir_all if necessary.
 */
export async function ensureDirectoryExists(dirPath: string): Promise<EnsureDirResult> {
  return invoke<EnsureDirResult>('ensure_directory_exists', {
    dirPath,
  });
}
