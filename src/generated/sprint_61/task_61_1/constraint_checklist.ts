// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 61-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/plan/implementation_plan.md sprint:61 task:61-1
// @codd-sprint: 61
// @codd-task: 61-1

/**
 * Release-Blocking Constraint Checklist
 * All constraints below are release-blocking. Any FAIL = no release.
 */

export type CheckResult = {
  id: string;
  targets: string[];
  description: string;
  status: 'PASS' | 'FAIL' | 'UNCHECKED';
  evidence?: string;
};

export type ConstraintChecklistReport = {
  timestamp: string;
  allPassed: boolean;
  results: CheckResult[];
};

export const RELEASE_BLOCKING_CONSTRAINTS: Omit<CheckResult, 'status' | 'evidence'>[] = [
  {
    id: 'RBC-TAURI-1',
    targets: ['framework:tauri', 'module:shell'],
    description:
      'Tauri (Rust + WebView) アーキテクチャ必須。フロントエンドからの直接ファイルシステムアクセスを禁止。全ファイル操作はRustバックエンド経由。',
  },
  {
    id: 'RBC-TAURI-2',
    targets: ['framework:tauri'],
    description:
      'Tauri IPC経由でのみ invoke を使用。@tauri-apps/plugin-fs の直接インポートは禁止。',
  },
  {
    id: 'RBC-EDITOR-1',
    targets: ['module:editor'],
    description:
      'CodeMirror 6 必須。Markdownシンタックスハイライトのみ（レンダリング禁止）。frontmatter領域は背景色で視覚的に区別必須。',
  },
  {
    id: 'RBC-EDITOR-2',
    targets: ['module:editor'],
    description: 'タイトル入力欄は禁止。本文のみのエディタ画面であること。',
  },
  {
    id: 'RBC-EDITOR-3',
    targets: ['module:editor'],
    description:
      '1クリックコピーボタンによる本文全体のクリップボードコピーはアプリの核心UX。未実装ならリリース不可。',
  },
  {
    id: 'RBC-EDITOR-4',
    targets: ['module:editor'],
    description: 'Cmd+N / Ctrl+N で即座に新規ノート作成しフォーカス移動必須。',
  },
  {
    id: 'RBC-STORAGE-1',
    targets: ['module:storage'],
    description: 'ファイル名は YYYY-MM-DDTHHMMSS.md 形式で確定。作成時タイムスタンプで不変。',
  },
  {
    id: 'RBC-STORAGE-2',
    targets: ['module:storage'],
    description:
      'frontmatter は YAML形式、メタデータは tags のみ。作成日はファイル名から取得。追加フィールドの導入は要件変更が必要。',
  },
  {
    id: 'RBC-STORAGE-3',
    targets: ['module:storage'],
    description: '自動保存必須。ユーザーによる明示的保存操作は不要。',
  },
  {
    id: 'RBC-STORAGE-4',
    targets: ['module:storage', 'module:settings'],
    description:
      'デフォルト保存ディレクトリは Linux: ~/.local/share/promptnotes/notes/、macOS: ~/Library/Application Support/promptnotes/notes/。設定から任意ディレクトリに変更可能。',
  },
  {
    id: 'RBC-STORAGE-5',
    targets: ['module:storage'],
    description:
      'データはローカル .md ファイルのみ。クラウド同期・DB利用は禁止。AI呼び出し機能の実装も禁止。',
  },
  {
    id: 'RBC-GRID-1',
    targets: ['module:grid'],
    description: 'Pinterestスタイル可変高カード必須。デフォルトフィルタは直近7日間。',
  },
  {
    id: 'RBC-GRID-2',
    targets: ['module:grid'],
    description: 'タグ・日付フィルタおよび全文検索（ファイル全走査）は必須機能。',
  },
  {
    id: 'RBC-GRID-3',
    targets: ['module:grid', 'module:editor'],
    description: 'カードクリックでエディタ画面へ遷移必須。',
  },
  {
    id: 'RBC-SETTINGS-1',
    targets: ['module:storage', 'module:settings'],
    description:
      '設定変更（保存ディレクトリ）はRustバックエンド経由で永続化。フロントエンド単独でのファイルパス操作は禁止。',
  },
  {
    id: 'RBC-PLATFORM-1',
    targets: ['platform:linux', 'platform:macos'],
    description:
      'Linux（バイナリ・Flatpak・NixOS）および macOS（バイナリ・Homebrew Cask）配布必須。Windowsは対象外。',
  },
  {
    id: 'RBC-SCOPE-1',
    targets: ['module:editor', 'module:storage'],
    description:
      'AI呼び出し・クラウド同期・Markdownプレビュー・モバイル対応はスコープ外であり実装禁止。',
  },
];

/**
 * Runs all constraint checks and returns a report.
 * Each check function must be implemented per constraint.
 */
export function buildConstraintReport(
  checkFns: Partial<Record<string, () => { passed: boolean; evidence?: string }>>,
): ConstraintChecklistReport {
  const results: CheckResult[] = RELEASE_BLOCKING_CONSTRAINTS.map((constraint) => {
    const checkFn = checkFns[constraint.id];
    if (!checkFn) {
      return { ...constraint, status: 'UNCHECKED' as const };
    }
    const { passed, evidence } = checkFn();
    return {
      ...constraint,
      status: passed ? ('PASS' as const) : ('FAIL' as const),
      evidence,
    };
  });

  return {
    timestamp: new Date().toISOString(),
    allPassed: results.every((r) => r.status === 'PASS'),
    results,
  };
}

export function formatReport(report: ConstraintChecklistReport): string {
  const lines: string[] = [
    `=== Release-Blocking Constraint Checklist ===`,
    `Timestamp: ${report.timestamp}`,
    `Overall: ${report.allPassed ? '✅ ALL PASSED' : '❌ FAILURES DETECTED — RELEASE BLOCKED'}`,
    '',
  ];
  for (const r of report.results) {
    const icon = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⬜';
    lines.push(`${icon} [${r.id}] (${r.targets.join(', ')})`);
    lines.push(`   ${r.description}`);
    if (r.evidence) lines.push(`   Evidence: ${r.evidence}`);
  }
  return lines.join('\n');
}
