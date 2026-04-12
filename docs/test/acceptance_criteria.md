---
codd:
  node_id: test:acceptance_criteria
  type: test
  depends_on:
  - id: req:promptnotes-requirements
    relation: derives_from
    semantic: governance
  depended_by:
  - id: design:system-design
    relation: constrained_by
    semantic: governance
  conventions:
  - targets:
    - module:editor
    reason: Cmd+N / Ctrl+N 即時新規ノート作成および1クリックコピーボタンはコアUXであり、未実装ならリリース不可。
  - targets:
    - module:editor
    reason: CodeMirror 6 必須。タイトル入力欄禁止・Markdownプレビュー（レンダリング）禁止はスコープ外として明示されており、実装した場合リリース不可。
  - targets:
    - module:storage
    reason: ファイル名規則 YYYY-MM-DDTHHMMSS.md および自動保存は確定済み。違反時リリース不可。
  - targets:
    - module:grid
    reason: デフォルト直近7日間フィルタ・タグ/日付フィルタ・全文検索は必須機能。未実装ならリリース不可。
  modules:
  - editor
  - grid
  - storage
  - settings
---

# Acceptance Criteria

## 1. Overview

本ドキュメントは PromptNotes の受入基準を定義する。PromptNotes は AI へ渡すプロンプトを素早く書き溜めるローカルノートアプリであり、Tauri (Rust + WebView) + Svelte + CodeMirror 6 で構築される。データはローカル `.md` ファイルとして保存され、クラウド同期・AI 呼び出し機能は持たない。

受入基準は requirements.md を唯一の真実源とし、すべての機能要件・非機能要件・スコープ外制約を網羅する。E2E テストはこの基準から導出される。

### リリースブロッキング制約

以下の制約に違反した場合、リリースは不可となる。本ドキュメント全体でこれらを明示的に反映する。

| ID | 対象モジュール | 制約 |
|---|---|---|
| RB-1 | `module:editor` | Cmd+N / Ctrl+N 即時新規ノート作成および 1 クリックコピーボタンはコア UX。未実装ならリリース不可。 |
| RB-2 | `module:editor` | CodeMirror 6 必須。タイトル入力欄の実装禁止。Markdown プレビュー（レンダリング）の実装禁止。違反時リリース不可。 |
| RB-3 | `module:storage` | ファイル名規則 `YYYY-MM-DDTHHMMSS.md` および自動保存は確定済み。違反時リリース不可。 |
| RB-4 | `module:grid` | デフォルト直近 7 日間フィルタ・タグ/日付フィルタ・全文検索は必須機能。未実装ならリリース不可。 |

---

## 2. Acceptance Criteria

### AC-EDIT-01: エディタ画面 — 基本構成

- エディタ画面はタイトル入力欄を持たない（**RB-2 準拠**）。
- 本文エリアは CodeMirror 6 エディタインスタンスで構成される（**RB-2 準拠**）。
- Markdown シンタックスハイライトが有効である（CodeMirror 公式 `@codemirror/lang-markdown` パッケージ使用）。
- Markdown のレンダリングプレビュー機能は存在しない（**RB-2 準拠: 実装した場合リリース不可**）。
- 画面上部に frontmatter（タグ入力）領域が設置され、背景色で本文と視覚的に区別される。

### AC-EDIT-02: ノートリスト表示

- エディタ画面において、過去のノートがリスト形式で縦に並んで表示される。
- 各ノートは frontmatter のタグ領域と本文を含む。
- リスト内のノートを選択すると、そのノートがインラインで編集可能になる。

### AC-EDIT-03: 新規ノート作成（Cmd+N / Ctrl+N）

- **macOS**: Cmd+N、**Linux**: Ctrl+N でショートカット発火する（**RB-1 準拠**）。
- ショートカット実行後、即座に新規ノートが作成される。
- 新規ノート作成後、フォーカスが新規ノートの本文エリアに自動移動する。
- 現在のエディタ画面がすでに新規ノート（未入力状態）であっても、さらに新規ノートを作成できる。
- 新規ノート作成時のレイテンシは体感即時（100ms 以下）である。

### AC-EDIT-04: 1 クリックコピーボタン

- エディタ画面にコピーボタンが表示される（**RB-1 準拠**）。
- ボタンを 1 クリックすると、ノート本文全体（frontmatter を除く）がシステムクリップボードにコピーされる。
- コピー成功時、ユーザーにフィードバック（ボタン状態変化・トースト等）が表示される。

### AC-EDIT-05: 自動保存

- ノートの内容変更は自動的にファイルに保存される（**RB-3 準拠**）。
- 明示的な「保存」ボタンや Cmd+S / Ctrl+S 操作は不要である。
- ファイル名はノート作成時のタイムスタンプで確定し、以降変更されない。

### AC-EDIT-06: frontmatter タグ入力

- frontmatter 領域で YAML 形式のタグ（`tags: [gpt, coding]`）を入力・編集できる。
- frontmatter 領域は背景色により本文と視覚的に区別される。
- メタデータはタグのみ。作成日時はファイル名から取得する。

### AC-STOR-01: ファイル名規則

- 保存されるファイル名は `YYYY-MM-DDTHHMMSS.md` 形式に厳密に従う（**RB-3 準拠**）。
- 例: `2026-04-04T143205.md`
- タイムスタンプはノート作成時点の現地時刻である。

### AC-STOR-02: ファイル構造

- 各ノートファイルは以下の構造を持つ:
  ```
  ---
  tags: [tag1, tag2]
  ---

  本文テキスト
  ```
- frontmatter は YAML 形式である。
- frontmatter に含まれるメタデータは `tags` のみ。

### AC-STOR-03: デフォルト保存ディレクトリ

- Linux: `~/.local/share/promptnotes/notes/`
- macOS: `~/Library/Application Support/promptnotes/notes/`
- アプリ初回起動時、ディレクトリが存在しなければ自動作成される。

### AC-GRID-01: グリッドビュー基本表示

- グリッドビューは Pinterest スタイルの可変高カードで構成される（**RB-4 準拠**）。
- カードにはノートの本文（先頭部分）とタグが表示される。

### AC-GRID-02: デフォルト直近 7 日間フィルタ

- グリッドビューを開いた時点で、直近 7 日間のノートのみが表示される（**RB-4 準拠**）。
- フィルタ条件はファイル名のタイムスタンプから算出される。

### AC-GRID-03: タグ・日付フィルタ

- タグによるフィルタリングが可能である（**RB-4 準拠**）。
- 日付範囲によるフィルタリングが可能である（**RB-4 準拠**）。
- 複数条件の AND 組み合わせが可能である。

### AC-GRID-04: 全文検索

- テキスト入力による全文検索が可能である（**RB-4 準拠**）。
- 検索はローカルファイルの全走査で実行される（件数が少ないため十分な性能）。
- 検索結果はグリッドビューにリアルタイム反映される。

### AC-GRID-05: カードからエディタへの遷移

- グリッドビューのカードをクリックすると、エディタ画面に遷移し該当ノートが表示される。

### AC-SET-01: 保存ディレクトリの変更

- 設定画面から保存ディレクトリを任意のパスに変更できる。
- Obsidian vault 内のサブディレクトリを指定する使い方をサポートする。
- ディレクトリ変更後、既存ノートは新ディレクトリから読み込まれる。

### AC-TECH-01: 技術スタック準拠

- アプリケーションは Tauri (Rust + WebView) で構築される。
- フロントエンドは Svelte で構築される（React は不可）。
- エディタは CodeMirror 6 を使用する（Monaco 等は不可）。
- ターゲットプラットフォームは Linux と macOS（Windows は将来対応のためスコープ外）。

### AC-DIST-01: 配布方式

- Linux: バイナリ直接ダウンロード、Flatpak (Flathub)、NixOS パッケージ。
- macOS: バイナリ直接ダウンロード、Homebrew Cask。

### AC-SCOPE-01: スコープ外機能の不在

- AI 呼び出し機能が実装されていないこと。
- クラウド同期機能が実装されていないこと。
- タイトル入力欄が実装されていないこと（**RB-2 準拠**）。
- Markdown プレビュー（レンダリング）が実装されていないこと（**RB-2 準拠**）。
- モバイル対応が実装されていないこと。

---

## 3. Failure Criteria

以下のいずれかに該当する場合、受入テストは不合格とする。

### FC-EDIT: エディタ画面の致命的不具合

| ID | 条件 |
|---|---|
| FC-EDIT-01 | Cmd+N / Ctrl+N を押しても新規ノートが作成されない（**RB-1 違反**） |
| FC-EDIT-02 | 新規ノート作成後、フォーカスが新規ノート本文に移動しない |
| FC-EDIT-03 | 1 クリックコピーボタンが存在しない、またはクリックしてもクリップボードにコピーされない（**RB-1 違反**） |
| FC-EDIT-04 | エディタが CodeMirror 6 以外のエンジンで動作している（**RB-2 違反**） |
| FC-EDIT-05 | タイトル入力欄が画面に存在する（**RB-2 違反**） |
| FC-EDIT-06 | Markdown レンダリングプレビュー機能が存在する（**RB-2 違反**） |
| FC-EDIT-07 | frontmatter 領域が背景色で本文と区別されていない |
| FC-EDIT-08 | 新規ノート画面で Cmd+N / Ctrl+N を押しても追加の新規ノートが作成されない |
| FC-EDIT-09 | 過去ノートのリスト表示が機能しない、または選択しても編集できない |

### FC-STOR: ストレージの致命的不具合

| ID | 条件 |
|---|---|
| FC-STOR-01 | 保存ファイル名が `YYYY-MM-DDTHHMMSS.md` 形式に合致しない（**RB-3 違反**） |
| FC-STOR-02 | ノート編集後、自動保存が実行されない（**RB-3 違反**） |
| FC-STOR-03 | frontmatter が YAML 形式でない、または `tags` 以外のメタデータフィールドが自動挿入される |
| FC-STOR-04 | デフォルト保存ディレクトリが OS ごとの規定パスと異なる |
| FC-STOR-05 | 保存ディレクトリが存在しない場合に自動作成されない |

### FC-GRID: グリッドビューの致命的不具合

| ID | 条件 |
|---|---|
| FC-GRID-01 | グリッドビューが Pinterest スタイルの可変高カードで表示されない（**RB-4 違反**） |
| FC-GRID-02 | デフォルト表示が直近 7 日間にフィルタされていない（**RB-4 違反**） |
| FC-GRID-03 | タグフィルタが動作しない（**RB-4 違反**） |
| FC-GRID-04 | 日付フィルタが動作しない（**RB-4 違反**） |
| FC-GRID-05 | 全文検索が動作しない（**RB-4 違反**） |
| FC-GRID-06 | カードクリックでエディタ画面に遷移しない |

### FC-SET: 設定画面の致命的不具合

| ID | 条件 |
|---|---|
| FC-SET-01 | 保存ディレクトリを変更できない |
| FC-SET-02 | ディレクトリ変更後、新ディレクトリからノートが読み込まれない |

### FC-SCOPE: スコープ外機能の混入

| ID | 条件 |
|---|---|
| FC-SCOPE-01 | AI 呼び出し機能が存在する |
| FC-SCOPE-02 | クラウド同期機能が存在する |
| FC-SCOPE-03 | モバイル対応のコードパスが存在する |

---

## 4. E2E Test Generation Meta-Prompt

以下は `codd propagate` が E2E テストを自動生成するための機械可読な指示である。

### テスト対象アプリケーション

PromptNotes は Tauri デスクトップアプリであり、フロントエンドは Svelte + CodeMirror 6 で構成される。E2E テストは WebView 層（ブラウザテスト）と Tauri コマンド層（API 統合テスト）の 2 レベルで実施する。

### サーバー起動シーケンス

1. `package.json` の `scripts` セクションを検査し、`dev` / `start` / `tauri dev` コマンドを特定する。
2. テスト実行前に以下を実行する:
   - `npm run build` (または `pnpm build`) でフロントエンドをビルド。
   - `npm run tauri dev` でアプリケーションを起動（CI 環境ではバックグラウンド実行）。
   - WebView の `http://localhost:1420` (Tauri デフォルト dev server ポート) に対してヘルスチェックを実行し、応答を確認してからテストを開始する。
3. CI 環境では `xvfb-run` 等のヘッドレスディスプレイを使用する。
4. ブラウザテストの Playwright 設定: `use: { headless: true }` をデフォルトとする。

### MECE ドメイン分割

| ドメイン | スコープ | API 統合テストファイル | ブラウザテストファイル |
|---|---|---|---|
| editor-core | 新規ノート作成、Cmd+N/Ctrl+N、フォーカス移動、コピーボタン、frontmatter 表示 | `tests/e2e/editor-core.spec.ts` | `tests/e2e/editor-core.browser.spec.ts` |
| editor-codemirror | CodeMirror 6 インスタンス検証、Markdown シンタックスハイライト、レンダリング禁止 | — | `tests/e2e/editor-codemirror.browser.spec.ts` |
| storage | ファイル名規則、自動保存、ファイル構造、デフォルトディレクトリ | `tests/e2e/storage.spec.ts` | — |
| grid | カード表示、デフォルト 7 日間フィルタ、タグフィルタ、日付フィルタ、全文検索、カード→エディタ遷移 | `tests/e2e/grid.spec.ts` | `tests/e2e/grid.browser.spec.ts` |
| settings | 保存ディレクトリ変更、変更後の読み込み | `tests/e2e/settings.spec.ts` | `tests/e2e/settings.browser.spec.ts` |
| scope-guard | スコープ外機能（AI 呼び出し、クラウド同期、タイトル欄、Markdown プレビュー、モバイル）の不在確認 | — | `tests/e2e/scope-guard.browser.spec.ts` |

### 共有ヘルパーディレクトリ

`tests/e2e/helpers/` に以下を配置する:

- `test-data.ts` — テスト用ノートファイル（frontmatter + 本文）の生成・配置・クリーンアップ。ファイル名は `YYYY-MM-DDTHHMMSS.md` 形式に準拠する。
- `note-factory.ts` — 指定した日時・タグ・本文でノートファイルをプログラム的に作成するファクトリ関数。
- `app-launch.ts` — Tauri アプリの起動・終了・WebView 接続を管理する。
- `assertions.ts` — 共通アサーション（ファイル名形式検証、frontmatter パース、クリップボード内容確認等）。
- `keyboard.ts` — OS に応じた Cmd+N / Ctrl+N 等のキーボードショートカット送信ヘルパー。

### シナリオ導出ルール

1. **受入基準からの正パス導出**: 各 `AC-*` 項目に対して少なくとも 1 つの正常系テストシナリオを生成する。
2. **受入基準からの負パス導出**: 各 `AC-*` 項目の境界条件・異常入力に対するテストシナリオを生成する。例: タグなしノート、空本文ノート、超長文ノート。
3. **失敗基準からの反転アサーション**: 各 `FC-*` 項目を反転して「その状態が発生しないこと」を検証するアサーションを生成する。

### テストレベルの分離規則

- **API 統合テスト** (`*.spec.ts`): Tauri コマンド (IPC) レイヤーを直接呼び出し、ファイルシステム操作の結果を検証する。HTTP クライアントモードまたは Tauri の `invoke` を使用し、レスポンスとデータ契約を検証する。
- **ブラウザテスト** (`*.browser.spec.ts`): Playwright の `page` オブジェクトで実際のユーザー操作をシミュレートする。クリック、キー入力、フォーカス確認、画面遷移、表示要素のアサーションを行う。
- ブラウザテストにおけるページ遷移の検証: ユーザー操作（カードクリック、ショートカットキー等）でページ遷移が発生する場合、**遷移先 URL のアサーション**と**遷移先画面の少なくとも 1 つの表示要素のアサーション**を両方実施する。HTTP ステータスコードのみの確認は不可。
- サーバーヘルスベースライン: すべての HTTP リクエストアサーションは、ビジネスロジックのステータスコード検証の前にレスポンスステータスが 500 未満であることを確認する。

### アーキテクチャ適応ルール

- テスト生成時に `src/` 配下のルート定義・コンポーネント構造・Tauri コマンド定義をスキャンする。
- 未実装のエンドポイントやコンポーネントに対するテストは `test.fixme()` でマークし、スキップではなく明示的に未実装であることを記録する。

### 生成マーカー

すべての生成ファイルの先頭に以下のヘッダーを挿入する:

```typescript
// @generated-from: docs/design/test/acceptance_criteria.md
// @generated-by: codd propagate
```

手動で追加されたテスト（`// @manual` マーカー付き）は再生成時に保持される。

### 品質ゲート

- すべてのテストが PASS であること。SKIP は 0 件（未実装は `test.fixme()` で管理）。
- 受入基準 `AC-*` の全項目に対して少なくとも 1 つのテストシナリオが存在すること。
- リリースブロッキング制約 RB-1 〜 RB-4 に対応するテストがすべて PASS であること。
- `FC-SCOPE-*` の全項目に対するスコープガードテストが PASS であること（禁止機能の不在確認）。
