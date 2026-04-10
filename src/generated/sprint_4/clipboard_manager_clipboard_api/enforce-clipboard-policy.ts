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

// @generated-from: docs/detailed_design/editor_clipboard_design.md
// @generated-by: codd propagate
// @sprint: 4
// @task: 4-4
// @description: clipboard-manager プラグイン使用を検出・ブロックするランタイムエンフォーサ

import { CLIPBOARD_MANAGER_POLICY } from './clipboard-api-policy';

export interface ClipboardManagerViolation {
  readonly timestamp: string;
  readonly accessor: string;
  readonly message: string;
}

let violations: ClipboardManagerViolation[] = [];
let enforced = false;

/**
 * clipboard-manager プラグインへのアクセス試行を検出するエンフォーサを設置する。
 *
 * Tauri の clipboard-manager プラグインは window.__TAURI__ 経由でアクセスされるため、
 * 該当プロパティへのアクセスを監視し、違反を記録する。
 */
export function enforceClipboardManagerDeny(): void {
  if (enforced) {
    return;
  }

  if (typeof globalThis === 'undefined') {
    return;
  }

  const win = globalThis as Record<string, unknown>;
  const tauriObj = win.__TAURI__ as Record<string, unknown> | undefined;

  if (tauriObj && typeof tauriObj === 'object') {
    const descriptors: PropertyDescriptor = {
      get() {
        const violation: ClipboardManagerViolation = {
          timestamp: new Date().toISOString(),
          accessor: 'window.__TAURI__.clipboardManager',
          message:
            `${CLIPBOARD_MANAGER_POLICY.pluginName} プラグインへのアクセスは禁止されています。` +
            `代替: ${CLIPBOARD_MANAGER_POLICY.alternative}`,
        };
        violations.push(violation);
        return undefined;
      },
      configurable: true,
      enumerable: false,
    };

    try {
      Object.defineProperty(tauriObj, 'clipboardManager', descriptors);
    } catch {
      // プロパティが既に非構成可能な場合は無視
    }

    try {
      Object.defineProperty(tauriObj, 'clipboard', descriptors);
    } catch {
      // プロパティが既に非構成可能な場合は無視
    }
  }

  enforced = true;
}

/**
 * エンフォーサが設置済みかどうかを返す。
 */
export function isClipboardManagerDenyEnforced(): boolean {
  return enforced;
}

/**
 * 記録された clipboard-manager アクセス違反を取得する。
 */
export function getClipboardManagerViolations(): readonly ClipboardManagerViolation[] {
  return [...violations];
}

/**
 * 記録された違反をクリアする。
 */
export function clearClipboardManagerViolations(): void {
  violations = [];
}
