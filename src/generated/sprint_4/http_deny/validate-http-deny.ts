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

// trace: sprint_4 > task_4-3 > validate-http-deny
// implements: validation of http deny configuration in tauri.conf.json

import type { TauriConfJson, ValidationResult } from '../fs_deny/validate-tauri-config';
import { HTTP_DENY_CONFIG, getHttpDenyPermissions } from './http-deny-policy';

export interface HttpDenyValidationResult {
  readonly valid: boolean;
  readonly errors: ReadonlyArray<string>;
  readonly warnings: ReadonlyArray<string>;
}

/**
 * Validates that the tauri.conf.json configuration correctly denies
 * the http plugin. Checks both plugin-level policy and permission entries.
 */
export function validateHttpDenyConfig(config: TauriConfJson): HttpDenyValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const plugins = config?.plugins;
  if (!plugins) {
    errors.push('tauri.conf.json missing "plugins" section. http plugin deny cannot be verified.');
    return Object.freeze({ valid: false, errors: Object.freeze(errors), warnings: Object.freeze(warnings) });
  }

  const httpConfig = (plugins as Record<string, unknown>)['http'];
  if (!httpConfig) {
    warnings.push(
      'http plugin not explicitly configured in tauri.conf.json. Ensure it is not implicitly enabled by any capability.',
    );
  } else {
    const httpObj = httpConfig as Record<string, unknown>;
    if (httpObj['scope'] && Array.isArray(httpObj['scope'])) {
      const scope = httpObj['scope'] as unknown[];
      if (scope.length > 0) {
        errors.push(
          `http plugin scope contains ${scope.length} allowed URL pattern(s). Must be empty (deny all) per privacy constraint.`,
        );
      }
    }
  }

  const security = config?.security;
  if (security) {
    const csp = (security as Record<string, unknown>)['csp'] as string | undefined;
    if (csp) {
      if (csp.includes('connect-src') && !csp.includes("connect-src 'self'")) {
        if (!csp.includes("connect-src 'none'")) {
          warnings.push(
            'CSP connect-src directive may allow outbound connections. Recommend: connect-src \'self\' or connect-src \'none\'.',
          );
        }
      }
    } else {
      warnings.push(
        'No CSP defined in tauri.conf.json security section. Consider adding connect-src restriction.',
      );
    }
  }

  return Object.freeze({
    valid: errors.length === 0,
    errors: Object.freeze(errors),
    warnings: Object.freeze(warnings),
  });
}

/**
 * Validates that all required deny permissions for the http plugin
 * are present in the given permissions array.
 */
export function validateHttpDenyPermissions(permissions: ReadonlyArray<string>): HttpDenyValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const required = getHttpDenyPermissions();

  for (const perm of required) {
    if (!permissions.includes(perm)) {
      errors.push(`Missing required http deny permission: "${perm}".`);
    }
  }

  const httpAllowPerms = permissions.filter(
    (p) => p.startsWith('allow-http') || p.startsWith('http:allow'),
  );
  if (httpAllowPerms.length > 0) {
    errors.push(
      `Found ${httpAllowPerms.length} http allow permission(s) that conflict with deny policy: ${httpAllowPerms.join(', ')}.`,
    );
  }

  return Object.freeze({
    valid: errors.length === 0,
    errors: Object.freeze(errors),
    warnings: Object.freeze(warnings),
  });
}
