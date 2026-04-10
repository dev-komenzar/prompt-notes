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

// trace: sprint_4 > task_4-3 > http-deny-policy
// implements: tauri.conf.json http plugin deny policy definition

import { TAURI_PLUGIN_POLICY } from '../fs_deny/tauri-plugin-policy';

/**
 * HTTP deny policy scope definition for tauri.conf.json.
 * All outbound network requests from the WebView process are denied
 * at the Tauri plugin level. PromptNotes performs zero network communication
 * per the privacy constraint (NC-3, design:system-design §2.9).
 */
export interface HttpDenyScope {
  readonly url: never[];
}

export interface HttpPluginDenyConfig {
  readonly plugin: 'http';
  readonly policy: 'deny';
  readonly scope: HttpDenyScope;
  readonly rationale: string;
}

export const HTTP_DENY_CONFIG: HttpPluginDenyConfig = Object.freeze({
  plugin: 'http',
  policy: TAURI_PLUGIN_POLICY.http,
  scope: Object.freeze({ url: Object.freeze([]) as never[] }),
  rationale:
    'PromptNotes performs no network communication. All data is stored locally as .md files. Cloud sync, AI calls, and external API access are prohibited by design.',
});

/**
 * Returns the expected tauri.conf.json permissions fragment
 * for the http plugin deny configuration.
 */
export function getHttpDenyPermissions(): ReadonlyArray<string> {
  return Object.freeze(['deny-http-fetch', 'deny-http-request']);
}
