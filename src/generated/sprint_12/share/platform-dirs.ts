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
 * Platform-specific default notes directory constants and resolution logic.
 * Returns ~/.local/share/promptnotes/notes/ on Linux,
 * ~/Library/Application Support/promptnotes/notes/ on macOS.
 * Custom directory setting takes priority when configured.
 * Missing directories are created automatically via Tauri backend (create_dir_all).
 */

import { DEFAULT_NOTES_DIR_LINUX, DEFAULT_NOTES_DIR_MACOS } from '../ui_foundation/storage-paths';
import type { SupportedPlatform } from '../ui_foundation/settings-types';
import { detectPlatform } from '../ui_foundation/storage-paths';

export interface PlatformDirConfig {
  readonly platform: SupportedPlatform;
  readonly defaultDir: string;
  readonly customDir: string | null;
  readonly resolvedDir: string;
}

export function buildPlatformDirConfig(customDir: string | null): PlatformDirConfig {
  const platform = detectPlatform();
  const defaultDir = platform === 'macos'
    ? DEFAULT_NOTES_DIR_MACOS
    : DEFAULT_NOTES_DIR_LINUX;

  const resolvedDir = customDir && customDir.trim().length > 0
    ? customDir.trim()
    : defaultDir;

  return {
    platform,
    defaultDir,
    customDir,
    resolvedDir,
  };
}

export function getResolvedNotesDir(customDir: string | null): string {
  return buildPlatformDirConfig(customDir).resolvedDir;
}
