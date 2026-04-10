// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 23-1
// @task-title: `config.json` の読み書き。Linux: `~
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd:sprint=23 task=23-1 module=settings
// IPC abstraction for get_settings / update_settings.
// Components must NOT call invoke() directly — use this layer.

import { invoke } from '@tauri-apps/api/core';
import type { GetSettingsResult, UpdateSettingsPayload, UpdateSettingsResult } from './settings-types';

export async function getSettings(): Promise<GetSettingsResult> {
  return invoke<GetSettingsResult>('get_settings');
}

export async function updateSettings(payload: UpdateSettingsPayload): Promise<UpdateSettingsResult> {
  return invoke<UpdateSettingsResult>('update_settings', { notesDir: payload.notes_dir });
}
