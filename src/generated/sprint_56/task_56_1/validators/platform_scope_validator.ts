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

// CoDD Traceability: sprint=56, task=56-1, milestone=スコープ外機能の不存在確認, module=platform

/**
 * Platform Scope Validator
 *
 * Validates platform compliance:
 * - Linux and macOS: required (FAIL-40, FAIL-41)
 * - Windows: out of scope (must not be included as active target)
 * - Mobile (iOS/Android): prohibited (FAIL-32)
 */

import type {
  ScopeComplianceResult,
  ScopeViolation,
} from '../scope_manifest';

export interface TauriConfig {
  readonly bundle?: {
    readonly targets?: readonly string[];
    readonly windows?: unknown;
    readonly macOS?: unknown;
    readonly linux?: unknown;
  };
  readonly build?: {
    readonly targets?: readonly string[];
  };
  [key: string]: unknown;
}

/**
 * Validates that Tauri build configuration does not include
 * prohibited platform targets.
 */
export function validatePlatformTargets(
  config: TauriConfig,
): ScopeComplianceResult {
  const violations: ScopeViolation[] = [];

  const allTargets: string[] = [];

  if (config.bundle?.targets) {
    allTargets.push(
      ...config.bundle.targets.map((t) => t.toLowerCase()),
    );
  }
  if (config.build?.targets) {
    allTargets.push(
      ...config.build.targets.map((t) => t.toLowerCase()),
    );
  }

  // Check for prohibited mobile targets
  const mobilePatterns = [
    'android',
    'ios',
    'mobile',
    'capacitor',
    'cordova',
  ];

  for (const target of allTargets) {
    for (const pattern of mobilePatterns) {
      if (target.includes(pattern)) {
        violations.push({
          featureId: 'mobile_support',
          failureId: 'FAIL-32',
          severity: 'release_blocking',
          message: `モバイルビルドターゲットが検出されました: "${target}"。モバイル対応はスコープ外。`,
          location: 'tauri.conf.json / Cargo.toml',
        });
      }
    }
  }

  return {
    module: 'platform',
    passed: violations.length === 0,
    violations,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Validates that the running platform is supported.
 */
export function validateRuntimePlatform(
  platform: string,
): ScopeComplianceResult {
  const violations: ScopeViolation[] = [];

  const supportedPlatforms = ['linux', 'darwin', 'macos'];
  const normalizedPlatform = platform.toLowerCase();

  if (!supportedPlatforms.includes(normalizedPlatform)) {
    violations.push({
      featureId: 'unsupported_platform',
      failureId: 'FAIL-40',
      severity: 'warning',
      message:
        `現在のプラットフォーム "${platform}" はサポート対象外です。` +
        `対応プラットフォーム: Linux, macOS`,
      location: 'runtime',
    });
  }

  return {
    module: 'platform',
    passed: violations.length === 0,
    violations,
    timestamp: new Date().toISOString(),
  };
}
