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
// CoDD trace: plan:implementation_plan > design:system-design > detail:component_architecture
// Module: ui_foundation | Platform: linux
// Convention: framework:tauri — All filesystem access via Rust backend IPC

import type { PlatformInfo, SupportedPlatform } from './types';
import { FLATPAK_APP_ID } from './types';

/**
 * Detect if the application is running inside a Flatpak sandbox.
 * Flatpak sets FLATPAK_ID environment variable inside the sandbox.
 * This detection is performed via Tauri IPC to avoid direct env access from WebView.
 */
export async function detectFlatpakSandbox(
  invokeBackend: <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>
): Promise<boolean> {
  try {
    const flatpakId = await invokeBackend<string | null>('get_env_var', { name: 'FLATPAK_ID' });
    return flatpakId === FLATPAK_APP_ID;
  } catch {
    return false;
  }
}

/**
 * Detect if running on NixOS by checking for /etc/NIXOS marker.
 * Detection via Tauri IPC backend.
 */
export async function detectNixOS(
  invokeBackend: <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>
): Promise<boolean> {
  try {
    return await invokeBackend<boolean>('check_path_exists', { path: '/etc/NIXOS' });
  } catch {
    return false;
  }
}

/**
 * Determine the current platform. Only linux and macos are supported.
 * Windows detection returns null (unsupported, scope外).
 */
export function parsePlatformFromUserAgent(): SupportedPlatform | null {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('linux')) return 'linux';
  if (ua.includes('mac')) return 'macos';
  return null;
}

/**
 * Resolve data directory paths based on platform and sandbox environment.
 *
 * Flatpak sandbox remaps XDG paths:
 *   Standard:  ~/.local/share/promptnotes/
 *   Flatpak:   ~/.var/app/io.github.promptnotes.PromptNotes/data/promptnotes/
 *
 * macOS uses ~/Library/Application Support/promptnotes/
 */
export function resolveDataPaths(
  platform: SupportedPlatform,
  isFlatpak: boolean,
  homeDir: string
): { dataDir: string; notesDir: string; configFile: string } {
  if (platform === 'macos') {
    const dataDir = `${homeDir}/Library/Application Support/promptnotes`;
    return {
      dataDir,
      notesDir: `${dataDir}/notes`,
      configFile: `${dataDir}/config.json`,
    };
  }

  if (isFlatpak) {
    const dataDir = `${homeDir}/.var/app/${FLATPAK_APP_ID}/data/promptnotes`;
    return {
      dataDir,
      notesDir: `${dataDir}/notes`,
      configFile: `${dataDir}/config.json`,
    };
  }

  const dataDir = `${homeDir}/.local/share/promptnotes`;
  return {
    dataDir,
    notesDir: `${dataDir}/notes`,
    configFile: `${dataDir}/config.json`,
  };
}

/**
 * Gather full platform information via Tauri IPC backend.
 * All filesystem checks are performed on the Rust side (CONV: module:shell, framework:tauri).
 */
export async function detectPlatformInfo(
  invokeBackend: <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>
): Promise<PlatformInfo> {
  const platform = parsePlatformFromUserAgent();
  if (!platform) {
    throw new Error('Unsupported platform. Only Linux and macOS are supported.');
  }

  const isFlatpak = platform === 'linux' ? await detectFlatpakSandbox(invokeBackend) : false;
  const isNixOS = platform === 'linux' ? await detectNixOS(invokeBackend) : false;
  const homeDir = await invokeBackend<string>('get_home_dir');
  const paths = resolveDataPaths(platform, isFlatpak, homeDir);

  return {
    platform,
    isFlatpak,
    isNixOS,
    dataDir: paths.dataDir,
    notesDir: paths.notesDir,
    configFile: paths.configFile,
  };
}
