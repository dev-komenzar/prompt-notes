// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 56-1
// @task-title: 4 モジュール実装完了
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/test/acceptance_criteria.md
// Sprint 56 Task 56-1: E2E テストカバレッジ定義

export interface E2ETestSpec {
  file: string;
  domain: string;
  level: 'api' | 'browser';
  acceptanceCriteriaIds: string[];
  failureCriteriaIds: string[];
  required: boolean;
}

export const E2E_TEST_SPECS: E2ETestSpec[] = [
  {
    file: 'tests/e2e/editor.spec.ts',
    domain: 'editor',
    level: 'api',
    acceptanceCriteriaIds: ['AC-ED-04', 'AC-ED-05', 'AC-ED-06'],
    failureCriteriaIds: [],
    required: true,
  },
  {
    file: 'tests/e2e/editor.browser.spec.ts',
    domain: 'editor',
    level: 'browser',
    acceptanceCriteriaIds: ['AC-ED-01', 'AC-ED-02', 'AC-ED-03', 'AC-ED-04', 'AC-ED-05', 'AC-ED-06'],
    failureCriteriaIds: ['FC-ED-01', 'FC-ED-02', 'FC-ED-03', 'FC-ED-04', 'FC-ED-05'],
    required: true,
  },
  {
    file: 'tests/e2e/storage.spec.ts',
    domain: 'storage',
    level: 'api',
    acceptanceCriteriaIds: ['AC-ST-01', 'AC-ST-02', 'AC-ST-03', 'AC-ST-04'],
    failureCriteriaIds: ['FC-ST-01', 'FC-ST-02', 'FC-ST-03'],
    required: true,
  },
  {
    file: 'tests/e2e/storage.browser.spec.ts',
    domain: 'storage',
    level: 'browser',
    acceptanceCriteriaIds: ['AC-ST-04'],
    failureCriteriaIds: [],
    required: true,
  },
  {
    file: 'tests/e2e/grid.spec.ts',
    domain: 'grid',
    level: 'api',
    acceptanceCriteriaIds: ['AC-GR-01', 'AC-GR-02', 'AC-GR-03', 'AC-GR-04'],
    failureCriteriaIds: ['FC-GR-01', 'FC-GR-02', 'FC-GR-03'],
    required: true,
  },
  {
    file: 'tests/e2e/grid.browser.spec.ts',
    domain: 'grid',
    level: 'browser',
    acceptanceCriteriaIds: ['AC-GR-01', 'AC-GR-02', 'AC-GR-03', 'AC-GR-04', 'AC-GR-05'],
    failureCriteriaIds: ['FC-GR-04'],
    required: true,
  },
  {
    file: 'tests/e2e/settings.spec.ts',
    domain: 'settings',
    level: 'api',
    acceptanceCriteriaIds: ['AC-CF-01'],
    failureCriteriaIds: [],
    required: true,
  },
  {
    file: 'tests/e2e/settings.browser.spec.ts',
    domain: 'settings',
    level: 'browser',
    acceptanceCriteriaIds: ['AC-CF-01'],
    failureCriteriaIds: [],
    required: true,
  },
  {
    file: 'tests/e2e/scope-guard.browser.spec.ts',
    domain: 'scope-guard',
    level: 'browser',
    acceptanceCriteriaIds: [],
    failureCriteriaIds: ['FC-SC-01', 'FC-SC-02', 'FC-SC-03', 'FC-ED-01', 'FC-ED-02'],
    required: true,
  },
];

export interface QualityGateResult {
  allSpecsRequired: string[];
  missingSpecs: string[];
  passed: boolean;
}

export function validateE2ECoverage(existingFiles: string[]): QualityGateResult {
  const required = E2E_TEST_SPECS.filter((s) => s.required).map((s) => s.file);
  const missing = required.filter((f) => !existingFiles.includes(f));
  return {
    allSpecsRequired: required,
    missingSpecs: missing,
    passed: missing.length === 0,
  };
}

/** リリースブロッカー: これらのテストが1つでも FAIL なら CI を失敗とする */
export const RELEASE_BLOCKING_TEST_IDS = [
  // editor
  'AC-ED-04', // Cmd+N / Ctrl+N
  'AC-ED-05', // 1クリックコピーボタン
  'FC-ED-01', // CodeMirror 6 以外禁止
  'FC-ED-02', // タイトル欄禁止・プレビュー禁止
  'FC-ED-03', // Cmd+N フォーカス移動
  'FC-ED-04', // コピーボタン存在
  'FC-ED-05', // frontmatter 背景色
  // storage
  'AC-ST-01', // ファイル名規則
  'FC-ST-01', // ファイル名形式違反
  'FC-ST-02', // 自動保存なし
  'FC-ST-03', // tags 以外フィールド禁止
  // grid
  'AC-GR-02', // デフォルト7日間フィルタ
  'FC-GR-01', // 7日間フィルタ未適用
  'FC-GR-02', // タグ/日付フィルタ未実装
  'FC-GR-03', // 全文検索未実装
  'FC-GR-04', // カードクリック遷移なし
  // scope
  'FC-SC-01', // AI 呼び出し混入
  'FC-SC-02', // クラウド同期混入
] as const;
