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

/**
 * Validates that a tauri.conf.json configuration object meets the
 * PromptNotes security policy requirements.
 *
 * This can be used as a build-time or CI check to ensure the Tauri
 * configuration has not been modified to weaken security boundaries.
 */

export interface TauriPluginScope {
  allow?: unknown[];
  deny?: unknown[];
}

export interface TauriPluginsConfig {
  fs?: { scope?: TauriPluginScope } | boolean;
  shell?: { scope?: TauriPluginScope; open?: boolean } | boolean;
  http?: { scope?: TauriPluginScope } | boolean;
  'clipboard-manager'?: unknown;
}

export interface TauriConfJson {
  plugins?: TauriPluginsConfig;
  [key: string]: unknown;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

/**
 * Validates that the Tauri configuration enforces the required security policy:
 * - fs plugin must not grant any allow scopes
 * - shell plugin must not grant open or allow scopes
 * - http plugin must not grant any allow scopes
 * - clipboard-manager plugin should not be present
 *
 * @param config - Parsed tauri.conf.json content, or the `plugins` sub-object.
 */
export function validateTauriSecurityPolicy(config: TauriConfJson): ValidationResult {
  const errors: string[] = [];
  const plugins = config.plugins;

  if (plugins?.fs) {
    if (typeof plugins.fs === 'object' && plugins.fs.scope?.allow && (plugins.fs.scope.allow as unknown[]).length > 0) {
      errors.push(
        'fs plugin has allow scope entries. All file operations must go through #[tauri::command] handlers.',
      );
    }
  }

  if (plugins?.shell) {
    if (typeof plugins.shell === 'object') {
      if (plugins.shell.open === true) {
        errors.push('shell plugin has open=true. External process execution is denied.');
      }
      if (plugins.shell.scope?.allow && (plugins.shell.scope.allow as unknown[]).length > 0) {
        errors.push('shell plugin has allow scope entries. External process execution is denied.');
      }
    }
  }

  if (plugins?.http) {
    if (typeof plugins.http === 'object' && plugins.http.scope?.allow && (plugins.http.scope.allow as unknown[]).length > 0) {
      errors.push(
        'http plugin has allow scope entries. PromptNotes must not perform any network communication.',
      );
    }
  }

  if (plugins?.['clipboard-manager']) {
    errors.push(
      'clipboard-manager plugin is present. Use browser Clipboard API (navigator.clipboard.writeText()) instead.',
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
