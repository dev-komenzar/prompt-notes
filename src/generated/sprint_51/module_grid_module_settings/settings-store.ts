// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 51-1
// @task-title: `module:grid`, `module:settings`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:51 | task:51-1 | module:settings
// Pure reactive state for the settings view. No side effects or IPC calls.
// Business logic (load config, save config, directory picker) lives in settings-controller.ts.

import { writable } from 'svelte/store';
import type { Config } from './types';

export const settingsConfig = writable<Config | null>(null);
export const settingsLoading = writable<boolean>(false);
export const settingsError = writable<string | null>(null);
export const settingsSaving = writable<boolean>(false);
export const settingsDirChanged = writable<boolean>(false);
