// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 10-1
// @task-title: 完了条件
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/test/acceptance_criteria.md
// @generated-by: codd generate --wave 10

export interface TestFileMapping {
  readonly domain: string;
  readonly apiTestFile: string;
  readonly browserTestFile: string;
}

export const TEST_FILE_MAPPINGS: readonly TestFileMapping[] = [
  {
    domain: 'editor',
    apiTestFile: 'tests/e2e/editor.spec.ts',
    browserTestFile: 'tests/e2e/editor.browser.spec.ts',
  },
  {
    domain: 'storage',
    apiTestFile: 'tests/e2e/storage.spec.ts',
    browserTestFile: 'tests/e2e/storage.browser.spec.ts',
  },
  {
    domain: 'grid',
    apiTestFile: 'tests/e2e/grid.spec.ts',
    browserTestFile: 'tests/e2e/grid.browser.spec.ts',
  },
  {
    domain: 'settings',
    apiTestFile: 'tests/e2e/settings.spec.ts',
    browserTestFile: 'tests/e2e/settings.browser.spec.ts',
  },
  {
    domain: 'scope-guard',
    apiTestFile: '',
    browserTestFile: 'tests/e2e/scope-guard.browser.spec.ts',
  },
] as const;

export interface TestHelperFile {
  readonly path: string;
  readonly responsibility: string;
}

export const TEST_HELPER_FILES: readonly TestHelperFile[] = [
  {
    path: 'tests/e2e/helpers/app-launch.ts',
    responsibility:
      'Tauri 開発サーバー起動・WebView 接続・ヘルスチェック待機',
  },
  {
    path: 'tests/e2e/helpers/test-data.ts',
    responsibility:
      'テスト用 .md ファイルの作成・削除、frontmatter 生成、タイムスタンプ付きファイル名生成',
  },
  {
    path: 'tests/e2e/helpers/assertions.ts',
    responsibility:
      '共通アサーション（ファイル名形式検証、frontmatter パース検証、5xx ガードアサーション）',
  },
  {
    path: 'tests/e2e/helpers/editor.ts',
    responsibility:
      'エディタ操作ヘルパー（CodeMirror への入力、コピーボタンクリック、Cmd+N 送信）',
  },
  {
    path: 'tests/e2e/helpers/grid.ts',
    responsibility:
      'グリッドビュー操作ヘルパー（フィルタ操作、検索入力、カード選択）',
  },
] as const;

export const CRITERIA_TO_TEST_DOMAIN: Record<string, string> = {
  'AC-ED-01': 'editor',
  'AC-ED-02': 'editor',
  'AC-ED-03': 'editor',
  'AC-ED-04': 'editor',
  'AC-ED-05': 'editor',
  'AC-ED-06': 'editor',
  'AC-ST-01': 'storage',
  'AC-ST-02': 'storage',
  'AC-ST-03': 'storage',
  'AC-ST-04': 'storage',
  'AC-GR-01': 'grid',
  'AC-GR-02': 'grid',
  'AC-GR-03': 'grid',
  'AC-GR-04': 'grid',
  'AC-GR-05': 'grid',
  'AC-CF-01': 'settings',
  'AC-DI-01': 'storage',
  'AC-DI-02': 'storage',
  'AC-DV-01': 'storage',
  'AC-DV-02': 'storage',
  'FC-ED-01': 'scope-guard',
  'FC-ED-02': 'scope-guard',
  'FC-ED-03': 'editor',
  'FC-ED-04': 'editor',
  'FC-ED-05': 'editor',
  'FC-ST-01': 'storage',
  'FC-ST-02': 'storage',
  'FC-ST-03': 'storage',
  'FC-GR-01': 'grid',
  'FC-GR-02': 'grid',
  'FC-GR-03': 'grid',
  'FC-GR-04': 'grid',
  'FC-SC-01': 'scope-guard',
  'FC-SC-02': 'scope-guard',
  'FC-SC-03': 'scope-guard',
  'FC-GN-01': 'storage',
  'FC-GN-02': 'storage',
};
