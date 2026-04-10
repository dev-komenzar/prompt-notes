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

// @traceability: sprint=23, task=23-4, deliverable=config.json module public API
export { ConfigJsonManager, configJsonManager } from './config-json-manager';
export type { ConfigJsonReadResult, ConfigJsonWriteResult, ConfigJsonManagerState } from './config-json-manager';
export { configJsonStore } from './config-json-store';

// Re-export platform-specific path constants for consumers that need them
export {
  CONFIG_FILENAME,
  APP_NAME,
  LINUX_CONFIG_DIR,
  LINUX_CONFIG_PATH,
  MACOS_CONFIG_DIR,
  MACOS_CONFIG_PATH,
  LINUX_DEFAULT_NOTES_DIR,
  MACOS_DEFAULT_NOTES_DIR,
  CONFIG_VERSION,
  getConfigPath,
  getDefaultNotesDir,
  detectPlatform,
} from '../config/config-paths';
