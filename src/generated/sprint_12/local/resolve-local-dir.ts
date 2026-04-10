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
// Traceability: detail:storage_fileformat §4.3, detail:component_architecture §3.3
// Convention NNC-S4: Linux ~/.local/share/promptnotes/notes/, macOS ~/Library/Application Support/promptnotes/notes/

import { resolveNotesDir } from '@/generated/sprint_12/ui_foundation';
import { ensureNotesDir } from './ensure-dir';
import { detectPlatform, defaultNotesDirForPlatform } from './platform';
import type { ResolvedNotesDir } from '@/generated/sprint_12/ui_foundation';
import type { EnsureDirResult } from './ensure-dir';

/**
 * Combines directory resolution with on-disk creation guarantee.
 *
 * Flow (mirrors Rust-side resolve_notes_dir + create_dir_all):
 *  1. If a custom directory is configured via settings, use it.
 *  2. Otherwise, select the OS-specific default:
 *       Linux  → ~/.local/share/promptnotes/notes/
 *       macOS  → ~/Library/Application Support/promptnotes/notes/
 *  3. Ask Rust backend to create the directory if it doesn't exist.
 *
 * All path construction and filesystem mutation happens in the Rust
 * backend (convention NNC-1, NNC-2). This function orchestrates the
 * IPC calls only.
 */
export async function resolveAndEnsureLocalDir(
  customDir?: string,
): Promise<ResolvedNotesDir & { ensured: EnsureDirResult }> {
  // Step 1: Resolve which directory should be used
  const resolved = await resolveNotesDir(customDir);

  // Step 2: Ensure the directory exists on disk (create_dir_all)
  const ensured = await ensureNotesDir(customDir);

  return {
    ...resolved,
    ensured,
  };
}

/**
 * Returns the expected default local path string for the current platform
 * without performing any IPC call. Useful for display in settings UI.
 */
export function getExpectedLocalDefault(): string {
  const platform = detectPlatform();
  return defaultNotesDirForPlatform(platform);
}
