// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 35-2
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/storage_fileformat_design.md
// Config service for notes directory management (module:settings integration).
// All persistence goes through Rust config.rs via IPC — no localStorage/IndexedDB (CONV-4).

import { getConfig, setConfig } from '@/generated/sprint_35/module_grid/ipc';
import type { AppConfig } from '@/generated/sprint_35/module_grid/types';

/**
 * Load current app config from Rust backend.
 */
export async function loadConfig(): Promise<AppConfig> {
  return getConfig();
}

/**
 * Persist a new notes directory path via Rust backend.
 * Existing notes are NOT moved — only the read/write target changes.
 */
export async function updateNotesDir(notesDir: string): Promise<void> {
  await setConfig({ notes_dir: notesDir });
}

/**
 * Platform-aware hint for the default notes directory.
 * Actual default resolution is performed in Rust (dirs::data_dir()).
 * This is display-only for the settings UI.
 */
export function defaultNotesDirHint(): string {
  if (typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac')) {
    return '~/Library/Application Support/promptnotes/notes';
  }
  return '~/.local/share/promptnotes/notes';
}
