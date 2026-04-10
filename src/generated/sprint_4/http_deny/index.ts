// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 4-3
// @task-title: `http` プラグイン `deny`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// trace: sprint_4 > task_4-3 > index
// implements: public API surface for http deny module

export { HTTP_DENY_CONFIG, getHttpDenyPermissions } from './http-deny-policy';
export type { HttpDenyScope, HttpPluginDenyConfig } from './http-deny-policy';

export {
  installFetchInterceptor,
  uninstallFetchInterceptor,
  isFetchInterceptorInstalled,
  getFetchViolations,
  clearFetchViolations,
} from './fetch-interceptor';
export type { FetchViolation } from './fetch-interceptor';

export { validateHttpDenyConfig, validateHttpDenyPermissions } from './validate-http-deny';
export type { HttpDenyValidationResult } from './validate-http-deny';

export { enforceHttpDeny, getHttpDenyEnforcementStatus } from './enforce-http-deny';
export type { HttpDenyEnforcementStatus } from './enforce-http-deny';
