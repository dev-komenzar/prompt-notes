---
codd:
  node_id: plan:implementation_plan
  type: plan
  depends_on:
  - id: detail:component_architecture
    relation: depends_on
    semantic: technical
  - id: detail:editor_clipboard
    relation: depends_on
    semantic: technical
  - id: detail:storage_fileformat
    relation: depends_on
    semantic: technical
  - id: detail:grid_search
    relation: depends_on
    semantic: technical
  depended_by: []
  conventions:
  - targets:
    - platform:linux
    - platform:macos
    reason: Linux（バイナリ・Flatpak・NixOS）および macOS（バイナリ・Homebrew Cask）配布必須。Windowsは対象外。
  - targets:
    - module:editor
    - module:grid
    - module:storage
    - module:settings
    reason: 全必須機能の実装・テスト完了までリリース不可。AI呼び出し・クラウド同期・Markdownプレビュー・モバイル対応はスコープ外であり実装禁止。
  modules:
  - editor
  - grid
  - storage
  - settings
  - shell
---

# Implementation Plan

## 1. Overview

本実装計画は PromptNotes アプリケーション（Tauri ベースのローカルファーストプロンプトノートアプリ）の全モジュールを対象とした開発計画を定義する。PromptNotes は Rust バックエンド + Svelte フロントエンド（WebView）で構成され、CodeMirror 6 による Markdown プレーンテキスト編集、1クリックコピーボタン、Pinterest スタイル Masonry グリッドビュー、タグ/日付フィルタ、全文検索を提供する。データは `.md` ファイルのみにローカル保存し、データベース・クラウド同期・AI 呼び出しは一切使用しない。

### 対象プラットフォーム

| プラットフォーム | WebView | デフォルト保存ディレクトリ | 配布形式 |
|----------------|---------|------------------------|---------|
| Linux | GTK WebKitGTK | `~/.local/share/promptnotes/notes/` | `.AppImage`, `.deb`, Flatpak (Flathub), NixOS パッケージ |
| macOS | WKWebView | `~/Library/Application Support/promptnotes/notes/` | `.dmg`, Homebrew Cask |

Windows はスコープ外であり、ビルド・配布ターゲットに含めない。モバイル（iOS / Android）も対象外である。これはリリース不可制約 `platform:linux` および `platform:macos` に準拠する。

### 対象モジュール構成

リリース不可制約 `module:editor`, `module:grid`, `module:storage`, `module:settings` に基づき、以下の5モジュール全ての実装・テスト完了をリリース条件とする。AI 呼び出し・クラウド同期・Markdown プレビュー・モバイル対応はスコープ外であり実装禁止である。

| モジュール | レイヤー | 主要責務 | 主要技術 |
|-----------|---------|---------|---------|
| `module:shell` | Rust + Tauri ランタイム | ウィンドウ管理、IPC コマンドルーティング、ライフサイクル管理 | Tauri `Builder`, `#[tauri::command]` |
| `module:storage` | Rust バックエンド | `.md` ファイル CRUD、frontmatter パース、ファイル名タイムスタンプ生成、全文検索 | `std::fs`, `chrono`, `serde_yaml`, `regex` |
| `module:settings` | Rust バックエンド + Svelte UI | `config.json` 読み書き、保存ディレクトリ変更 | `serde_json`, `dirs`, Tauri ファイルダイアログ API |
| `module:editor` | Svelte フロントエンド | CodeMirror 6 Markdown 編集、frontmatter デコレーション、自動保存（500ms デバウンス）、1クリックコピーボタン、Cmd+N / Ctrl+N 新規ノート作成 | `@codemirror/view`, `@codemirror/state`, `@codemirror/lang-markdown`, `navigator.clipboard` |
| `module:grid` | Svelte フロントエンド | Masonry カードレイアウト、直近7日間デフォルト表示、タグ/日付フィルタ、全文検索 | CSS Columns（または svelte-masonry）、`lib/api.ts` |

### アーキテクチャ原則

すべての実装は以下のアーキテクチャ原則に準拠する。これらはリリース不可制約として扱う。

1. **Tauri IPC 境界の厳守（`framework:tauri`, `module:shell`）:** フロントエンド↔Rust バックエンド間の全通信は Tauri IPC（`invoke`）経由で行う。フロントエンドからの直接ファイルシステムアクセスは禁止する。全ファイル操作は Rust バックエンド経由で実行する。`@tauri-apps/api` の `invoke` 直接呼び出しは `src/lib/api.ts` 内にのみ限定し、Svelte コンポーネントから直接 `invoke` を呼び出さない。
2. **設定永続化のバックエンド排他（`module:storage`, `module:settings`）:** 設定変更（保存ディレクトリ）は `set_config` IPC コマンドを通じて Rust バックエンドで永続化する。フロントエンド単独でのファイルパス操作・ファイルシステム読み書きは禁止する。ディレクトリ選択には Tauri のファイルダイアログ API を使用し、選択結果は Rust 側で検証・保存する。
3. **型の正方向（Rust → TypeScript）:** `NoteEntry`, `Config` 等の共有型は Rust 側（`serde::Serialize` / `serde::Deserialize`）が正規定義であり、TypeScript 側（`src/lib/types.ts`）は Rust 側に追従する。CI の E2E テストで型の一致を検証する。

### IPC コマンド一覧

全マイルストーンを通じて実装する IPC コマンドの完全なリストを以下に示す。

| コマンド名 | 所有モジュール | 引数 | 戻り値 | フロントエンド呼び出し元 |
|-----------|--------------|------|--------|----------------------|
| `create_note` | `module:storage` | なし | `{ filename: string, path: string }` | `module:editor` |
| `save_note` | `module:storage` | `{ filename: string, content: string }` | `void` | `module:editor` |
| `read_note` | `module:storage` | `{ filename: string }` | `{ content: string }` | `module:editor` |
| `delete_note` | `module:storage` | `{ filename: string }` | `void` | `module:editor`, `module:grid` |
| `list_notes` | `module:storage` | `{ from_date?: string, to_date?: string, tag?: string }` | `NoteEntry[]` | `module:grid` |
| `search_notes` | `module:storage` | `{ query: string, from_date?: string, to_date?: string, tag?: string }` | `NoteEntry[]` | `module:grid` |
| `get_config` | `module:settings` | なし | `Config` | `module:settings` UI |
| `set_config` | `module:settings` | `{ notes_dir: string }` | `void` | `module:settings` UI |

### フロントエンドファイル構成

フロントエンドは Svelte で確定しており、以下のディレクトリ構造で実装する。

```
src/
├── App.svelte              # ルートコンポーネント。currentView 状態で画面切替（'grid' | 'editor' | 'settings'）
├── lib/
│   ├── api.ts              # invoke ラッパー。全 IPC コマンドの型安全な呼び出し関数
│   ├── types.ts            # NoteEntry, Config 等の TypeScript 型定義（Rust 側に追従）
│   └── debounce.ts         # デバウンスユーティリティ（自動保存 500ms、検索 300ms）
├── components/
│   ├── Editor.svelte       # module:editor — CodeMirror 6 統合
│   ├── CopyButton.svelte   # 1クリックコピーボタン（Editor.svelte 専用子コンポーネント）
│   ├── GridView.svelte     # module:grid — Masonry カードレイアウト
│   ├── NoteCard.svelte     # グリッドビュー用個別カードコンポーネント
│   ├── TagFilter.svelte    # タグフィルタ UI
│   ├── DateFilter.svelte   # 日付フィルタ UI
│   └── Settings.svelte     # module:settings UI — ディレクトリ選択
```

SPA ルーティングライブラリは使用せず、`App.svelte` の `currentView` 状態変数による条件レンダリングで3画面（エディタ・グリッド・設定）を切り替える。

### パフォーマンス閾値

全マイルストーンを通じて以下のパフォーマンス閾値を達成する。

| 操作 | 期待レイテンシ | 計測条件 |
|------|-------------|---------|
| `create_note` | 1ms 以下 | ファイル作成 + タイムスタンプ生成 |
| `save_note` | 1ms 以下 | `std::fs::write` ローカル書き込み |
| `read_note` | 1ms 以下 | `std::fs::read_to_string` ローカル読み込み |
| `list_notes` | 100ms 以下 | 1,000 件走査 + frontmatter パース |
| `search_notes` | 200ms 以下 | 1,000 件全文走査 |
| 自動保存エンドツーエンド | 約 505ms | デバウンス 500ms + IPC + 書き込み |
| Cmd+N → フォーカス完了 | 体感遅延なし | IPC オーバーヘッド含め 10ms 以内 |
| カードクリック → エディタ表示 | 体感遅延なし | `currentView` 切替 + `read_note` + CM6 ロード |

5,000 件超過時に応答時間を計測し、`tantivy` クレート（Rust 製全文検索エンジン）の導入を検討する。

## 2. Milestones

### Milestone 1: プロジェクト基盤構築（1週目〜2週目）

Tauri + Svelte + Rust のプロジェクトスキャフォールディングと、全モジュールの基盤となる IPC 境界・型定義・ビルドパイプラインを確立する。

| タスク ID | タスク | 対象モジュール | 成果物 | 完了条件 |
|----------|-------|--------------|--------|---------|
| M1-01 | Tauri プロジェクト初期化（Rust + Svelte） | `module:shell` | `src-tauri/` + `src/` ディレクトリ構造、`Cargo.toml`、`package.json` | `cargo tauri dev` で空ウィンドウが Linux / macOS で起動する |
| M1-02 | Tauri バージョン選定（v1 / v2、OQ-005 解決） | `module:shell` | `Cargo.toml` の Tauri 依存バージョン確定 | 選定根拠を文書化し、`allowlist`（v1）または permissions（v2）の設定方式を確定 |
| M1-03 | Tauri `allowlist` / permissions 設定で WebView からの直接ファイルシステムアクセスを遮断 | `module:shell` | `tauri.conf.json` の `fs` スコープ制限設定 | フロントエンドから `fetch('file://...')` でファイルアクセスを試みて失敗することを確認 |
| M1-04 | Rust 依存クレート追加（`chrono`, `serde_yaml`, `serde_json`, `dirs`, `regex`） | `module:storage`, `module:settings` | `Cargo.toml` に依存追加 | `cargo build` 成功 |
| M1-05 | Svelte フロントエンド初期化 | 全フロントエンドモジュール | `App.svelte`、`currentView` 状態変数による画面切替骨格 | 3画面（editor / grid / settings）の空コンポーネント間で遷移可能 |
| M1-06 | `src/lib/types.ts` に `NoteEntry`, `Config` TypeScript 型定義 | 共有層 | `src/lib/types.ts` | Rust 側の `NoteEntry`（`models.rs`）、`Config`（`config.rs`）と構造一致 |
| M1-07 | `src/lib/api.ts` に IPC ラッパー関数のスタブ実装 | 共有層 | `src/lib/api.ts`（`createNote`, `saveNote`, `readNote`, `deleteNote`, `listNotes`, `searchNotes`, `getConfig`, `setConfig`） | 全8関数の型注釈付きシグネチャが定義され、`invoke` 呼び出しが `api.ts` 内にのみ存在する |
| M1-08 | `src/lib/debounce.ts` デバウンスユーティリティ実装 | 共有層 | `src/lib/debounce.ts` | `setTimeout` / `clearTimeout` ベースのデバウンス関数がユニットテスト通過 |
| M1-09 | CI パイプライン構築（Linux + macOS ビルド・テスト） | 全モジュール | GitHub Actions（または同等）ワークフロー | `cargo test` + `npm test` が Linux / macOS ランナーで通過 |
| M1-10 | Rust 側 `NoteEntry` 構造体（`models.rs`）と `Config` 構造体（`config.rs`）の正規定義 | `module:storage`, `module:settings` | `src-tauri/src/models.rs`, `src-tauri/src/config.rs` | `serde::Serialize` / `serde::Deserialize` 導出、フィールド: `filename`, `created_at`, `tags`, `body_preview`（NoteEntry）、`notes_dir`（Config） |

**Milestone 1 完了基準:** Tauri アプリが Linux / macOS でビルド・起動でき、Svelte の3画面切替が動作し、IPC 境界のスタブ関数が定義され、CI が通過する。

### Milestone 2: ストレージ層実装（3週目〜4週目）

`module:storage` と `module:settings` の Rust バックエンド実装を完了する。全 IPC コマンドが動作し、ファイル操作・frontmatter パース・検索・設定管理が Rust 側で完結する。

| タスク ID | タスク | 対象モジュール | 成果物 | 完了条件 |
|----------|-------|--------------|--------|---------|
| M2-01 | `create_note` IPC コマンド実装 | `module:storage` | `#[tauri::command] fn create_note()` | `chrono::Local::now()` でファイル名 `YYYY-MM-DDTHHMMSS.md` 生成、初期 frontmatter（`tags: []`）書き込み、`{ filename, path }` 返却。同一秒衝突時に `_1`, `_2` サフィックス付与 |
| M2-02 | `save_note` IPC コマンド実装 | `module:storage` | `#[tauri::command] fn save_note()` | ファイル名バリデーション（正規表現 `^\d{4}-\d{2}-\d{2}T\d{6}(_\d+)?\.md$`）、パストラバーサル拒否（`..`, `/`, `\` 検出）、`std::fs::write` による全文上書き |
| M2-03 | `read_note` IPC コマンド実装 | `module:storage` | `#[tauri::command] fn read_note()` | ファイル名バリデーション、`std::fs::read_to_string` でコンテンツ返却 |
| M2-04 | `delete_note` IPC コマンド実装 | `module:storage` | `#[tauri::command] fn delete_note()` | ファイル名バリデーション、`std::fs::remove_file` による物理削除 |
| M2-05 | frontmatter パーサー実装 | `module:storage` | frontmatter 抽出 + `serde_yaml` デシリアライズ関数 | `---` デリミタ検出、YAML パース、エッジケース対応（frontmatter なし→`tags: []`、パースエラー→`tags: []`、`tags` 非存在→`[]`、`tags` が文字列→単一要素配列変換、未知フィールド→無視） |
| M2-06 | `list_notes` IPC コマンド実装 | `module:storage` | `#[tauri::command] fn list_notes()` | `std::fs::read_dir` でファイル列挙、ファイル名タイムスタンプパース、`from_date` / `to_date` / `tag` フィルタリング、frontmatter パース、`body_preview`（先頭 200 文字）切り出し、`created_at` 降順ソート |
| M2-07 | `search_notes` IPC コマンド実装 | `module:storage` | `#[tauri::command] fn search_notes()` | `list_notes` のフィルタに加え `content.to_lowercase().contains(&query.to_lowercase())` による全文検索 |
| M2-08 | デフォルト保存ディレクトリ初期化 | `module:storage` | 起動時の `std::fs::create_dir_all` 処理 | Linux: `~/.local/share/promptnotes/notes/`、macOS: `~/Library/Application Support/promptnotes/notes/` を `dirs::data_dir()` から算出し自動作成 |
| M2-09 | `get_config` / `set_config` IPC コマンド実装 | `module:settings` | `#[tauri::command] fn get_config()`, `fn set_config()` | `config.json` の読み書き。`set_config` ではパス存在チェック・書き込み権限チェックを Rust 側で実行。検証失敗時はエラー返却 |
| M2-10 | `module:shell` の IPC コマンド登録 | `module:shell` | `main.rs` の `tauri::Builder` 設定 | 全8コマンドを `generate_handler![]` で登録、ディスパッチ動作確認 |
| M2-11 | ストレージ層ユニットテスト | `module:storage`, `module:settings` | Rust テストコード | 全 IPC コマンドの正常系・異常系テスト、frontmatter エッジケース全パターン、ファイル名バリデーション、パストラバーサル拒否テスト |

**Milestone 2 完了基準:** 全8 IPC コマンドが Rust 側で実装・テスト完了し、`cargo test` が Linux / macOS で通過する。フロントエンドからの `invoke` 呼び出しで期待通りのレスポンスが返却される。

### Milestone 3: エディタ画面実装（5週目〜6週目）

`module:editor` の Svelte + CodeMirror 6 統合を完了する。Markdown シンタックスハイライト、frontmatter 背景色デコレーション、自動保存、1クリックコピーボタン、Cmd+N / Ctrl+N 新規ノート作成のすべてを実装する。

| タスク ID | タスク | 対象モジュール | 成果物 | 完了条件 |
|----------|-------|--------------|--------|---------|
| M3-01 | CodeMirror 6 依存パッケージ導入（`@codemirror/view`, `@codemirror/state`, `@codemirror/lang-markdown`） | `module:editor` | `package.json` 依存追加 | `npm install` 成功 |
| M3-02 | `Editor.svelte` の CodeMirror 6 統合 | `module:editor` | `Editor.svelte` | `onMount` で `EditorView` 生成、`onDestroy` で `EditorView.destroy()`、`@codemirror/lang-markdown` による Markdown シンタックスハイライト表示。タイトル入力欄は配置しない（CONV-2 準拠）。Markdown プレビューパネルは配置しない |
| M3-03 | frontmatter デコレーション技術検証（OQ-002 解決） | `module:editor` | 技術検証結果文書 + 実装方式確定 | `ViewPlugin` または `StateField` + `Decoration` のいずれかを選定。先頭 `---` 〜 終了 `---` の行範囲検出、`Decoration.line({ class: "cm-frontmatter-line" })` 適用、CSS 変数 `--frontmatter-bg` による背景色制御 |
| M3-04 | frontmatter 背景色デコレーション実装 | `module:editor` | CM6 カスタムエクステンション | frontmatter 領域に `rgba(59, 130, 246, 0.08)` ベースの背景色が適用される。ドキュメント変更時に範囲再計算。frontmatter なし・入力中・完成・削除の全状態遷移に対応 |
| M3-05 | 自動保存実装（500ms デバウンス） | `module:editor` | `Editor.svelte` 内の `EditorView.updateListener` + `debounce.ts` 連携 | `docChanged` 検知→500ms デバウンス→`api.ts` `saveNote()` 呼び出し。カーソル移動やスクロールでは発火しない。ノート切替時・`onDestroy` 時・ウィンドウクローズ時に未保存変更をフラッシュ |
| M3-06 | `CopyButton.svelte` 実装（1クリックコピー） | `module:editor` | `CopyButton.svelte` | エディタ画面に常時表示。クリックで `EditorView.state.doc.toString()` を `navigator.clipboard.writeText()` でクリップボードにコピー。成功フィードバック（アイコン変更: 📋→✓、1.5秒表示）。フォールバック: `document.execCommand('copy')`。`aria-label="本文をクリップボードにコピー"` 付与。IPC 非経由（WebView 内 API） |
| M3-07 | 新規ノート作成キーバインド（Cmd+N / Ctrl+N） | `module:editor` | CM6 キーマップ `{ key: "Mod-n", run: handleCreateNote }` | `api.ts` `createNote()` 呼び出し→戻り値 `{ filename }` で `currentFilename` 更新→ドキュメントを frontmatter テンプレート（`---\ntags: []\n---\n\n`）に置換→`EditorView.focus()` でフォーカス移動→本文入力位置にカーソル配置。キー押下からフォーカス完了まで 10ms 以内 |
| M3-08 | 既存ノート読み込み（グリッドからの遷移対応） | `module:editor` | `Editor.svelte` の `filename` prop 受領 + `readNote()` 呼び出し | `App.svelte` から `selectedFilename` を受け取り、`onMount` で `readNote({ filename })` を呼び出して CodeMirror 6 にコンテンツをロード |
| M3-09 | `api.ts` ラッパー関数の本実装接続 | 共有層 | `api.ts` の `createNote`, `saveNote`, `readNote`, `deleteNote` | M1-07 のスタブを実 `invoke` 呼び出しに置換。TypeScript 型注釈による引数・戻り値の型安全性保証 |
| M3-10 | プラットフォームキーバインド検証 | `module:editor` | テスト結果 | Linux で `Ctrl+N`、macOS で `Cmd+N` がそれぞれ動作することを確認。CM6 の `Mod` プレフィックスによる自動マッピング検証 |
| M3-11 | 自動保存デバウンス間隔の検証（OQ-004 解決） | `module:editor` | デバウンス間隔確定値 | 500ms をベースラインとしてプロトタイプテストを実施し、体感即時性と I/O 頻度のバランスで最終値を確定 |

**Milestone 3 完了基準:** エディタ画面で Markdown シンタックスハイライト付き編集、frontmatter 背景色デコレーション、500ms デバウンス自動保存、1クリックコピーボタン、Cmd+N / Ctrl+N 新規ノート作成がすべて動作する。タイトル入力欄と Markdown プレビューが存在しないことを確認する。

### Milestone 4: グリッドビュー実装（7週目〜8週目）

`module:grid` の Svelte 実装を完了する。Masonry カードレイアウト、デフォルト7日間表示、タグ/日付フィルタ、全文検索、カードクリック遷移のすべてを実装する。

| タスク ID | タスク | 対象モジュール | 成果物 | 完了条件 |
|----------|-------|--------------|--------|---------|
| M4-01 | Masonry レイアウト技術選定（OQ-003 解決） | `module:grid` | 技術検証結果文書 + 実装方式確定 | WebKitGTK / WKWebView での CSS Columns（`column-count` / `column-width`）サポート状況を検証。不十分な場合は JavaScript ライブラリ（svelte-masonry 等）を採用 |
| M4-02 | `GridView.svelte` ルートコンポーネント実装 | `module:grid` | `GridView.svelte` | `notes: NoteEntry[]` 状態管理、フィルタ条件（`fromDate`, `toDate`, `tag`, `query`）管理、`api.ts` 経由のデータ取得、ローディングインジケーター |
| M4-03 | デフォルト7日間フィルタ実装 | `module:grid` | `GridView.svelte` の `onMount` 処理 | マウント時に `from_date = 今日 - 7日`, `to_date = 今日` を JavaScript `Date` で算出し、`listNotes({ from_date, to_date })` を呼び出す |
| M4-04 | `NoteCard.svelte` カードコンポーネント実装 | `module:grid` | `NoteCard.svelte` | `body_preview`（200 文字）表示、`tags` バッジ表示、`created_at` 人間可読日時表示、カード全体クリック可能、可変高（固定高指定なし） |
| M4-05 | `TagFilter.svelte` タグフィルタ実装 | `module:grid` | `TagFilter.svelte` | `NoteEntry.tags` からタグ候補を動的収集、単一タグ選択 UI、`dispatch('tag-change', { tag })` で親コンポーネントに通知 |
| M4-06 | `DateFilter.svelte` 日付フィルタ実装 | `module:grid` | `DateFilter.svelte` | 日付範囲指定 UI、初期値はデフォルト7日間、`dispatch('date-change', { from_date, to_date })` で親コンポーネントに通知 |
| M4-07 | 全文検索テキストボックス実装 | `module:grid` | `GridView.svelte` 内インライン実装 | テキスト入力→300ms デバウンス→`searchNotes({ query, from_date, to_date, tag })` 呼び出し。`query` 空時は `listNotes` に切替 |
| M4-08 | フィルタ・検索の組み合わせ動作 | `module:grid` | 統合テスト | タグ + 日付 + 検索の任意組み合わせで正しい結果が表示される。フィルタ解除で DefaultView に復帰 |
| M4-09 | カードクリック→エディタ遷移実装 | `module:grid`, `module:editor` | `NoteCard.svelte` の `dispatch('card-click')` + `App.svelte` `currentView` 切替 | カードクリック→`GridView` が `App.svelte` の `currentView = 'editor'`, `selectedFilename` を設定→`Editor.svelte` マウント→`readNote` IPC→CodeMirror ロード。体感遅延なし |
| M4-10 | `api.ts` ラッパー関数の本実装接続（grid 系） | 共有層 | `api.ts` の `listNotes`, `searchNotes`, `deleteNote` | M1-07 のスタブを実 `invoke` 呼び出しに置換 |
| M4-11 | 検索デバウンス間隔検証（OQ-GRID-001 解決） | `module:grid` | デバウンス間隔確定値 | 300ms をベースラインとしてプロトタイプテストを実施 |

**Milestone 4 完了基準:** グリッドビューが Masonry レイアウトでノートカードを表示し、デフォルト7日間フィルタ・タグフィルタ・日付フィルタ・全文検索が動作し、カードクリックでエディタ画面に遷移できる。

### Milestone 5: 設定画面・統合・品質保証（9週目〜10週目）

`module:settings` の Svelte UI 実装、全モジュール統合テスト、エラーハンドリング方式確定、パフォーマンス検証を実施する。

| タスク ID | タスク | 対象モジュール | 成果物 | 完了条件 |
|----------|-------|--------------|--------|---------|
| M5-01 | `Settings.svelte` 設定画面実装 | `module:settings` | `Settings.svelte` | ディレクトリ選択ボタン→Tauri ファイルダイアログ API（`open({ directory: true })`）→選択パスを `api.ts` `setConfig({ notes_dir })` で送信→Rust 側で検証・永続化。現在の `notes_dir` を `getConfig()` で表示 |
| M5-02 | エラーハンドリング方式確定（OQ-006 解決） | 全モジュール | UX 方針文書 + 実装 | トースト通知・インライン表示・ダイアログのいずれかを選定し、全 IPC エラー（ファイル書き込み失敗、ディレクトリ不存在、ディスク容量不足等）のユーザー通知を統一的に実装 |
| M5-03 | `notes_dir` 変更後のグリッドビュー再読み込み | `module:grid`, `module:settings` | 動作確認 | 設定画面からグリッドビューに戻った際、`onMount` で新ディレクトリの `list_notes` を再実行 |
| M5-04 | 全画面遷移の統合テスト | 全フロントエンドモジュール | E2E テスト | エディタ→グリッド→設定→グリッド→エディタの遷移が正常に動作。各画面の状態が適切に初期化・保持される |
| M5-05 | パフォーマンス計測 | `module:storage`, `module:grid` | 計測結果文書 | 1,000 件ノートでの `list_notes`（100ms 以下）、`search_notes`（200ms 以下）、`create_note`（1ms 以下）、`save_note`（1ms 以下）の閾値達成を確認 |
| M5-06 | セキュリティテスト | `module:storage`, `module:shell` | テスト結果 | パストラバーサル攻撃（`../../etc/passwd` 等のファイル名）を `filename` バリデーションが正規表現 `^\d{4}-\d{2}-\d{2}T\d{6}(_\d+)?\.md$` で拒否することを確認。Tauri `allowlist` / permissions による WebView 直接ファイルアクセス遮断を確認 |
| M5-07 | CI E2E テスト構築 | 全モジュール | CI パイプライン拡張 | Rust バックエンド + Svelte フロントエンドの E2E テスト（IPC コマンドの結合テスト）を Linux / macOS CI ランナーで実行。型の一致（Rust ↔ TypeScript）を検証 |
| M5-08 | スコープ外機能の不存在確認 | 全モジュール | チェックリスト結果 | AI 呼び出し機能なし、クラウド同期なし、データベース利用なし、タイトル入力欄なし、Markdown プレビューなし、Windows ビルドなし、モバイル対応なし、手動保存ボタンなし を確認 |

**Milestone 5 完了基準:** 設定画面が動作し、全モジュール統合テスト・パフォーマンステスト・セキュリティテストが通過する。スコープ外機能が存在しないことを確認する。

### Milestone 6: 配布パッケージ作成・リリース（11週目〜12週目）

Linux / macOS 向け配布パッケージを作成し、リリース可能な状態にする。

| タスク ID | タスク | 対象プラットフォーム | 成果物 | 完了条件 |
|----------|-------|-------------------|--------|---------|
| M6-01 | Linux バイナリビルド（`.AppImage`, `.deb`） | Linux | 配布バイナリ | `tauri build` で `.AppImage` と `.deb` が生成され、Ubuntu / Fedora 等で起動・動作確認 |
| M6-02 | Linux Flatpak パッケージ作成（Flathub 申請） | Linux | Flatpak マニフェスト | Flatpak ビルド成功、ローカルインストールでの動作確認 |
| M6-03 | Linux NixOS パッケージ作成 | Linux | Nix 式 | NixOS 環境での `nix-build` 成功、起動・動作確認 |
| M6-04 | macOS `.dmg` ビルド | macOS | `.dmg` インストーラ | `tauri build` で `.dmg` 生成、macOS でのインストール・起動・動作確認 |
| M6-05 | macOS Homebrew Cask 定義作成 | macOS | Cask Formula | `brew install --cask promptnotes` でインストール・起動可能 |
| M6-06 | 全配布形式でのスモークテスト | Linux, macOS | テスト結果 | 全配布形式で新規ノート作成→編集→自動保存→コピー→グリッド表示→検索→設定変更の一連のフローが動作 |
| M6-07 | リリースノート作成 | — | リリースノート文書 | 機能一覧、対応プラットフォーム、既知の制約（Open Questions の残存項目）を記載 |

**Milestone 6 完了基準:** Linux（`.AppImage`, `.deb`, Flatpak, NixOS パッケージ）および macOS（`.dmg`, Homebrew Cask）の全配布形式でアプリケーションが正常に動作する。

### Open Questions の解決スケジュール

Open Questions は各マイルストーンで段階的に解決する。

| ID | 質問概要 | 解決マイルストーン | 解決方法 |
|----|---------|-------------------|---------|
| OQ-002 | frontmatter デコレーション実装方式（`ViewPlugin` vs `StateField` + `Decoration`） | M3（M3-03） | プロトタイプ技術検証で Svelte ライフサイクルとの統合パターンを評価し選定 |
| OQ-003 | Masonry レイアウト実装方式（CSS Columns vs JavaScript ライブラリ） | M4（M4-01） | WebKitGTK / WKWebView での CSS Columns 動作検証。不十分な場合は svelte-masonry を採用 |
| OQ-004 | 自動保存デバウンス間隔（500ms vs 1000ms 等） | M3（M3-11） | 500ms ベースラインでプロトタイプテスト、体感即時性と I/O 頻度で最終値を確定 |
| OQ-005 | Tauri バージョン選定（v1 vs v2） | M1（M1-02） | 開発開始時点の安定版を評価し選定。v2 の permissions モデルと v1 の allowlist モデルの比較 |
| OQ-006 | IPC エラー通知方式（トースト / インライン / ダイアログ） | M5（M5-02） | UI プロトタイプでユーザーテスト後に選定 |
| OQ-E01 | CopyButton フィードバック表現 | M3（M3-06） | アイコン変更（📋→✓）を暫定実装し、UI プロトタイプで最終判断 |
| OQ-E02 | EditorView テキスト共有方式（props callback vs Svelte context） | M3（M3-06） | 依存明示性を重視し `getTextFn` props 方式を優先候補としつつ、開発着手時に確定 |
| OQ-SF-001 | 同一秒ファイル名衝突時のサフィックス vs ミリ秒精度 | M2（M2-01） | `_1`, `_2` サフィックス方式で実装し、プロトタイプでの衝突頻度を観察 |
| OQ-SF-002 | `body_preview` 文字数上限（200 文字の妥当性） | M4（M4-04） | Masonry カードデザイン確定時に NoteCard 表示とのバランスで調整 |
| OQ-GRID-001 | 検索デバウンス間隔（300ms vs 500ms） | M4（M4-11） | 300ms ベースラインでテスト |
| OQ-GRID-002 | タグフィルタ単一 vs 複数選択 | M4（M4-05） | 単一タグ選択で初期実装。ユーザーフィードバック後に複数対応を検討 |
| OQ-GRID-003 | グリッドビュー上の削除操作 UI | M4 または M5 | UI プロトタイプでの UX 検討後に確定 |

## 3. Risks

### R1: WebKitGTK の CSS / API サポート差異

**影響:** `module:grid`（Masonry レイアウト）、`module:editor`（クリップボード API）
**詳細:** Linux 環境の WebKitGTK は WKWebView（macOS）と比較して CSS / JavaScript API のサポートに差異がある。CSS Masonry（`grid-template-rows: masonry`）は WebKitGTK で未サポートの可能性が高く、`navigator.clipboard.writeText()` の Secure Context 判定にも差異が生じうる。
**対策:** M4-01 で CSS Columns サポート状況を早期検証し、不十分な場合は JavaScript ライブラリ（svelte-masonry 等）にフォールバック。`CopyButton.svelte` には `document.execCommand('copy')` フォールバックを実装（M3-06）。M1 段階で Linux / macOS 両環境のビルド・起動を確認し、プラットフォーム差異を早期検出する。

### R2: Tauri バージョン（v1 vs v2）の選定リスク

**影響:** `module:shell`、全 IPC 通信
**詳細:** Tauri v2 では IPC モデルが permissions ベースに変更され、`allowlist` 設定方式が大幅に異なる。v2 の安定性が不十分な場合は v1 を選択する必要があるが、v1 は将来メンテナンス終了のリスクがある。
**対策:** M1-02 で開発開始時点の安定版を評価し、IPC 境界設計（`allowlist` / permissions による `fs` スコープ制限、WebView 直接ファイルアクセス遮断）の実装方式をバージョンに応じて確定する。v1 → v2 マイグレーションの影響範囲を M1-03 の段階で文書化する。

### R3: ファイル全走査検索のスケーラビリティ

**影響:** `module:storage`（`search_notes`, `list_notes`）、`module:grid`
**詳細:** 全文検索はインデックスエンジンなしの `str::to_lowercase().contains()` によるファイル全走査であるため、ノート蓄積が 5,000 件を超過すると `search_notes` の 200ms 以下閾値を超過するリスクがある。
**対策:** M5-05 のパフォーマンス計測で 1,000 件での応答時間を測定し、5,000 件到達時の推定を算出する。閾値超過が予測される場合は `tantivy` クレート（Rust 製全文検索エンジン）の導入計画を策定する。初期リリースでは全走査方式とし、ユーザーのノート蓄積が 5,000 件に達する前にインデックスエンジンを導入する。

### R4: CodeMirror 6 の IME 統合

**影響:** `module:editor`
**詳細:** CodeMirror 6 の日本語 IME 対応は WebKitGTK（Linux）と WKWebView（macOS）で挙動が異なる可能性がある。特に IME のコンポジション中の `EditorView.updateListener` 発火タイミングが環境依存であり、自動保存のデバウンスに影響する。
**対策:** M3-05 の自動保存実装時に両プラットフォームで IME 入力テストを実施する。`docChanged` が IME コンポジション完了前に誤発火する場合、`compositionstart` / `compositionend` イベントによるデバウンス一時停止ロジックを追加する。

### R5: 同一秒ファイル名衝突

**影響:** `module:storage`（`create_note`）
**詳細:** ファイル名形式 `YYYY-MM-DDTHHMMSS.md` は秒精度であるため、高速連続で `Cmd+N` / `Ctrl+N` を押下した場合にファイル名が衝突する可能性がある。`_1`, `_2` サフィックス付与で回避するが、既存ファイルの走査コストが増加する。
**対策:** M2-01 でサフィックス付与ロジックを実装し、ユニットテストで連続作成シナリオを検証する。頻発が確認された場合は OQ-SF-001 の判断としてミリ秒精度タイムスタンプ（`YYYY-MM-DDTHHMMSS.SSS.md`）への変更を検討する。

### R6: 配布パッケージの多形式対応工数

**影響:** M6 全体
**詳細:** Linux だけで `.AppImage`, `.deb`, Flatpak（Flathub）, NixOS パッケージの4形式、macOS で `.dmg` + Homebrew Cask の2形式、合計6形式の配布パッケージを作成・テストする必要がある。各形式固有のビルド設定・メタデータ・依存関係解決に予想以上の工数がかかるリスクがある。
**対策:** M6 に2週間を確保し、Tauri の標準ビルド出力（`.AppImage`, `.deb`, `.dmg`）を優先的に完成させる。Flatpak・NixOS パッケージ・Homebrew Cask はコミュニティの既存テンプレートを活用し、並行して作業する。CI にマルチプラットフォームビルドマトリクスを構成し、自動化を最大限活用する。

### R7: 設定ディレクトリ変更後の既存ノート非移動

**影響:** `module:settings`, `module:storage`, ユーザー体験
**詳細:** 保存ディレクトリ変更後、既存ノートは自動移動されない。ユーザーが手動移動を忘れた場合、旧ディレクトリのノートが見えなくなる。
**対策:** M5-01 の設定画面で「既存ノートは新しいディレクトリに自動移動されません」という明示的な警告メッセージを表示する。将来的な移動支援機能は OQ-SF-003 として保留し、ユーザーフィードバック収集後に検討する。

### リリース不可制約の遵守確認

本実装計画は以下のリリース不可制約を全マイルストーンにわたって遵守する。各制約の検証タイミングを明示する。

| 制約 | 内容 | 検証マイルストーン |
|------|------|-------------------|
| `platform:linux`, `platform:macos` | Linux（バイナリ・Flatpak・NixOS）および macOS（バイナリ・Homebrew Cask）配布必須。Windows は対象外 | M1（ビルド確認）、M6（全配布形式テスト） |
| `module:editor` 完了 | CodeMirror 6 Markdown 編集、frontmatter デコレーション、自動保存、1クリックコピー、Cmd+N/Ctrl+N | M3（実装完了）、M5（統合テスト） |
| `module:grid` 完了 | Masonry カード、7日間デフォルト、タグ/日付フィルタ、全文検索、カードクリック遷移 | M4（実装完了）、M5（統合テスト） |
| `module:storage` 完了 | 全 IPC コマンド実装（CRUD、list、search）、frontmatter パース、ファイル名バリデーション | M2（実装完了）、M5（統合テスト） |
| `module:settings` 完了 | `get_config` / `set_config` 実装、ディレクトリ選択 UI | M2（Rust 側）、M5（UI 側、統合テスト） |
| `framework:tauri` IPC 境界 | 全ファイル操作は Rust バックエンド経由。WebView 直接ファイルアクセス禁止 | M1（allowlist 設定）、M5（セキュリティテスト） |
| 設定永続化バックエンド排他 | 設定変更は Rust バックエンドで永続化。フロントエンド単独でのファイルパス操作禁止 | M2（Rust 実装）、M5（統合テスト） |
| スコープ外機能の不在 | AI 呼び出し・クラウド同期・Markdown プレビュー・モバイル対応・タイトル入力欄・手動保存ボタン・Windows ビルドが存在しない | M5-08（チェックリスト確認）、M6（最終確認） |
