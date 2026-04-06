// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 56-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=56, task=56-1, milestone=スコープ外機能の不存在確認, module=settings

/**
 * Settings Module Scope Validator
 *
 * Validates that module:settings complies with:
 * - AC-SE-01: Directory change capability
 * - CONV-2: Settings changes via Rust backend only
 * - No direct filesystem access from frontend
 * - Settings scope limited to notes_dir only
 */

import type {
  ScopeComplianceResult,
  ScopeViolation,
} from '../scope_manifest';

export interface SettingsDOMInspectionTarget {
  readonly querySelectorAll: (selector: string) => ArrayLike<unknown>;
  readonly querySelector: (selector: string) => unknown | null;
}

/**
 * Validates that settings UI does not contain out-of-scope configuration options.
 * The only permitted setting is notes_dir (save directory).
 */
export function validateSettingsScopeFromDOM(
  root: SettingsDOMInspectionTarget,
): ScopeComplianceResult {
  const violations: ScopeViolation[] = [];

  // Prohibited: AI-related settings
  const aiSettingSelectors = [
    '[data-testid="ai-settings"]',
    '[data-testid="api-key"]',
    'input[name="api-key"]',
    'input[name="openai-key"]',
    'input[name="anthropic-key"]',
    'input[placeholder*="API"]',
    '.ai-settings',
    '.llm-config',
  ];

  for (const selector of aiSettingSelectors) {
    if (root.querySelectorAll(selector).length > 0) {
      violations.push({
        featureId: 'ai_calling',
        failureId: 'FAIL-30',
        severity: 'release_blocking',
        message: `AI関連設定が検出されました: selector="${selector}"。AI呼び出し機能はスコープ外。`,
        location: 'module:settings DOM',
      });
    }
  }

  // Prohibited: Cloud sync settings
  const cloudSettingSelectors = [
    '[data-testid="cloud-sync"]',
    '[data-testid="sync-settings"]',
    'input[name="sync-url"]',
    'input[name="remote-server"]',
    '.cloud-settings',
    '.sync-toggle',
  ];

  for (const selector of cloudSettingSelectors) {
    if (root.querySelectorAll(selector).length > 0) {
      violations.push({
        featureId: 'cloud_sync',
        failureId: 'FAIL-31',
        severity: 'release_blocking',
        message: `クラウド同期設定が検出されました: selector="${selector}"。クラウド同期はスコープ外。`,
        location: 'module:settings DOM',
      });
    }
  }

  // Prohibited: Database settings
  const dbSettingSelectors = [
    '[data-testid="db-settings"]',
    'input[name="db-path"]',
    'input[name="connection-string"]',
    '.database-settings',
  ];

  for (const selector of dbSettingSelectors) {
    if (root.querySelectorAll(selector).length > 0) {
      violations.push({
        featureId: 'database',
        failureId: 'FAIL-31',
        severity: 'release_blocking',
        message: `データベース設定が検出されました: selector="${selector}"。DB利用はスコープ外。`,
        location: 'module:settings DOM',
      });
    }
  }

  return {
    module: 'settings',
    passed: violations.length === 0,
    violations,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Validates that the config structure only contains permitted fields.
 * Per CONV-FRONTMATTER: config.json should only have notes_dir.
 */
export function validateConfigStructure(
  config: Record<string, unknown>,
): ScopeComplianceResult {
  const violations: ScopeViolation[] = [];

  const permittedKeys = new Set(['notes_dir']);
  const actualKeys = Object.keys(config);

  for (const key of actualKeys) {
    if (!permittedKeys.has(key)) {
      violations.push({
        featureId: 'excess_config_field',
        failureId: 'SCOPE-SETTINGS',
        severity: 'warning',
        message:
          `config.jsonに未認識フィールドが含まれています: "${key}"。` +
          `許可されたフィールド: ${[...permittedKeys].join(', ')}`,
        location: 'config.json',
      });
    }
  }

  if (!actualKeys.includes('notes_dir')) {
    violations.push({
      featureId: 'missing_notes_dir',
      failureId: 'FAIL-23',
      severity: 'release_blocking',
      message: 'config.jsonにnotes_dirフィールドが存在しません。',
      location: 'config.json',
    });
  }

  return {
    module: 'settings',
    passed: violations.length === 0,
    violations,
    timestamp: new Date().toISOString(),
  };
}
