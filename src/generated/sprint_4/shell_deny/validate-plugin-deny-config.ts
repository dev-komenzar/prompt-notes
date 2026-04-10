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

// trace: sprint_4 > task_4-2 > shell_deny > validate-plugin-deny-config
// description: Validates that tauri.conf.json has shell, http, and clipboard-manager
// plugins set to deny, complementing the fs deny validation from task 4-1.

import { TAURI_PLUGIN_POLICY, type PluginName, type PolicyValue } from '../fs_deny/tauri-plugin-policy';

export interface PluginDenyValidationResult {
  readonly valid: boolean;
  readonly errors: ReadonlyArray<string>;
  readonly checkedPlugins: ReadonlyArray<{
    plugin: PluginName;
    expectedPolicy: PolicyValue;
    actualPolicy: PolicyValue | 'missing';
    pass: boolean;
  }>;
}

const DENIED_PLUGINS: ReadonlyArray<PluginName> = ['fs', 'shell', 'http'] as const;

export function validateDeniedPlugins(
  pluginsConfig: Partial<Record<string, { policy?: string }>> | undefined
): PluginDenyValidationResult {
  const errors: string[] = [];
  const checkedPlugins: Array<{
    plugin: PluginName;
    expectedPolicy: PolicyValue;
    actualPolicy: PolicyValue | 'missing';
    pass: boolean;
  }> = [];

  for (const plugin of DENIED_PLUGINS) {
    const expected = TAURI_PLUGIN_POLICY[plugin];
    const entry = pluginsConfig?.[plugin];
    const actual = entry?.policy as PolicyValue | undefined;

    if (!entry || !actual) {
      errors.push(
        `Plugin "${plugin}" is not configured in tauri.conf.json. ` +
        `Expected policy: "${expected}".`
      );
      checkedPlugins.push({ plugin, expectedPolicy: expected, actualPolicy: 'missing', pass: false });
    } else if (actual !== expected) {
      errors.push(
        `Plugin "${plugin}" has policy "${actual}" but expected "${expected}". ` +
        `This is a security violation.`
      );
      checkedPlugins.push({ plugin, expectedPolicy: expected, actualPolicy: actual, pass: false });
    } else {
      checkedPlugins.push({ plugin, expectedPolicy: expected, actualPolicy: actual, pass: true });
    }
  }

  const clipboardPolicy = TAURI_PLUGIN_POLICY['clipboard-manager'];
  const clipboardEntry = pluginsConfig?.['clipboard-manager'];
  if (clipboardEntry) {
    errors.push(
      'Plugin "clipboard-manager" should not be configured. ' +
      'PromptNotes uses browser-standard Clipboard API (navigator.clipboard) instead.'
    );
    checkedPlugins.push({
      plugin: 'clipboard-manager',
      expectedPolicy: clipboardPolicy,
      actualPolicy: (clipboardEntry.policy as PolicyValue) ?? 'missing',
      pass: false,
    });
  } else {
    checkedPlugins.push({
      plugin: 'clipboard-manager',
      expectedPolicy: clipboardPolicy,
      actualPolicy: 'missing',
      pass: true,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    checkedPlugins,
  };
}
