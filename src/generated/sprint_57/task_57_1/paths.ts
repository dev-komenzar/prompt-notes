// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 57-1
// @task-title: 対象プラットフォーム
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=57, task=57-1, deliverable=対象プラットフォーム
// Conventions: module:storage, module:settings — デフォルト保存ディレクトリは
//   Linux: ~/.local/share/promptnotes/notes/、macOS: ~/Library/Application Support/promptnotes/notes/
// Conventions: module:storage, module:settings — 設定変更（保存ディレクトリ）はRustバックエンド経由で永続化。
//   フロントエンド単独でのファイルパス操作は禁止。

import { Platform } from './platform';

/**
 * Platform-specific path configuration.
 *
 * IMPORTANT: These constants are for display/reference purposes only.
 * Actual path resolution and all file I/O MUST go through the Rust backend
 * via Tauri IPC (module:storage / module:settings). The frontend is strictly
 * prohibited from performing direct filesystem access.
 */
export interface PlatformPaths {
  /** Base data directory for PromptNotes (parent of notes/ and config.json). */
  readonly baseDir: string;
  /** Default notes storage directory. */
  readonly notesDir: string;
  /** Configuration file path. */
  readonly configFile: string;
}

/**
 * Display-only default paths per platform.
 * These are used in the Settings UI to show users the default directory.
 * The Rust backend (dirs::data_dir()) is the canonical source for actual paths.
 */
export const DEFAULT_PATHS: Readonly<Record<Platform, PlatformPaths>> = {
  [Platform.Linux]: {
    baseDir: '~/.local/share/promptnotes/',
    notesDir: '~/.local/share/promptnotes/notes/',
    configFile: '~/.local/share/promptnotes/config.json',
  },
  [Platform.MacOS]: {
    baseDir: '~/Library/Application Support/promptnotes/',
    notesDir: '~/Library/Application Support/promptnotes/notes/',
    configFile: '~/Library/Application Support/promptnotes/config.json',
  },
} as const;

/**
 * Returns the display-only default paths for the given platform.
 */
export function getDefaultPaths(platform: Platform): PlatformPaths {
  return DEFAULT_PATHS[platform];
}

/**
 * Application name used in path construction (Rust backend canonical).
 */
export const APP_NAME = 'promptnotes' as const;

/**
 * Notes subdirectory name within the base data directory.
 */
export const NOTES_SUBDIR = 'notes' as const;

/**
 * Configuration file name.
 */
export const CONFIG_FILENAME = 'config.json' as const;
