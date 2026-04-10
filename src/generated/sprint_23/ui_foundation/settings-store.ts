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
// Svelte writable store that mirrors persisted settings from Rust backend.
// Initialise by calling loadSettings() once at app startup.

import { writable } from 'svelte/store';
import type { Settings } from './settings-types';
import { getSettings, updateSettings } from './settings-api';

const DEFAULT_SETTINGS: Settings = {
  notes_dir: '',
};

export const settings = writable<Settings>({ ...DEFAULT_SETTINGS });

export async function loadSettings(): Promise<void> {
  const result = await getSettings();
  settings.set({ notes_dir: result.notes_dir });
}

export async function saveNotesDir(notesDir: string): Promise<void> {
  const result = await updateSettings({ notes_dir: notesDir });
  if (result.success) {
    settings.update((s) => ({ ...s, notes_dir: notesDir }));
  } else {
    throw new Error('update_settings returned success=false');
  }
}
