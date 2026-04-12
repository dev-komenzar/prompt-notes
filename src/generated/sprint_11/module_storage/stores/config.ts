// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 11-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd:sprint=11 module:storage — config store
// Holds the resolved notes_dir from Rust backend (config.rs).
// Written only by settings module via IPC; never by direct path manipulation.

import { writable } from 'svelte/store';
import type { AppConfig } from '../types';
import { getConfig, setConfig } from '../ipc';

function createConfigStore() {
  const { subscribe, set, update } = writable<AppConfig | null>(null);

  return {
    subscribe,

    async load(): Promise<void> {
      const config = await getConfig();
      set(config);
    },

    async updateNotesDir(notes_dir: string): Promise<void> {
      const config: AppConfig = { notes_dir };
      await setConfig(config);
      set(config);
    },

    reset(): void {
      set(null);
    },
  };
}

export const configStore = createConfigStore();
