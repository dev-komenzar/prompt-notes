// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 48-1
// @task-title: `module:settings` + `module:shell`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd-trace: detail:component_architecture § 3.5 (configStore ownership)

import { writable } from 'svelte/store';
import type { AppConfig } from './types';
import { getConfig } from './ipc';

export const configStore = writable<AppConfig | null>(null);

/**
 * Fetches config from the Rust backend and populates configStore.
 * Called once at app boot and after set_config succeeds.
 */
export async function loadConfig(): Promise<void> {
  const cfg = await getConfig();
  configStore.set(cfg);
}
