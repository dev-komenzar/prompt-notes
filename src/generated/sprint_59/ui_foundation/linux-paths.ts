// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 59-1
// @task-title: Linux
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// Generated from Sprint 59 — Task 59-1 (Linux Flatpak パッケージ作成)
// CoDD trace: plan:implementation_plan > detail:storage_fileformat > detail:component_architecture
// Module: ui_foundation | Platform: linux
// Convention: module:storage, module:settings — Default dirs enforced;
//   Linux: ~/.local/share/promptnotes/notes/
//   Settings changes via Rust backend only (no frontend FS access)

import type { LinuxPaths } from './types';
import { FLATPAK_APP_ID } from './types';

const PROMPTNOTES_DIR = 'promptnotes';
const NOTES_SUBDIR = 'notes';
const CONFIG_FILENAME = 'config.json';

/**
 * Compute all relevant Linux paths for PromptNotes, including
 * both standard XDG and Flatpak-sandboxed variants.
 *
 * Standard XDG paths:
 *   Data:   ~/.local/share/promptnotes/
 *   Notes:  ~/.local/share/promptnotes/notes/
 *   Config: ~/.local/share/promptnotes/config.json
 *
 * Flatpak sandbox remaps XDG_DATA_HOME to:
 *   ~/.var/app/<app-id>/data/
 *
 * So Flatpak paths become:
 *   Data:   ~/.var/app/io.github.promptnotes.PromptNotes/data/promptnotes/
 *   Notes:  ~/.var/app/io.github.promptnotes.PromptNotes/data/promptnotes/notes/
 *   Config: ~/.var/app/io.github.promptnotes.PromptNotes/data/promptnotes/config.json
 */
export function computeLinuxPaths(homeDir: string): LinuxPaths {
  const standardData = `${homeDir}/.local/share/${PROMPTNOTES_DIR}`;
  const flatpakData = `${homeDir}/.var/app/${FLATPAK_APP_ID}/data/${PROMPTNOTES_DIR}`;

  return {
    dataDir: standardData,
    notesDir: `${standardData}/${NOTES_SUBDIR}`,
    configFile: `${standardData}/${CONFIG_FILENAME}`,
    flatpakDataDir: flatpakData,
    flatpakNotesDir: `${flatpakData}/${NOTES_SUBDIR}`,
    flatpakConfigFile: `${flatpakData}/${CONFIG_FILENAME}`,
  };
}

/**
 * Resolve the effective notes directory based on runtime environment.
 * When running in a Flatpak sandbox, the XDG_DATA_HOME is automatically
 * remapped by the sandbox runtime, so the application code itself uses
 * the standard XDG path — the sandbox transparently redirects I/O.
 *
 * This function returns the path that the Rust backend (`module:storage`)
 * should use. The actual resolution happens in Rust via the `dirs` crate,
 * which respects XDG_DATA_HOME environment variable (set by Flatpak).
 */
export function resolveEffectiveNotesDir(
  homeDir: string,
  isFlatpak: boolean,
  customNotesDir: string | null
): string {
  if (customNotesDir && customNotesDir.trim().length > 0) {
    return customNotesDir;
  }

  if (isFlatpak) {
    return `${homeDir}/.var/app/${FLATPAK_APP_ID}/data/${PROMPTNOTES_DIR}/${NOTES_SUBDIR}`;
  }

  return `${homeDir}/.local/share/${PROMPTNOTES_DIR}/${NOTES_SUBDIR}`;
}

/**
 * Validate that a given directory path is safe for use as a notes directory.
 * This is a frontend-side preliminary check; the authoritative validation
 * is performed by the Rust backend (module:storage) via set_config IPC.
 *
 * Convention: module:storage, module:settings — Settings changes are
 * persisted via Rust backend only. This function is advisory only.
 */
export function validateNotesDirectoryPath(path: string): {
  valid: boolean;
  reason: string;
} {
  if (!path || path.trim().length === 0) {
    return { valid: false, reason: 'Path cannot be empty' };
  }

  if (!path.startsWith('/')) {
    return { valid: false, reason: 'Path must be absolute (start with /)' };
  }

  if (path.includes('..')) {
    return { valid: false, reason: 'Path must not contain parent directory traversal (..)' };
  }

  const dangerousPaths = ['/', '/bin', '/sbin', '/usr', '/etc', '/proc', '/sys', '/dev', '/boot', '/tmp'];
  if (dangerousPaths.includes(path) || dangerousPaths.includes(path.replace(/\/+$/, ''))) {
    return { valid: false, reason: 'Path must not be a system directory' };
  }

  return { valid: true, reason: '' };
}

/**
 * Generate the XDG desktop file installation path for Flatpak.
 */
export function getDesktopEntryInstallPath(): string {
  return `/app/share/applications/${FLATPAK_APP_ID}.desktop`;
}

/**
 * Generate the AppStream metainfo installation path for Flatpak.
 */
export function getMetainfoInstallPath(): string {
  return `/app/share/metainfo/${FLATPAK_APP_ID}.metainfo.xml`;
}

/**
 * Generate icon installation paths for Flatpak at various sizes.
 */
export function getIconInstallPaths(): Record<string, string> {
  return {
    '128x128': `/app/share/icons/hicolor/128x128/apps/${FLATPAK_APP_ID}.png`,
    '256x256': `/app/share/icons/hicolor/256x256/apps/${FLATPAK_APP_ID}.png`,
    '512x512': `/app/share/icons/hicolor/512x512/apps/${FLATPAK_APP_ID}.png`,
    'scalable': `/app/share/icons/hicolor/scalable/apps/${FLATPAK_APP_ID}.svg`,
  };
}
