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

import type { AcceptanceCriterion } from './types';

export const EDITOR_ACCEPTANCE_CRITERIA: readonly AcceptanceCriterion[] = [
  {
    id: 'AC-ED-01',
    module: 'module:editor',
    description:
      'エディタは CodeMirror 6 で実装されており、Markdown シンタックスハイライトが有効である（レンダリングではなくプレーンテキスト表示）。',
    releaseBlocking: true,
    verificationMethod: 'browser',
  },
  {
    id: 'AC-ED-02',
    module: 'module:editor',
    description:
      'タイトル入力欄が存在しない。画面上に本文エディタ領域と frontmatter 領域のみが表示される。',
    releaseBlocking: true,
    verificationMethod: 'browser',
  },
  {
    id: 'AC-ED-03',
    module: 'module:editor',
    description:
      '画面上部に frontmatter（タグ入力）領域があり、背景色で本文と視覚的に区別される。frontmatter は YAML 形式で tags フィールドのみ保持する。',
    releaseBlocking: true,
    verificationMethod: 'browser',
  },
  {
    id: 'AC-ED-04',
    module: 'module:editor',
    description:
      'Cmd+N（macOS）/ Ctrl+N（Linux）を押すと即座に新規ノートが作成され、エディタにフォーカスが移動する。',
    releaseBlocking: true,
    verificationMethod: 'browser',
  },
  {
    id: 'AC-ED-05',
    module: 'module:editor',
    description:
      '1クリックコピーボタンが表示されており、クリックすると本文全体（frontmatter を除く）がクリップボードにコピーされる。',
    releaseBlocking: true,
    verificationMethod: 'browser',
  },
  {
    id: 'AC-ED-06',
    module: 'module:editor',
    description:
      '保存は自動で行われ、ユーザーによる明示的な保存操作は不要である。',
    releaseBlocking: true,
    verificationMethod: 'browser',
  },
] as const;

export const STORAGE_ACCEPTANCE_CRITERIA: readonly AcceptanceCriterion[] = [
  {
    id: 'AC-ST-01',
    module: 'module:storage',
    description:
      'ノート作成時のファイル名が YYYY-MM-DDTHHMMSS.md 形式である。タイムスタンプはノート作成時刻で確定する。',
    releaseBlocking: true,
    verificationMethod: 'api',
  },
  {
    id: 'AC-ST-02',
    module: 'module:storage',
    description:
      'ファイル構造は YAML frontmatter（tags のみ）＋本文で構成される。',
    releaseBlocking: true,
    verificationMethod: 'api',
  },
  {
    id: 'AC-ST-03',
    module: 'module:storage',
    description:
      'デフォルト保存ディレクトリは Linux: ~/.local/share/promptnotes/notes/、macOS: ~/Library/Application Support/promptnotes/notes/ である。',
    releaseBlocking: true,
    verificationMethod: 'api',
  },
  {
    id: 'AC-ST-04',
    module: 'module:storage',
    description:
      '設定画面から保存ディレクトリを任意のパスに変更でき、変更後は新規ノートが新ディレクトリに作成される。',
    releaseBlocking: true,
    verificationMethod: 'browser',
  },
] as const;

export const GRID_ACCEPTANCE_CRITERIA: readonly AcceptanceCriterion[] = [
  {
    id: 'AC-GR-01',
    module: 'module:grid',
    description:
      'グリッドビューは Pinterest スタイルの可変高カードでノート一覧を表示する。',
    releaseBlocking: true,
    verificationMethod: 'browser',
  },
  {
    id: 'AC-GR-02',
    module: 'module:grid',
    description:
      'デフォルトフィルタとして直近7日間のノートのみが表示される。7日より前のノートは初期状態では非表示である。',
    releaseBlocking: true,
    verificationMethod: 'browser',
  },
  {
    id: 'AC-GR-03',
    module: 'module:grid',
    description:
      'タグおよび日付でフィルタリングが可能である。フィルタ適用後、条件に合致するノートのみが表示される。',
    releaseBlocking: true,
    verificationMethod: 'browser',
  },
  {
    id: 'AC-GR-04',
    module: 'module:grid',
    description:
      '全文検索（ファイル全走査）が機能し、検索クエリに合致する本文を含むノートのみが表示される。',
    releaseBlocking: true,
    verificationMethod: 'browser',
  },
  {
    id: 'AC-GR-05',
    module: 'module:grid',
    description:
      'カードをクリックするとエディタ画面に遷移し、該当ノートの内容が表示される。',
    releaseBlocking: true,
    verificationMethod: 'browser',
  },
] as const;

export const SETTINGS_ACCEPTANCE_CRITERIA: readonly AcceptanceCriterion[] = [
  {
    id: 'AC-CF-01',
    module: 'module:settings',
    description: '設定画面で保存ディレクトリの変更が可能である。',
    releaseBlocking: true,
    verificationMethod: 'browser',
  },
] as const;

export const DISTRIBUTION_ACCEPTANCE_CRITERIA: readonly AcceptanceCriterion[] = [
  {
    id: 'AC-DI-01',
    module: 'platform:linux',
    description:
      'Linux 向けにバイナリ直接ダウンロード、Flatpak（Flathub）、NixOS パッケージが提供される。',
    releaseBlocking: true,
    verificationMethod: 'ci',
  },
  {
    id: 'AC-DI-02',
    module: 'platform:macos',
    description:
      'macOS 向けにバイナリ直接ダウンロード、Homebrew Cask が提供される。',
    releaseBlocking: true,
    verificationMethod: 'ci',
  },
] as const;

export const DEVENV_ACCEPTANCE_CRITERIA: readonly AcceptanceCriterion[] = [
  {
    id: 'AC-DV-01',
    module: 'module:shell',
    description:
      'README.md に Download（Nix, Homebrew）、Usage（スクリーンショット付き）、Local Development セクションが存在する。',
    releaseBlocking: true,
    verificationMethod: 'file',
  },
  {
    id: 'AC-DV-02',
    module: 'module:shell',
    description:
      'ローカル開発環境は direnv + nix flake で構築できる。',
    releaseBlocking: true,
    verificationMethod: 'manual',
  },
] as const;

export const ALL_ACCEPTANCE_CRITERIA: readonly AcceptanceCriterion[] = [
  ...EDITOR_ACCEPTANCE_CRITERIA,
  ...STORAGE_ACCEPTANCE_CRITERIA,
  ...GRID_ACCEPTANCE_CRITERIA,
  ...SETTINGS_ACCEPTANCE_CRITERIA,
  ...DISTRIBUTION_ACCEPTANCE_CRITERIA,
  ...DEVENV_ACCEPTANCE_CRITERIA,
] as const;
