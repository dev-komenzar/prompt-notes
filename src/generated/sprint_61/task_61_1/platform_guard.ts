// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 61-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/plan/implementation_plan.md sprint:61 task:61-1
// @codd-sprint: 61
// @codd-task: 61-1

/**
 * Platform Guard
 *
 * RBC-PLATFORM-1: Linux（バイナリ・Flatpak・NixOS）および macOS（バイナリ・Homebrew Cask）配布必須。
 * Windowsは対象外。Windows固有のコードパスは含まない。
 */

export type SupportedPlatform = 'linux' | 'macos';

export type PlatformInfo = {
  platform: SupportedPlatform;
  defaultNotesDir: string;
  defaultConfigDir: string;
};

/**
 * Returns default directories for the current platform.
 * RBC-STORAGE-4: デフォルト保存ディレクトリ
 *   Linux: ~/.local/share/promptnotes/notes/
 *   macOS: ~/Library/Application Support/promptnotes/notes/
 *
 * Note: In Tauri, the actual path resolution is done by Rust (dirs crate).
 * These constants are used for display and documentation purposes on the frontend.
 */
export const PLATFORM_DEFAULTS = {
  linux: {
    notesDir: '~/.local/share/promptnotes/notes/',
    configDir: '~/.config/promptnotes/',
  },
  macos: {
    notesDir: '~/Library/Application Support/promptnotes/notes/',
    configDir: '~/Library/Application Support/promptnotes/',
  },
} as const satisfies Record<SupportedPlatform, { notesDir: string; configDir: string }>;

/**
 * Detects whether the current platform is supported.
 * Returns the platform identifier or throws if unsupported (Windows, mobile, etc.).
 *
 * RBC-PLATFORM-1: Windowsは対象外。モバイルは対象外。
 */
export function detectSupportedPlatform(): SupportedPlatform {
  const platform = navigator.platform.toLowerCase();

  if (platform.includes('linux')) return 'linux';
  if (platform.includes('mac')) return 'macos';

  // Windows and other unsupported platforms
  throw new Error(
    `[PLATFORM VIOLATION] プラットフォーム "${navigator.platform}" はサポート対象外です。` +
      `PromptNotes は Linux および macOS のみをサポートします。RBC-PLATFORM-1。`,
  );
}

/**
 * Returns keyboard modifier key label appropriate for the platform.
 * Used by the editor module for Cmd+N / Ctrl+N display.
 * RBC-EDITOR-4: macOSはCmd+N、LinuxはCtrl+N
 */
export function getNewNoteModifierLabel(platform: SupportedPlatform): string {
  return platform === 'macos' ? '⌘N' : 'Ctrl+N';
}

/**
 * Returns true if the keyboard event corresponds to the new-note shortcut for the platform.
 * RBC-EDITOR-4: Cmd+N / Ctrl+N で即座に新規ノート作成
 */
export function isNewNoteShortcut(e: KeyboardEvent, platform: SupportedPlatform): boolean {
  if (e.key !== 'n' && e.key !== 'N') return false;
  if (platform === 'macos') return e.metaKey && !e.ctrlKey;
  return e.ctrlKey && !e.metaKey;
}
