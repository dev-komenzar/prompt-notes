// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 65-1
// @task-title: 5 週
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd-sprint: 65 | task: 65-1 | module: settings,storage
// Directory selection via @tauri-apps/plugin-dialog only. No direct path construction. (CONV-4)
// Settings persistence goes through Rust backend set_config. localStorage/IndexedDB forbidden.

import { open } from '@tauri-apps/plugin-dialog';
import { getConfig, setConfig } from '../ipc';
import type { AppConfig } from '../types';

export async function loadConfig(): Promise<AppConfig> {
  return getConfig();
}

export async function selectNotesDirectory(): Promise<string | null> {
  const selected = await open({ directory: true, multiple: false });
  if (typeof selected === 'string') return selected;
  return null;
}

export async function applyNotesDirectory(path: string): Promise<void> {
  await setConfig({ notes_dir: path });
}
