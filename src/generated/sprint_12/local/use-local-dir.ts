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
// Traceability: detail:component_architecture §3.2 — settings read-only from storage

import { getSettings } from '@/generated/sprint_12/ui_foundation';
import { resolveAndEnsureLocalDir, getExpectedLocalDefault } from './resolve-local-dir';
import type { ResolvedNotesDir } from '@/generated/sprint_12/ui_foundation';
import type { EnsureDirResult } from './ensure-dir';

export interface LocalDirState {
  loading: boolean;
  error: string | null;
  dir: (ResolvedNotesDir & { ensured: EnsureDirResult }) | null;
}

/**
 * Initialises the local notes directory for the running platform.
 *
 * 1. Reads the persisted settings via IPC (get_settings).
 * 2. If a custom notes_dir is configured, passes it through.
 * 3. Delegates to resolveAndEnsureLocalDir which triggers Rust-side
 *    create_dir_all when the directory is absent.
 *
 * Settings persistence is owned by module:settings (Rust side).
 * Path resolution is owned by module:storage (Rust side).
 * This function is the frontend orchestration glue only.
 */
export async function initLocalNotesDir(): Promise<
  ResolvedNotesDir & { ensured: EnsureDirResult }
> {
  const settings = await getSettings();
  const customDir = settings.notes_dir || undefined;
  return resolveAndEnsureLocalDir(customDir);
}

/**
 * Returns the platform-appropriate default path for display purposes.
 * No IPC call — pure client-side platform detection.
 */
export { getExpectedLocalDefault } from './resolve-local-dir';
