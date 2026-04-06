// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 63-1
// @task-title: Linux, macOS
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated Sprint 63 — Task 63-1 — Linux, macOS smoke test UI foundation
// trace: plan:implementation_plan > design:system-design > detail:storage_fileformat

import type { SupportedPlatform } from './types';

/**
 * Detects the current OS platform.
 * Only linux and macos are supported — Windows is out of scope.
 * Uses Tauri's os-plugin when available, falls back to navigator.userAgent heuristics.
 */
export async function detectPlatform(): Promise<SupportedPlatform> {
  try {
    // Tauri v2 os plugin
    const mod = await import('@tauri-apps/plugin-os');
    const osType = await mod.type();
    if (osType === 'linux') return 'linux';
    if (osType === 'macos') return 'macos';
    throw new Error(`Unsupported platform: ${osType}. Only linux and macos are supported.`);
  } catch {
    // Fallback: userAgent sniffing inside WebView
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('mac')) return 'macos';
    if (ua.includes('linux')) return 'linux';
    throw new Error('Unable to detect platform. Only linux and macos are supported.');
  }
}

/**
 * Returns the expected default notes directory for the given platform.
 * These paths mirror the Rust backend's dirs::data_dir() + "promptnotes/notes/" logic.
 * NOTE: Actual directory resolution is owned by module:storage (Rust). These strings are
 * for display / smoke-test verification only — frontend never constructs file paths for I/O.
 */
export function getExpectedDefaultNotesDir(platform: SupportedPlatform): string {
  switch (platform) {
    case 'linux':
      return '~/.local/share/promptnotes/notes/';
    case 'macos':
      return '~/Library/Application Support/promptnotes/notes/';
  }
}

/**
 * Returns the expected config file path for the given platform.
 * For display / smoke-test verification only.
 */
export function getExpectedConfigPath(platform: SupportedPlatform): string {
  switch (platform) {
    case 'linux':
      return '~/.local/share/promptnotes/config.json';
    case 'macos':
      return '~/Library/Application Support/promptnotes/config.json';
  }
}

/**
 * Returns the keyboard modifier label for the given platform.
 * macOS uses Cmd, Linux uses Ctrl. CodeMirror's "Mod" prefix handles this automatically,
 * but UI labels need the correct string.
 */
export function getModifierLabel(platform: SupportedPlatform): string {
  return platform === 'macos' ? '⌘' : 'Ctrl';
}

/**
 * Expected distribution formats for each platform.
 * Used by smoke tests to verify the correct build artifacts exist.
 */
export function getDistributionFormats(platform: SupportedPlatform): readonly string[] {
  switch (platform) {
    case 'linux':
      return ['AppImage', 'deb', 'Flatpak', 'NixOS'] as const;
    case 'macos':
      return ['dmg', 'Homebrew Cask'] as const;
  }
}
