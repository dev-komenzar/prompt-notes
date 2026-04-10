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
// @description: tauri.conf.json における clipboard-manager プラグイン設定の検証

/**
 * tauri.conf.json の clipboard-manager 関連設定の期待値。
 *
 * component_architecture.md §4.1:
 * 「clipboard-manager プラグイン: コピーボタンの実装に必要なため allow に設定。
 *   ただし、Clipboard API（ブラウザ標準）で代替可能であれば Tauri プラグインは不使用とする。」
 *
 * → Clipboard API で代替するため、clipboard-manager は不使用（プラグイン未登録）。
 */
export interface TauriConfClipboardExpectation {
  readonly pluginRegistered: false;
  readonly reason: string;
}

export const EXPECTED_CLIPBOARD_CONF: TauriConfClipboardExpectation = {
  pluginRegistered: false,
  reason:
    'clipboard-manager プラグインは Clipboard API (navigator.clipboard.writeText()) で代替するため、' +
    'tauri.conf.json への登録は不要。プラグインの依存追加も禁止。',
};

/**
 * tauri.conf.json のプラグイン一覧に clipboard-manager が含まれていないことを検証する。
 *
 * @param pluginNames tauri.conf.json の plugins セクションに登録されたプラグイン名一覧
 * @returns 検証結果
 */
export function validateClipboardManagerNotRegistered(
  pluginNames: readonly string[],
): { valid: boolean; error?: string } {
  const found = pluginNames.some(
    (name) =>
      name === 'clipboard-manager' ||
      name === 'clipboardManager' ||
      name === 'clipboard',
  );

  if (found) {
    return {
      valid: false,
      error:
        'clipboard-manager プラグインが tauri.conf.json に登録されています。' +
        'Clipboard API で代替するためプラグインの登録を削除してください。',
    };
  }

  return { valid: true };
}

/**
 * Cargo.toml の依存関係に tauri-plugin-clipboard-manager が含まれていないことを検証する。
 *
 * @param dependencies Cargo.toml の [dependencies] セクションのクレート名一覧
 * @returns 検証結果
 */
export function validateClipboardManagerCrateNotUsed(
  dependencies: readonly string[],
): { valid: boolean; error?: string } {
  const found = dependencies.some(
    (dep) =>
      dep === 'tauri-plugin-clipboard-manager' ||
      dep.startsWith('tauri-plugin-clipboard'),
  );

  if (found) {
    return {
      valid: false,
      error:
        'tauri-plugin-clipboard-manager クレートが Cargo.toml に含まれています。' +
        'Clipboard API で代替するためクレートの依存を削除してください。',
    };
  }

  return { valid: true };
}
