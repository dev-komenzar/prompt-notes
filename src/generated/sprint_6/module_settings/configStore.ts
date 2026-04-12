// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 6-1
// @task-title: `module:settings`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/component_architecture.md §3.5
// @sprint: 6, task: 6-1, module: settings
// Svelte writable store for AppConfig. Write access is restricted to settings module and app init.

import { writable } from 'svelte/store';
import type { AppConfig } from './types';
import { getConfig } from './ipc';

export const configStore = writable<AppConfig>({ notes_dir: '' });

/**
 * Load config from Rust backend and populate the store.
 * Call once at app startup (e.g. App.svelte onMount) and after set_config succeeds.
 */
export async function initConfigStore(): Promise<void> {
  const config = await getConfig();
  configStore.set(config);
}
