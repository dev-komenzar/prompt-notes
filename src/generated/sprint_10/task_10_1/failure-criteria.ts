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

import type { FailureCriterion } from './types';

export const EDITOR_FAILURE_CRITERIA: readonly FailureCriterion[] = [
  {
    id: 'FC-ED-01',
    module: 'module:editor',
    description:
      'エディタが CodeMirror 6 以外のエンジン（Monaco, textarea, contenteditable 等）で実装されている。',
  },
  {
    id: 'FC-ED-02',
    module: 'module:editor',
    description:
      'タイトル入力欄が存在する、または Markdown プレビュー（レンダリング）機能が実装されている。',
  },
  {
    id: 'FC-ED-03',
    module: 'module:editor',
    description:
      'Cmd+N / Ctrl+N で新規ノートが作成されない、またはフォーカスがエディタに移動しない。',
  },
  {
    id: 'FC-ED-04',
    module: 'module:editor',
    description:
      '1クリックコピーボタンが存在しない、またはクリックしても本文がクリップボードにコピーされない。',
  },
  {
    id: 'FC-ED-05',
    module: 'module:editor',
    description:
      'frontmatter 領域が背景色で本文と視覚的に区別されていない。',
  },
] as const;

export const STORAGE_FAILURE_CRITERIA: readonly FailureCriterion[] = [
  {
    id: 'FC-ST-01',
    module: 'module:storage',
    description:
      'ファイル名が YYYY-MM-DDTHHMMSS.md 形式に従っていない。',
  },
  {
    id: 'FC-ST-02',
    module: 'module:storage',
    description:
      '自動保存が機能せず、ユーザーが手動で保存操作を行わなければデータが永続化されない。',
  },
  {
    id: 'FC-ST-03',
    module: 'module:storage',
    description:
      'frontmatter に tags 以外のメタデータフィールドが自動挿入される。',
  },
] as const;

export const GRID_FAILURE_CRITERIA: readonly FailureCriterion[] = [
  {
    id: 'FC-GR-01',
    module: 'module:grid',
    description:
      'グリッドビューのデフォルト表示が直近7日間にフィルタされていない。',
  },
  {
    id: 'FC-GR-02',
    module: 'module:grid',
    description:
      'タグフィルタまたは日付フィルタが未実装である。',
  },
  {
    id: 'FC-GR-03',
    module: 'module:grid',
    description: '全文検索が未実装である。',
  },
  {
    id: 'FC-GR-04',
    module: 'module:grid',
    description:
      'カードクリックでエディタ画面に遷移しない。',
  },
] as const;

export const SCOPE_GUARD_FAILURE_CRITERIA: readonly FailureCriterion[] = [
  {
    id: 'FC-SC-01',
    module: 'module:shell',
    description: 'AI 呼び出し機能が実装されている。',
  },
  {
    id: 'FC-SC-02',
    module: 'module:shell',
    description: 'クラウド同期機能が実装されている。',
  },
  {
    id: 'FC-SC-03',
    module: 'module:shell',
    description: 'モバイル対応が含まれている。',
  },
] as const;

export const GENERAL_FAILURE_CRITERIA: readonly FailureCriterion[] = [
  {
    id: 'FC-GN-01',
    module: 'platform:linux',
    description:
      'Linux または macOS でアプリケーションが起動しない。',
  },
  {
    id: 'FC-GN-02',
    module: 'module:shell',
    description:
      'README.md が存在しない、または必須セクション（Download, Usage, Local Development）が欠けている。',
  },
] as const;

export const ALL_FAILURE_CRITERIA: readonly FailureCriterion[] = [
  ...EDITOR_FAILURE_CRITERIA,
  ...STORAGE_FAILURE_CRITERIA,
  ...GRID_FAILURE_CRITERIA,
  ...SCOPE_GUARD_FAILURE_CRITERIA,
  ...GENERAL_FAILURE_CRITERIA,
] as const;
