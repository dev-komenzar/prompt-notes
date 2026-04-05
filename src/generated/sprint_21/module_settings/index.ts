// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 21-1
// @task-title: `module:settings`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd:generated sprint=21 task=21-1 module=settings
//
// Public API barrel export for module:settings (frontend).
//
// Usage from Svelte components:
//   import { settingsState, loadConfig, changeNotesDirectory } from '@/generated/sprint_21/module_settings';

// Types
export type { Config, SetConfigParams, SettingsState } from './types';

// IPC wrappers
export { getConfig, setConfig } from './api';

// Native dialog
export { openDirectoryPicker } from './dialog';

// Svelte store & actions
export {
  settingsState,
  loadConfig,
  changeNotesDirectory,
  setNotesDirectory,
  resetSettingsState,
} from './store';

// Error classes
export {
  SettingsError,
  GetConfigError,
  SetConfigError,
  DirectoryPickerCancelledError,
} from './errors';
