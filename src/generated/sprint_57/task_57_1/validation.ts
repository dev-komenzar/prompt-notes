// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 57-1
// @task-title: 対象プラットフォーム
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=57, task=57-1, deliverable=対象プラットフォーム
// Conventions: platform:linux, platform:macos — Linux・macOS対応必須。Windowsは将来対応としスコープ外。
// Conventions: framework:tauri — Tauri（Rust + WebView）アーキテクチャ必須。
// Conventions: module:editor, module:grid, module:storage, module:settings —
//   全必須機能の実装・テスト完了までリリース不可。

import {
  Platform,
  detectPlatform,
  PlatformNotSupportedError,
} from './platform';

/**
 * Module identifiers that are in scope and required for release.
 */
export const REQUIRED_MODULES = [
  'editor',
  'grid',
  'storage',
  'settings',
] as const;

export type RequiredModule = (typeof REQUIRED_MODULES)[number];

/**
 * Module identifiers that are explicitly out of scope.
 * Implementation of any of these is a release-blocking violation.
 */
export const PROHIBITED_MODULES = [
  'ai',
  'cloud-sync',
  'markdown-preview',
  'mobile',
] as const;

export type ProhibitedModule = (typeof PROHIBITED_MODULES)[number];

/**
 * Required framework for the application.
 */
export const REQUIRED_FRAMEWORK = 'tauri' as const;

/**
 * Required editor engine. Any other engine is a release-blocking violation.
 */
export const REQUIRED_EDITOR_ENGINE = 'codemirror6' as const;

/**
 * Required storage mechanism. DB/cloud storage is prohibited.
 */
export const REQUIRED_STORAGE = 'local-md-files' as const;

/**
 * Result of platform validation.
 */
export interface PlatformValidationResult {
  readonly valid: boolean;
  readonly platform: Platform | null;
  readonly errors: readonly string[];
}

/**
 * Validates that the current runtime environment is a supported platform.
 * Returns a structured result rather than throwing.
 */
export function validatePlatform(): PlatformValidationResult {
  const errors: string[] = [];
  const platform = detectPlatform();

  if (platform === null) {
    errors.push(
      'Unsupported platform detected. PromptNotes requires Linux or macOS. ' +
        'Windows is not supported in this release.'
    );
  }

  return {
    valid: errors.length === 0,
    platform,
    errors,
  };
}

/**
 * Enforces platform support at application startup.
 * Throws PlatformNotSupportedError if the current platform is not Linux or macOS.
 */
export function enforcePlatformSupport(): Platform {
  const result = validatePlatform();
  if (!result.valid || result.platform === null) {
    throw new PlatformNotSupportedError(
      result.errors.join('; ') ||
        'Platform validation failed.'
    );
  }
  return result.platform;
}

/**
 * Release-blocking constraint identifiers and their descriptions.
 * Used for programmatic validation and audit logging.
 */
export const RELEASE_BLOCKING_CONSTRAINTS = {
  'RBC-1': {
    module: 'editor' as RequiredModule,
    description:
      'Cmd+N / Ctrl+N 即時新規ノート作成および1クリックコピーボタンはコアUX。未実装ならリリース不可。',
  },
  'RBC-2': {
    module: 'editor' as RequiredModule,
    description:
      'CodeMirror 6 必須。タイトル入力欄禁止・Markdownプレビュー（レンダリング）禁止。実装した場合リリース不可。',
  },
  'RBC-3': {
    module: 'storage' as RequiredModule,
    description:
      'ファイル名規則 YYYY-MM-DDTHHMMSS.md および自動保存は確定済み。違反時リリース不可。',
  },
  'RBC-4': {
    module: 'grid' as RequiredModule,
    description:
      'デフォルト直近7日間フィルタ・タグ/日付フィルタ・全文検索は必須機能。未実装ならリリース不可。',
  },
} as const;

export type ReleaseBlockingConstraintId =
  keyof typeof RELEASE_BLOCKING_CONSTRAINTS;
