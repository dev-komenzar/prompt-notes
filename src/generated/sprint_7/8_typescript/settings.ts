// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 7-1
// @task-title: 8 コマンドの TypeScript ラッパー関数が型付きで定義される
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/component_architecture.md
// @generated-by: codd generate --sprint 7

import { invoke } from '@tauri-apps/api/core';
import type { AppSettings, SuccessResult } from './types';

/**
 * Retrieve current application settings from the Rust backend.
 * Settings are persisted in the Tauri standard config path as JSON.
 *   Linux:  ~/.config/promptnotes/config.json
 *   macOS:  ~/Library/Application Support/promptnotes/config.json
 */
export async function getSettings(): Promise<AppSettings> {
  return invoke<AppSettings>('get_settings');
}

/**
 * Update and persist application settings via the Rust backend.
 * Path validation (directory existence, write permissions) is performed server-side.
 * Frontend must not resolve or manipulate file paths directly.
 *
 * @param settings - New settings to persist (currently only notes_dir)
 */
export async function updateSettings(settings: AppSettings): Promise<SuccessResult> {
  return invoke<SuccessResult>('update_settings', { notes_dir: settings.notes_dir });
}
