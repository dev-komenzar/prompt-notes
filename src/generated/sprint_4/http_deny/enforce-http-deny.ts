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

// trace: sprint_4 > task_4-3 > enforce-http-deny
// implements: unified http deny enforcement combining plugin policy and runtime interception

import { installHttpPluginGuard, isHttpPluginGuardInstalled } from '../shell_deny/http-plugin-guard';
import { installFetchInterceptor, isFetchInterceptorInstalled } from './fetch-interceptor';

export interface HttpDenyEnforcementStatus {
  readonly pluginGuardInstalled: boolean;
  readonly fetchInterceptorInstalled: boolean;
  readonly fullyEnforced: boolean;
}

/**
 * Installs all HTTP deny enforcement layers:
 * 1. Tauri http plugin guard (from sprint_4/shell_deny)
 * 2. Fetch/XMLHttpRequest interceptor (defense-in-depth)
 *
 * Both layers work together to ensure zero outbound network requests
 * from the WebView process, enforcing the privacy constraint.
 */
export function enforceHttpDeny(): HttpDenyEnforcementStatus {
  installHttpPluginGuard();
  installFetchInterceptor();
  return getHttpDenyEnforcementStatus();
}

/**
 * Returns the current enforcement status of all HTTP deny layers.
 */
export function getHttpDenyEnforcementStatus(): HttpDenyEnforcementStatus {
  const pluginGuardInstalled = isHttpPluginGuardInstalled();
  const fetchInterceptorInstalled = isFetchInterceptorInstalled();
  return Object.freeze({
    pluginGuardInstalled,
    fetchInterceptorInstalled,
    fullyEnforced: pluginGuardInstalled && fetchInterceptorInstalled,
  });
}
