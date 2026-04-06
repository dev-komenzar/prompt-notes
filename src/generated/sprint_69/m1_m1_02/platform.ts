// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 69-1
// @task-title: M1（M1-02）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated sprint:69 task:69-1 module:m1_m1_02
// CoDD trace: design:system-design
// Tauri v2 — Platform detection utilities
// Targets: platform:linux, platform:macos (Windows is out of scope)

import type { SupportedPlatform } from './types';

// Tauri v2 exposes platform info via @tauri-apps/api/core (previously @tauri-apps/api/os in v1)
// In v2, os info is accessed through the @tauri-apps/plugin-os plugin.

/**
 * Detect current platform from Tauri v2 os plugin.
 * Returns 'linux' or 'macos'. Throws if platform is unsupported (e.g. Windows).
 *
 * Tauri v2 requires @tauri-apps/plugin-os to be registered in Rust main.rs:
 *   .plugin(tauri_plugin_os::init())
 * And capability permission: "os:default"
 */
export async function detectPlatform(): Promise<SupportedPlatform> {
  // Dynamic import to avoid bundling issues if plugin is not present at build time
  const { platform } = await import('@tauri-apps/plugin-os');
  const os = platform();

  switch (os) {
    case 'linux':
      return 'linux';
    case 'macos':
      return 'macos';
    default:
      throw new Error(
        `Unsupported platform: "${os}". PromptNotes targets Linux and macOS only. ` +
        `Windows support is out of scope (see design:system-design §2.6).`
      );
  }
}

/**
 * Modifier key label for the current platform.
 * Used in UI hints (e.g. "Cmd+N" vs "Ctrl+N").
 * CodeMirror 6 handles Mod → Cmd/Ctrl mapping internally via keymap,
 * so this is only for display purposes.
 */
export function modifierKeyLabel(plat: SupportedPlatform): string {
  return plat === 'macos' ? 'Cmd' : 'Ctrl';
}

/**
 * Expected default notes directory per platform.
 * Actual resolution uses Rust dirs::data_dir(). This is for display/validation only.
 */
export function defaultNotesDir(plat: SupportedPlatform): string {
  switch (plat) {
    case 'linux':
      return '~/.local/share/promptnotes/notes/';
    case 'macos':
      return '~/Library/Application Support/promptnotes/notes/';
  }
}
