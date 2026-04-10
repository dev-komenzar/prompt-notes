// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 5-2
// @task-title: `AppState` の `manage()` 登録
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/component_architecture.md
// @task: 5-2 AppState の manage() 登録
// @module: module:shell

import type { Settings } from '../project_initialization/types/settings';

/**
 * Represents the Rust-side AppState managed by tauri::Builder.manage().
 * Mirror of src-tauri/src/state.rs AppState struct.
 *
 * AppState holds:
 *  - storage: async Mutex-guarded storage service for .md file CRUD
 *  - settings: async Mutex-guarded settings service for config persistence
 *
 * All #[tauri::command] handlers receive this via tauri::State<'_, AppState>.
 */
export interface AppState {
  readonly notesDir: string;
  readonly settings: Settings;
}

export interface AppStateConfig {
  readonly customNotesDir?: string;
}

export const DEFAULT_NOTES_DIR_LINUX = '~/.local/share/promptnotes/notes/';
export const DEFAULT_NOTES_DIR_MACOS = '~/Library/Application Support/promptnotes/notes/';
export const DEFAULT_CONFIG_DIR_LINUX = '~/.config/promptnotes/config.json';
export const DEFAULT_CONFIG_DIR_MACOS = '~/Library/Application Support/promptnotes/config.json';

export function resolveDefaultNotesDir(platform: 'linux' | 'macos'): string {
  return platform === 'linux' ? DEFAULT_NOTES_DIR_LINUX : DEFAULT_NOTES_DIR_MACOS;
}

export function resolveDefaultConfigPath(platform: 'linux' | 'macos'): string {
  return platform === 'linux' ? DEFAULT_CONFIG_DIR_LINUX : DEFAULT_CONFIG_DIR_MACOS;
}
