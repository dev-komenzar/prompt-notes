// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 4-4
// @task-title: `clipboard-manager` は Clipboard API で代替のため不使用
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/component_architecture.md
// @generated-by: codd propagate
// @sprint: 4
// @task: 4-4
// @description: clipboard-manager 不使用バリデーション

import {
  CLIPBOARD_MANAGER_POLICY,
  checkClipboardApiAvailability,
  type ClipboardApiAvailability,
} from './clipboard-api-policy';

export interface ClipboardPolicyValidationResult {
  readonly valid: boolean;
  readonly clipboardManagerDenied: boolean;
  readonly clipboardApiAvailable: ClipboardApiAvailability;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * clipboard-manager プラグイン不使用ポリシーのバリデーションを実行する。
 *
 * 検証項目:
 * 1. clipboard-manager プラグインのポリシーが denied であること
 * 2. ブラウザ標準 Clipboard API (writeText) が利用可能であること
 */
export function validateClipboardPolicy(): ClipboardPolicyValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const clipboardManagerDenied = CLIPBOARD_MANAGER_POLICY.status === 'denied';
  if (!clipboardManagerDenied) {
    errors.push(
      'clipboard-manager プラグインが denied に設定されていません。' +
        'Clipboard API で代替するためプラグインは不使用としてください。',
    );
  }

  const apiAvailability = checkClipboardApiAvailability();

  if (!apiAvailability.available) {
    warnings.push(
      'navigator.clipboard が検出されません。' +
        'Tauri WebView 環境での実行時に利用可能になります。',
    );
  }

  if (!apiAvailability.writeText) {
    warnings.push(
      'navigator.clipboard.writeText() が利用不可です。' +
        'セキュアコンテキスト（Tauri WebView）での実行を確認してください。',
    );
  }

  if (!apiAvailability.secureContext) {
    warnings.push(
      'セキュアコンテキストではありません。' +
        'Clipboard API は Tauri WebView（セキュアコンテキスト）での動作を前提としています。',
    );
  }

  return {
    valid: clipboardManagerDenied && errors.length === 0,
    clipboardManagerDenied,
    clipboardApiAvailable: apiAvailability,
    errors,
    warnings,
  };
}
