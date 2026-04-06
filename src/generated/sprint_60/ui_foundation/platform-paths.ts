// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 60-1
// @task-title: Linux
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=60, task=60-1, module=ui_foundation
// Dependency: detail:storage_fileformat, detail:component_architecture
// Convention: module:storage, module:settings — Default directories per platform
// Convention: module:shell, framework:tauri — All file ops via Rust backend IPC

export type LinuxVariant = 'standard' | 'nixos' | 'flatpak';

export interface PlatformPaths {
  readonly dataDir: string;
  readonly notesDir: string;
  readonly configFile: string;
}

const LINUX_DATA_BASE = '.local/share/promptnotes' as const;
const MACOS_DATA_BASE = 'Library/Application Support/promptnotes' as const;
const NOTES_SUBDIR = 'notes' as const;
const CONFIG_FILENAME = 'config.json' as const;

export function resolveLinuxPaths(homeDir: string): PlatformPaths {
  const dataDir = `${homeDir}/${LINUX_DATA_BASE}`;
  return {
    dataDir,
    notesDir: `${dataDir}/${NOTES_SUBDIR}`,
    configFile: `${dataDir}/${CONFIG_FILENAME}`,
  };
}

export function resolveMacOSPaths(homeDir: string): PlatformPaths {
  const dataDir = `${homeDir}/${MACOS_DATA_BASE}`;
  return {
    dataDir,
    notesDir: `${dataDir}/${NOTES_SUBDIR}`,
    configFile: `${dataDir}/${CONFIG_FILENAME}`,
  };
}

/**
 * XDG Base Directory overrides for NixOS and Flatpak environments.
 * When XDG_DATA_HOME is set (common on NixOS), paths are derived from it
 * instead of the hardcoded ~/.local/share default.
 */
export function resolveXdgPaths(xdgDataHome: string): PlatformPaths {
  const dataDir = `${xdgDataHome}/promptnotes`;
  return {
    dataDir,
    notesDir: `${dataDir}/${NOTES_SUBDIR}`,
    configFile: `${dataDir}/${CONFIG_FILENAME}`,
  };
}

export function detectLinuxVariant(env: Record<string, string | undefined>): LinuxVariant {
  if (env['FLATPAK_ID'] !== undefined) {
    return 'flatpak';
  }
  if (env['NIX_STORE'] !== undefined || env['IN_NIX_SHELL'] !== undefined) {
    return 'nixos';
  }
  return 'standard';
}

/**
 * Resolves platform paths considering environment overrides.
 * NixOS and Flatpak may set XDG_DATA_HOME, which takes precedence.
 * All actual filesystem operations are performed by the Rust backend via IPC;
 * these paths are used for display and configuration validation only.
 */
export function resolveLinuxPathsWithEnv(
  homeDir: string,
  env: Record<string, string | undefined>,
): PlatformPaths {
  const xdgDataHome = env['XDG_DATA_HOME'];
  if (xdgDataHome) {
    return resolveXdgPaths(xdgDataHome);
  }
  return resolveLinuxPaths(homeDir);
}

export const EXPECTED_LINUX_DEFAULT = '~/.local/share/promptnotes/notes/' as const;
export const EXPECTED_MACOS_DEFAULT =
  '~/Library/Application Support/promptnotes/notes/' as const;
