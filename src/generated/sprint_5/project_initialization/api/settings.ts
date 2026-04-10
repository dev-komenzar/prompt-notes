// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 5-1
// @task-title: `tauri::Builder` 初期化
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/component_architecture.md
// sprint: 5, task: 5-1, module: shell

import { invoke } from '@tauri-apps/api/core';
import { TauriCommands } from '../types/commands';
import type { Settings, UpdateSettingsResult } from '../types/settings';

/**
 * IPC abstraction layer for settings commands.
 * Settings persistence is owned by Rust backend (NNC-2).
 * Frontend only reads/writes via IPC; no direct file path operations.
 */

export async function getSettings(): Promise<Settings> {
  return invoke<Settings>(TauriCommands.GET_SETTINGS);
}

export async function updateSettings(settings: Settings): Promise<UpdateSettingsResult> {
  return invoke<UpdateSettingsResult>(TauriCommands.UPDATE_SETTINGS, {
    notes_dir: settings.notes_dir,
  });
}
