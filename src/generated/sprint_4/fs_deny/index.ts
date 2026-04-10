// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 4-1
// @task-title: `fs` プラグイン `deny`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/component_architecture.md
// @generated-by: codd generate --sprint 4 --task 4-1
// @trace: detail:component_architecture §4.1

export { TAURI_PLUGIN_POLICY, POLICY_RATIONALE } from './tauri-plugin-policy';
export type { PluginName, PolicyValue } from './tauri-plugin-policy';

export {
  installIpcBoundaryGuard,
  isIpcBoundaryGuardInstalled,
} from './ipc-boundary-guard';

export {
  installNetworkGuard,
  uninstallNetworkGuard,
  getNetworkViolations,
  clearNetworkViolations,
} from './network-guard';
export type { NetworkViolation } from './network-guard';

export {
  writeTextToClipboard,
  extractBodyFromDocument,
  copyNoteBodyToClipboard,
} from './clipboard-api-adapter';
export type { ClipboardWriteResult } from './clipboard-api-adapter';

export { validateTauriSecurityPolicy } from './validate-tauri-config';
export type {
  TauriConfJson,
  TauriPluginsConfig,
  TauriPluginScope,
  ValidationResult,
} from './validate-tauri-config';
