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

// CoDD Traceability: sprint=56, task=56-1, milestone=スコープ外機能の不存在確認, module=framework

/**
 * Framework Scope Validator
 *
 * Validates that the application framework complies with:
 * - CONV-1 / ADR-001: Tauri (Rust + WebView) is the confirmed framework
 * - FAIL-42: Application must be built on Tauri
 * - No Electron, Wails, Neutralino, or other frameworks
 */

import type {
  ScopeComplianceResult,
  ScopeViolation,
} from '../scope_manifest';

/**
 * Validates that no prohibited framework dependencies are present.
 */
export function validateFrameworkDependencies(
  installedPackages: ReadonlySet<string>,
): ScopeComplianceResult {
  const violations: ScopeViolation[] = [];

  // Tauri must be present
  const requiredTauriPackages = ['@tauri-apps/api'];

  for (const pkg of requiredTauriPackages) {
    if (!installedPackages.has(pkg)) {
      violations.push({
        featureId: 'missing_tauri',
        failureId: 'FAIL-42',
        severity: 'release_blocking',
        message: `必須Tauriパッケージが不足: ${pkg}。Tauri（Rust + WebView）は確定済みフレームワーク。`,
        location: 'package.json / node_modules',
      });
    }
  }

  // Prohibited frameworks
  const prohibitedFrameworkPackages: ReadonlyArray<{
    name: string;
    framework: string;
  }> = [
    { name: 'electron', framework: 'Electron' },
    { name: 'electron-builder', framework: 'Electron' },
    { name: '@electron/remote', framework: 'Electron' },
    { name: 'electron-store', framework: 'Electron' },
    { name: 'electron-is-dev', framework: 'Electron' },
    { name: '@aspect-build/rules_electron', framework: 'Electron' },
    { name: '@aspect-build/rules_js', framework: 'Electron' },
    { name: '@aspect-build/rules_ts', framework: 'Electron' },
    { name: 'neutralinojs', framework: 'Neutralino' },
    { name: '@aspect-build/rules_go', framework: 'Wails' },
    { name: '@aspect-build/rules_rust', framework: 'Wails' },
    { name: 'nw', framework: 'NW.js' },
    { name: 'nw-builder', framework: 'NW.js' },
    { name: '@aspect-build/rules_flutter', framework: 'Flutter' },
    { name: 'react-native', framework: 'React Native' },
    { name: '@capacitor/core', framework: 'Capacitor' },
    { name: 'cordova', framework: 'Cordova' },
    { name: '@aspect-build/rules_ionic', framework: 'Ionic' },
  ];

  for (const pkg of prohibitedFrameworkPackages) {
    if (installedPackages.has(pkg.name)) {
      violations.push({
        featureId: 'prohibited_framework',
        failureId: 'FAIL-42',
        severity: 'release_blocking',
        message:
          `禁止フレームワークパッケージが検出されました: ${pkg.name} (${pkg.framework})。` +
          `Tauri以外のフレームワークへの変更はリリース不可（CONV-1）。`,
        location: 'package.json / node_modules',
      });
    }
  }

  return {
    module: 'framework',
    passed: violations.length === 0,
    violations,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Validates that IPC boundary is enforced:
 * no direct filesystem access from frontend code.
 */
export function validateIPCBoundaryPatterns(
  sourceCode: string,
  filePath: string,
): ScopeComplianceResult {
  const violations: ScopeViolation[] = [];

  // Skip validation for api.ts — it's the sanctioned IPC wrapper
  if (filePath.endsWith('lib/api.ts') || filePath.endsWith('lib/api.js')) {
    return {
      module: 'framework',
      passed: true,
      violations: [],
      timestamp: new Date().toISOString(),
    };
  }

  // Prohibited: direct invoke calls in component files
  const directInvokePattern =
    /import\s*{[^}]*invoke[^}]*}\s*from\s*['"]@tauri-apps\/api/;
  if (directInvokePattern.test(sourceCode)) {
    violations.push({
      featureId: 'direct_invoke_import',
      failureId: 'CONV-IPC',
      severity: 'release_blocking',
      message:
        `コンポーネント内でのinvokeの直接インポートが検出されました。` +
        `IPC呼び出しはlib/api.ts経由で行うこと。`,
      location: filePath,
    });
  }

  // Prohibited: direct filesystem access from frontend
  const fsAccessPatterns = [
    { pattern: /require\s*\(\s*['"]fs['"]/, label: 'Node.js fs module' },
    {
      pattern: /import\s+.*from\s*['"]fs['"]/,
      label: 'Node.js fs module (ESM)',
    },
    {
      pattern: /import\s+.*from\s*['"]node:fs['"]/,
      label: 'Node.js fs module (node: prefix)',
    },
    {
      pattern: /fetch\s*\(\s*['"]file:\/\//,
      label: 'file:// protocol fetch',
    },
    {
      pattern: /new\s+FileReader\s*\(/,
      label: 'FileReader API (non-upload context)',
    },
  ];

  for (const { pattern, label } of fsAccessPatterns) {
    if (pattern.test(sourceCode)) {
      violations.push({
        featureId: 'direct_fs_access',
        failureId: 'CONV-IPC',
        severity: 'release_blocking',
        message:
          `フロントエンドからの直接ファイルシステムアクセスが検出されました: ${label}。` +
          `全ファイル操作はRustバックエンド経由（Tauri IPC）で行うこと。`,
        location: filePath,
      });
    }
  }

  return {
    module: 'framework',
    passed: violations.length === 0,
    violations,
    timestamp: new Date().toISOString(),
  };
}
