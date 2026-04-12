// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 15-1
// @task-title: フロントエンド基盤
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/plan/implementation_plan.md sprint:15 task:15-1
// @generated-by: codd implement --sprint 15

import { writable } from 'svelte/store';
import type { AppConfig } from '../lib/types';

/**
 * Application configuration loaded from Rust backend on startup.
 * null until the initial getConfig() IPC call resolves in App.svelte onMount.
 *
 * Write rule: only App.svelte (on startup) and SettingsView (after set_config IPC)
 * may call configStore.set(). All other code is read-only.
 *
 * Never store config in localStorage / sessionStorage / IndexedDB (CONV-4).
 */
export const configStore = writable<AppConfig | null>(null);
