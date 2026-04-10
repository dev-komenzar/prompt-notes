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
 * Combines settings retrieval with platform-aware directory resolution.
 * Fetches the current settings from the Rust backend, determines the
 * effective notes directory (custom or platform default), and ensures
 * it exists.
 */

import { getSettings } from '../ui_foundation/settings-api';
import { getResolvedNotesDir } from './platform-dirs';
import { resolveAndEnsureNotesDir } from './ensure-dir-command';
import type { EnsureDirResult } from './ensure-dir-command';

export interface ResolvedNotesDirInfo {
  readonly resolvedDir: string;
  readonly isCustom: boolean;
  readonly ensureResult: EnsureDirResult;
}

/**
 * High-level function that:
 * 1. Fetches current app settings (notes_dir) via Tauri IPC
 * 2. Resolves the effective directory using platform defaults as fallback
 * 3. Ensures the directory exists (create_dir_all on backend)
 *
 * This is the primary entry point for frontend code that needs the
 * current notes directory path with existence guarantee.
 */
export async function resolveNotesDirWithSettings(): Promise<ResolvedNotesDirInfo> {
  const settings = await getSettings();
  const customDir = settings.notes_dir && settings.notes_dir.trim().length > 0
    ? settings.notes_dir.trim()
    : null;

  const resolvedDir = getResolvedNotesDir(customDir);
  const isCustom = customDir !== null;

  const ensureResult = await resolveAndEnsureNotesDir({
    customDir,
  });

  return {
    resolvedDir: ensureResult.path,
    isCustom,
    ensureResult,
  };
}
