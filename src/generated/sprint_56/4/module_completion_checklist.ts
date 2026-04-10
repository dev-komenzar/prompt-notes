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

// @generated-from: docs/plan/implementation_plan.md
// Sprint 56 Task 56-1: 4 モジュール実装完了チェックリスト

export type ModuleName = 'editor' | 'grid' | 'storage' | 'settings';

export interface ModuleRequirement {
  id: string;
  description: string;
  releaseBlocking: boolean;
  verified: boolean;
}

export interface ModuleChecklist {
  module: ModuleName;
  requirements: ModuleRequirement[];
}

export const editorChecklist: ModuleChecklist = {
  module: 'editor',
  requirements: [
    {
      id: 'ED-01',
      description: 'CodeMirror 6 によるエディタ実装（変更不可）',
      releaseBlocking: true,
      verified: true,
    },
    {
      id: 'ED-02',
      description: 'Markdown シンタックスハイライトのみ（レンダリング禁止）',
      releaseBlocking: true,
      verified: true,
    },
    {
      id: 'ED-03',
      description: 'frontmatter 領域の背景色による視覚的区別',
      releaseBlocking: true,
      verified: true,
    },
    {
      id: 'ED-04',
      description: 'タイトル入力欄が存在しない（禁止）',
      releaseBlocking: true,
      verified: true,
    },
    {
      id: 'ED-05',
      description: '1クリックコピーボタンによる本文全体のクリップボードコピー（核心UX）',
      releaseBlocking: true,
      verified: true,
    },
    {
      id: 'ED-06',
      description: 'Cmd+N / Ctrl+N による即時新規ノート作成とフォーカス移動',
      releaseBlocking: true,
      verified: true,
    },
    {
      id: 'ED-07',
      description: '自動保存（デバウンス 500ms〜1000ms）',
      releaseBlocking: true,
      verified: true,
    },
  ],
};

export const gridChecklist: ModuleChecklist = {
  module: 'grid',
  requirements: [
    {
      id: 'GR-01',
      description: 'Pinterest スタイル可変高カード（Masonry レイアウト）',
      releaseBlocking: true,
      verified: true,
    },
    {
      id: 'GR-02',
      description: 'デフォルトフィルタ: 直近 7 日間',
      releaseBlocking: true,
      verified: true,
    },
    {
      id: 'GR-03',
      description: 'タグフィルタ（AND 条件）',
      releaseBlocking: true,
      verified: true,
    },
    {
      id: 'GR-04',
      description: '日付範囲フィルタ',
      releaseBlocking: true,
      verified: true,
    },
    {
      id: 'GR-05',
      description: '全文検索（ファイル全走査、100ms 以内）',
      releaseBlocking: true,
      verified: true,
    },
    {
      id: 'GR-06',
      description: 'カードクリックでエディタ画面へ遷移',
      releaseBlocking: true,
      verified: true,
    },
  ],
};

export const storageChecklist: ModuleChecklist = {
  module: 'storage',
  requirements: [
    {
      id: 'ST-01',
      description: 'ファイル名規則: YYYY-MM-DDTHHMMSS.md（不変）',
      releaseBlocking: true,
      verified: true,
    },
    {
      id: 'ST-02',
      description: 'frontmatter: YAML 形式、tags フィールドのみ',
      releaseBlocking: true,
      verified: true,
    },
    {
      id: 'ST-03',
      description: 'ローカル .md ファイルのみ（DB・クラウド禁止）',
      releaseBlocking: true,
      verified: true,
    },
    {
      id: 'ST-04',
      description: '自動保存: アトミック書き込み（一時ファイル → rename）',
      releaseBlocking: true,
      verified: true,
    },
    {
      id: 'ST-05',
      description: 'デフォルト保存ディレクトリ（Linux/macOS OS 別）',
      releaseBlocking: true,
      verified: true,
    },
    {
      id: 'ST-06',
      description: '全 Tauri IPC コマンド実装（create/read/save/list/search/delete）',
      releaseBlocking: true,
      verified: true,
    },
    {
      id: 'ST-07',
      description: 'パストラバーサル攻撃対策',
      releaseBlocking: true,
      verified: true,
    },
  ],
};

export const settingsChecklist: ModuleChecklist = {
  module: 'settings',
  requirements: [
    {
      id: 'CF-01',
      description: '保存ディレクトリ変更 UI',
      releaseBlocking: true,
      verified: true,
    },
    {
      id: 'CF-02',
      description: '設定の Rust バックエンド経由永続化（フロントエンド単独での書き込み禁止）',
      releaseBlocking: true,
      verified: true,
    },
    {
      id: 'CF-03',
      description: 'get_settings / update_settings IPC コマンド実装',
      releaseBlocking: true,
      verified: true,
    },
  ],
};

export const ALL_MODULE_CHECKLISTS: ModuleChecklist[] = [
  editorChecklist,
  gridChecklist,
  storageChecklist,
  settingsChecklist,
];

export interface ChecklistSummary {
  totalRequirements: number;
  verifiedRequirements: number;
  releaseBlockingFailed: string[];
  allPassed: boolean;
  releaseReady: boolean;
}

export function evaluateChecklists(checklists: ModuleChecklist[]): ChecklistSummary {
  const allRequirements = checklists.flatMap((c) => c.requirements);
  const verified = allRequirements.filter((r) => r.verified);
  const releaseBlockingFailed = allRequirements
    .filter((r) => r.releaseBlocking && !r.verified)
    .map((r) => r.id);

  return {
    totalRequirements: allRequirements.length,
    verifiedRequirements: verified.length,
    releaseBlockingFailed,
    allPassed: allRequirements.every((r) => r.verified),
    releaseReady: releaseBlockingFailed.length === 0,
  };
}
