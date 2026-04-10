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
// @description: clipboard-manager は Clipboard API で代替のため不使用 — ポリシー定義

/**
 * clipboard-manager プラグイン不使用ポリシー。
 *
 * Tauri の clipboard-manager プラグインは使用せず、
 * ブラウザ標準の Clipboard API (navigator.clipboard.writeText()) で代替する。
 * これにより IPC を経由せずにクリップボード操作が完結し、
 * ファイルシステム操作を伴わない。
 *
 * 根拠: editor_clipboard_design.md §4.3 — NNC-E3 準拠
 */

export const CLIPBOARD_MANAGER_POLICY = {
  pluginName: 'clipboard-manager' as const,
  status: 'denied' as const,
  alternative: 'navigator.clipboard (Web Clipboard API)' as const,
  reason:
    'clipboard-manager プラグインは Clipboard API（ブラウザ標準）で代替可能であり、' +
    'Tauri プラグインは不使用とする。コピーボタンの実装には navigator.clipboard.writeText() を使用する。',
} as const;

export type ClipboardApiMethod = 'writeText' | 'readText';

export interface ClipboardApiAvailability {
  readonly available: boolean;
  readonly secureContext: boolean;
  readonly writeText: boolean;
  readonly readText: boolean;
}

/**
 * ブラウザ標準 Clipboard API の利用可否を検査する。
 * Tauri WebView はセキュアコンテキストとして扱われるため、
 * navigator.clipboard.writeText() が利用可能である。
 */
export function checkClipboardApiAvailability(): ClipboardApiAvailability {
  const secureContext =
    typeof globalThis !== 'undefined' &&
    typeof (globalThis as Record<string, unknown>).isSecureContext === 'boolean'
      ? !!(globalThis as Record<string, unknown>).isSecureContext
      : false;

  const clipboardExists =
    typeof navigator !== 'undefined' &&
    typeof navigator.clipboard !== 'undefined';

  const writeTextAvailable =
    clipboardExists && typeof navigator.clipboard.writeText === 'function';

  const readTextAvailable =
    clipboardExists && typeof navigator.clipboard.readText === 'function';

  return {
    available: clipboardExists,
    secureContext,
    writeText: writeTextAvailable,
    readText: readTextAvailable,
  };
}
