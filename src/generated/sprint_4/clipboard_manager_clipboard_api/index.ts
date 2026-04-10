// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 4-4
// @task-title: `clipboard-manager` は Clipboard API で代替のため不使用
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/component_architecture.md
// @generated-by: codd propagate
// @sprint: 4
// @task: 4-4
// @description: clipboard-manager 不使用ポリシー — 公開 API

export {
  CLIPBOARD_MANAGER_POLICY,
  checkClipboardApiAvailability,
  type ClipboardApiAvailability,
  type ClipboardApiMethod,
} from './clipboard-api-policy';

export {
  validateClipboardPolicy,
  type ClipboardPolicyValidationResult,
} from './validate-clipboard-policy';

export {
  enforceClipboardManagerDeny,
  isClipboardManagerDenyEnforced,
  getClipboardManagerViolations,
  clearClipboardManagerViolations,
  type ClipboardManagerViolation,
} from './enforce-clipboard-policy';

export {
  EXPECTED_CLIPBOARD_CONF,
  validateClipboardManagerNotRegistered,
  validateClipboardManagerCrateNotUsed,
  type TauriConfClipboardExpectation,
} from './tauri-conf-clipboard';
