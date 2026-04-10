// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 23-4
// @task-title: config.json`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @traceability: sprint=23, task=23-4, deliverable=config.json Svelte store
import { writable, derived, get } from 'svelte/store';
import { configJsonManager } from './config-json-manager';
import type { ConfigJsonManagerState, ConfigJsonReadResult, ConfigJsonWriteResult } from './config-json-manager';

function createConfigJsonStore() {
  const _state = writable<ConfigJsonManagerState>({
    initialized: false,
    notesDir: '',
    configPath: '',
    lastError: null,
  });

  const _loading = writable(false);

  async function initialize(): Promise<ConfigJsonReadResult> {
    _loading.set(true);
    const result = await configJsonManager.initialize();
    _state.set(configJsonManager.getState());
    _loading.set(false);
    return result;
  }

  async function refresh(): Promise<ConfigJsonReadResult> {
    _loading.set(true);
    const result = await configJsonManager.readNotesDir();
    _state.set(configJsonManager.getState());
    _loading.set(false);
    return result;
  }

  async function setNotesDir(path: string): Promise<ConfigJsonWriteResult> {
    _loading.set(true);
    const result = await configJsonManager.writeNotesDir(path);
    _state.set(configJsonManager.getState());
    _loading.set(false);
    return result;
  }

  async function syncFromSettings(): Promise<ConfigJsonWriteResult> {
    _loading.set(true);
    const result = await configJsonManager.syncFromSettings();
    _state.set(configJsonManager.getState());
    _loading.set(false);
    return result;
  }

  return {
    subscribe: _state.subscribe,
    loading: { subscribe: _loading.subscribe },
    notesDir: derived(_state, ($s) => $s.notesDir),
    configPath: derived(_state, ($s) => $s.configPath),
    initialized: derived(_state, ($s) => $s.initialized),
    lastError: derived(_state, ($s) => $s.lastError),
    initialize,
    refresh,
    setNotesDir,
    syncFromSettings,
    getSnapshot: () => get(_state),
  };
}

export const configJsonStore = createConfigJsonStore();
