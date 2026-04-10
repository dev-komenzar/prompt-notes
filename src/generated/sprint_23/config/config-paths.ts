// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 23-2
// @task-title: .config
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/plan/implementation_plan.md sprint:23 task:23-2
// Tauri IPC による設定ファイルパス定数。
// 実際のファイル I/O は Rust バックエンドが実行する。これらの定数は参照・ドキュメント用途。

export const CONFIG_FILENAME = 'config.json';
export const APP_NAME = 'promptnotes';

// Linux: ~/.config/promptnotes/config.json
export const LINUX_CONFIG_DIR = `~/.config/${APP_NAME}`;
export const LINUX_CONFIG_PATH = `${LINUX_CONFIG_DIR}/${CONFIG_FILENAME}`;

// macOS: ~/Library/Application Support/promptnotes/config.json
export const MACOS_CONFIG_DIR = `~/Library/Application Support/${APP_NAME}`;
export const MACOS_CONFIG_PATH = `${MACOS_CONFIG_DIR}/${CONFIG_FILENAME}`;

// notes_dir デフォルト値（Rust 側の storage::resolve_notes_dir と対応）
export const LINUX_DEFAULT_NOTES_DIR = `~/.local/share/${APP_NAME}/notes`;
export const MACOS_DEFAULT_NOTES_DIR = `~/Library/Application Support/${APP_NAME}/notes`;

export type SupportedPlatform = 'linux' | 'macos';

export function detectPlatform(): SupportedPlatform {
  const p = (navigator.platform ?? '').toLowerCase();
  if (p.includes('mac')) return 'macos';
  return 'linux';
}

export function getConfigDir(platform: SupportedPlatform): string {
  return platform === 'macos' ? MACOS_CONFIG_DIR : LINUX_CONFIG_DIR;
}

export function getConfigPath(platform: SupportedPlatform): string {
  return `${getConfigDir(platform)}/${CONFIG_FILENAME}`;
}

export function getDefaultNotesDir(platform: SupportedPlatform): string {
  return platform === 'macos' ? MACOS_DEFAULT_NOTES_DIR : LINUX_DEFAULT_NOTES_DIR;
}
