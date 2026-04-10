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
// @description: resolve_notes_dir implementation with platform-specific defaults, custom override, and auto-creation

import {
  DEFAULT_NOTES_DIR_LINUX,
  DEFAULT_NOTES_DIR_MACOS,
} from '@/generated/sprint_12/ui_foundation/storage-paths';
import { detectPlatform } from '@/generated/sprint_12/ui_foundation/storage-paths';
import type { SupportedPlatform } from '@/generated/sprint_12/ui_foundation/settings-types';

/**
 * Result of resolving the notes directory on the backend.
 */
export interface ResolveNotesDirResult {
  /** The fully resolved absolute path to the notes directory. */
  readonly notesDir: string;
  /** Whether the directory was freshly created by this call. */
  readonly created: boolean;
  /** The platform that was detected for path resolution. */
  readonly platform: SupportedPlatform;
}

/**
 * Returns the platform-specific default notes directory path.
 *
 * - Linux:  ~/.local/share/promptnotes/notes/
 * - macOS:  ~/Library/Application Support/promptnotes/notes/
 *
 * This is a pure function used for display/placeholder purposes on the frontend.
 * Actual path resolution with HOME expansion happens on the Rust backend.
 */
export function getDefaultNotesDirForPlatform(
  platform: SupportedPlatform,
): string {
  switch (platform) {
    case 'linux':
      return DEFAULT_NOTES_DIR_LINUX;
    case 'macos':
      return DEFAULT_NOTES_DIR_MACOS;
    default: {
      const _exhaustive: never = platform;
      throw new Error(`Unsupported platform: ${_exhaustive}`);
    }
  }
}

/**
 * Determines the effective notes directory given an optional custom directory
 * and the current platform. This mirrors the Rust-side `resolve_notes_dir` logic:
 *
 * ```rust
 * pub fn resolve_notes_dir(custom_dir: Option<&str>) -> PathBuf {
 *     if let Some(dir) = custom_dir {
 *         return PathBuf::from(dir);
 *     }
 *     #[cfg(target_os = "linux")]
 *     { PathBuf::from(home).join(".local/share/promptnotes/notes") }
 *     #[cfg(target_os = "macos")]
 *     { PathBuf::from(home).join("Library/Application Support/promptnotes/notes") }
 * }
 * ```
 *
 * On the frontend this is used only for display. The authoritative resolution
 * and directory creation is performed by the Rust backend via IPC.
 */
export function resolveNotesDirLocal(
  customDir: string | null | undefined,
  platform: SupportedPlatform,
): string {
  if (customDir && customDir.trim().length > 0) {
    return customDir.trim();
  }
  return getDefaultNotesDirForPlatform(platform);
}

/**
 * Returns the current platform's default notes directory.
 * Convenience wrapper that auto-detects platform.
 */
export function getCurrentPlatformDefaultDir(): string {
  const platform = detectPlatform();
  return getDefaultNotesDirForPlatform(platform);
}
