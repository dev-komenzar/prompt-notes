// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 4-2
// @task-title: `shell` プラグイン `deny`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// trace: sprint_4 > task_4-2 > shell_deny > index
// description: Public API barrel for shell_deny module.

export {
  installShellExecutionGuard,
  isShellExecutionGuardInstalled,
  getShellViolations,
  clearShellViolations,
} from './shell-execution-guard';
export type { ShellViolation } from './shell-execution-guard';

export {
  installHttpPluginGuard,
  isHttpPluginGuardInstalled,
  getHttpPluginViolations,
  clearHttpPluginViolations,
} from './http-plugin-guard';
export type { HttpPluginViolation } from './http-plugin-guard';

export {
  installClipboardManagerDeny,
  isClipboardManagerDenyInstalled,
  getClipboardManagerViolations,
  clearClipboardManagerViolations,
  writeTextToClipboard,
  extractBodyFromDocument,
  copyNoteBodyToClipboard,
} from './clipboard-manager-deny';
export type { ClipboardManagerViolation, ClipboardWriteResult } from './clipboard-manager-deny';

export {
  validateDeniedPlugins,
} from './validate-plugin-deny-config';
export type { PluginDenyValidationResult } from './validate-plugin-deny-config';

export {
  installAllSecurityGuards,
  areAllSecurityGuardsInstalled,
} from './install-all-guards';
