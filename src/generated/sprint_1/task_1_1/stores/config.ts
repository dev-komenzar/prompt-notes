// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 1-1
// @task-title: 担当モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// Svelte store for application configuration (AppConfig).
// Written by settings module after set_config IPC response and on app startup.
// Consumed by SettingsView and any code that needs to reference notes_dir indirectly.
// The store itself never writes to the filesystem; all writes go through ipc.ts setConfig().

import { writable } from 'svelte/store';
import type { AppConfig } from '../lib/types';

export const configStore = writable<AppConfig | null>(null);
