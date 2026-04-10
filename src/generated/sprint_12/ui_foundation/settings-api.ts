// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 12-1
// @task-title: `#[cfg(target_os = "linux")]` で `~
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/component_architecture.md
// @sprint: 12
// @task: 12-1
// Traceability: detail:component_architecture §4.4 フロントエンド IPC 呼び出し層

import { invoke } from '@tauri-apps/api/core';
import type { AppSettings, UpdateSettingsResult } from './settings-types';

/**
 * Retrieve current application settings from the Rust backend.
 * The notes_dir field reflects the resolved directory
 * (custom if set, otherwise OS-specific default).
 */
export async function getSettings(): Promise<AppSettings> {
  return invoke<AppSettings>('get_settings');
}

/**
 * Update application settings via the Rust backend.
 * Path validation (existence check, write permission) is performed
 * exclusively on the Rust side. The frontend must not perform
 * direct filesystem access or path resolution.
 *
 * If the directory does not exist, the Rust backend will create it
 * via create_dir_all before acknowledging success.
 */
export async function updateSettings(settings: AppSettings): Promise<UpdateSettingsResult> {
  return invoke<UpdateSettingsResult>('update_settings', { notesDir: settings.notes_dir });
}
