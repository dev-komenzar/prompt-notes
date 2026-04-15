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
  - id: detail:feed_search
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
    - module:feed
    - module:storage
    - module:settings
    reason: 全必須機能の実装・テスト完了までリリース不可。AI呼び出し・クラウド同期・Markdownプレビュー・モバイル対応はスコープ外であり実装禁止。
  modules:
  - editor
  - feed
  - storage
  - settings
  - shell
---

# Implementation Plan

## 1. Overview

本実装計画は PromptNotes の全モジュール（`module:editor`, `module:feed`, `module:storage`, `module:settings`）および Tauri シェル層（`module:shell`）を、設計書群（Component Architecture, Editor & Clipboard Design, Storage & File Format Design, Feed & Search Design）に基づいて段階的に実装するためのスプリント構成・成果物・検証基準を定義する。

### 対象プラットフォーム

| プラットフォーム | 配布形式 | 備考 |
|---|---|---|
| Linux | `.deb`, `.AppImage`, Flatpak | デフォルト保存ディレクトリ: `~/.local/share/promptnotes/notes/` |
| macOS | `.dmg`, Homebrew Cask | デフォルト保存ディレクトリ: `~/Library/Application Support/promptnotes/notes/` |

Windows は対象外であり、ビルドターゲット・CI パイプライン・テストマトリクスに含めない。

### 対象モジュールとスコープ

全 4 必須モジュール（`module:editor`, `module:feed`, `module:storage`, `module:settings`）の実装・テスト完了がリリースの前提条件である。以下の機能はスコープ外であり実装を禁止する。

- AI 呼び出し機能（ネットワークアクセス禁止。CSP `connect-src 'none'`、Cargo.toml に HTTP クレート不使用で構造的に強制）
- クラウド同期
- Markdown プレビュー / HTML レンダリング（CodeMirror 6 はシンタックスハイライトのみ）
- モバイル対応

### リリースブロッキング制約の実装計画への反映

| 制約カテゴリ | 制約内容 | 実装計画での反映箇所 |
|---|---|---|
| プラットフォーム | Linux・macOS 配布必須、Windows 対象外 | Sprint 6 でクロスプラットフォームビルド・E2E テストを Linux/macOS の 2 環境で実施。CI マトリクスは `ubuntu-latest` + `macos-latest` |
| 必須モジュール | `module:editor`, `module:feed`, `module:storage`, `module:settings` 全完了必須 | Sprint 1〜5 で全モジュールを段階的に実装。Sprint 6 で結合テスト・E2E テストにより全モジュールの動作を検証 |
| IPC 境界 | フロントエンドからの直接ファイルシステムアクセス禁止。全ファイル操作は Rust バックエンド経由 | Sprint 1 で `tauri-commands.ts` IPC ラッパーと ESLint `no-restricted-imports` ルール（`@tauri-apps/plugin-fs` 禁止）を設定。全スプリントで IPC 経由を強制 |
| 設定変更 | 設定変更は Rust バックエンド経由で永続化。フロントエンド単独でのファイルパス操作禁止 | Sprint 4 で `set_config` IPC コマンドを唯一の設定変更エントリポイントとして実装。フロントエンドはパス文字列の送信のみ |
| エディタ | CodeMirror 6 必須、Markdown レンダリング禁止、frontmatter 背景色区別必須、タイトル入力欄禁止 | Sprint 2 で CodeMirror 6 拡張構成（`@codemirror/lang-markdown` + `frontmatterDecoration` ViewPlugin）を実装。禁止拡張の不在を単体テストで検証 |
| コピー | 1 クリックコピーボタンによる本文全体コピー必須。Web Clipboard API 禁止 | Sprint 2 で `CopyButton.svelte` → `tauri-commands.ts` → `commands/clipboard.rs` → `clipboard-manager` プラグインの IPC フローを実装。ESLint `no-restricted-globals` で `navigator.clipboard` を禁止 |
| ショートカット | Cmd+N / Ctrl+N で即座に新規ノート作成・フォーカス移動必須 | Sprint 1 で `tauri-plugin-global-shortcut` による `CmdOrCtrl+N` 登録を実装。Sprint 2 で新規カード生成→CodeMirror 6 フォーカスまでの 200ms 以内完了を E2E テストで検証 |
| ストレージ | ファイル名 `YYYY-MM-DDTHHMMSS.md` 不変、frontmatter は YAML `tags` のみ、自動保存必須 | Sprint 1 で `file_manager.rs`・`frontmatter.rs` を実装。ファイル名バリデーション正規表現・frontmatter スキーマ・自動保存トリガーを単体テストで検証 |
| フィード | デフォルト 7 日間フィルタ、降順表示、タグ/日付フィルタ・全文検索必須 | Sprint 3 で `Feed.svelte`・`SearchBar.svelte`・`TagFilter.svelte`・`DateFilter.svelte` と `storage/search.rs` を実装。フィルタリングロジックは Rust 側で実行 |
| 保存ディレクトリ | Linux/macOS 別デフォルトパス、設定から変更可能 | Sprint 1 で `config/mod.rs` に `app_data_dir()` ベースのパス解決を実装。Sprint 4 で `SettingsModal.svelte` からのディレクトリ変更フローを実装 |
| ネットワーク禁止 | AI 呼び出し・クラウド同期はスコープ外で実装禁止 | Sprint 1 で `tauri.conf.json` に CSP `connect-src 'none'` を設定。Cargo.toml に HTTP クレート（`reqwest`, `hyper`）を含めない。package.json に `axios` 等を含めない |

### 技術スタック

| レイヤー | 技術 | バージョン基準 |
|---|---|---|
| シェル | Tauri v2 | 最新安定版 |
| フロントエンド | Svelte + TypeScript | Svelte 4.x / TypeScript 5.x |
| エディタ | CodeMirror 6 | `@codemirror/view` 6.x |
| バックエンド | Rust | Edition 2021 |
| frontmatter パース | `serde_yaml` | 最新安定版 |
| ゴミ箱操作 | `trash` クレート | Linux: freedesktop trash spec、macOS: NSFileManager |
| 日時処理 | `chrono` | 最新安定版 |

## 2. Milestones

| Sprint | 主要成果物 | 対象モジュール | 前提 |
|---|---|---|---|
| Sprint 1 | Tauri プロジェクト骨格 + Rust バックエンド基盤 | `module:shell`, `module:storage`, `module:settings` | なし |
| Sprint 2 | エディタ・クリップボード・自動保存 | `module:editor`, `module:shell` | Sprint 1 |
| Sprint 3 | フィード表示・フィルタ・全文検索 | `module:feed`, `module:storage` | Sprint 1, 2 |
| Sprint 4 | 設定画面・ディレクトリ変更・ファイル移動 | `module:settings` | Sprint 1, 3 |
| Sprint 5 | 削除操作・エラーハンドリング・ウィンドウクローズ保存 | `module:editor`, `module:storage`, `module:shell` | Sprint 1〜4 |
| Sprint 6 | 結合テスト・E2E テスト・クロスプラットフォームビルド | 全モジュール | Sprint 1〜5 |

## 3. Sprint 詳細

#### Sprint 1: Tauri プロジェクト骨格 + Rust バックエンド基盤

**目標:** Tauri v2 アプリケーションの初期化、Rust バックエンドの `storage/` および `config/` モジュールの実装、IPC 境界の確立。

**成果物:**

| # | 成果物 | ファイル | 詳細 |
|---|---|---|---|
| 1-1 | Tauri プロジェクト初期化 | `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, `package.json` | ウィンドウサイズ 1280×720。capabilities 設定で `fs` プラグインの WebView 直接アクセスを禁止。CSP `connect-src 'none'` でネットワークリクエストをブロック。`Cargo.toml` に `reqwest`/`hyper` を含めない。`package.json` に `axios` 等を含めない |
| 1-2 | `main.rs` エントリポイント | `src-tauri/src/main.rs` | Tauri Builder にプラグイン（`fs`, `clipboard-manager`, `dialog`, `global-shortcut`）を登録。IPC コマンド（`create_note`, `save_note`, `delete_note`, `force_delete_note`, `read_note`, `list_notes`, `search_notes`, `list_all_tags`, `move_notes`, `get_config`, `set_config`, `copy_to_clipboard`）を登録 |
| 1-3 | `file_manager.rs` | `src-tauri/src/storage/file_manager.rs` | `generate_filename()`: `chrono::Local::now()` → `YYYY-MM-DDTHHMMSS.md` 形式。同一秒衝突時は 1 秒待機再生成。`validate_filename()`: 正規表現 `^\d{4}-\d{2}-\d{2}T\d{6}\.md$` + パスセパレータ検査 + `canonicalize` で `notes_dir` 配下検証。`write_file()`: 一時ファイル → `rename` のアトミック書き込み。`read_file()`, `delete_file()`: バリデーション後にファイル操作 |
| 1-4 | `frontmatter.rs` | `src-tauri/src/storage/frontmatter.rs` | `NoteFrontmatter { tags: Vec<String>, extra: HashMap<String, Value> }` を `serde_yaml` でパース/シリアライズ。未知フィールドは `#[serde(flatten)]` で保持。空 frontmatter 高速生成: 固定文字列 `"---\ntags: []\n---\n"` を直接返却 |
| 1-5 | `search.rs` スタブ | `src-tauri/src/storage/search.rs` | `full_scan()` のインターフェース定義と空実装（Sprint 3 で本実装） |
| 1-6 | `config/mod.rs` | `src-tauri/src/config/mod.rs` | `AppConfig { notes_dir: String }` を `config.json` で永続化。`app_data_dir()` でOS別デフォルトパスを解決（Linux: `~/.local/share/promptnotes/`, macOS: `~/Library/Application Support/promptnotes/`）。`config.json` 不在時はデフォルト値で新規作成。`set_config` 時のディレクトリ検証: `canonicalize` → 存在確認 → `create_dir_all` → 書き込み権限テスト（`.promptnotes_write_test` ファイル作成・削除） |
| 1-7 | `commands/notes.rs` | `src-tauri/src/commands/notes.rs` | `NoteMetadata`, `ListNotesResult`, `SearchNotesResult`, `SearchResultEntry`, `HighlightRange`, `ListOptions` 構造体定義。`create_note`, `save_note`, `read_note`, `list_notes` の IPC コマンド実装。統一エラー型 `TauriCommandError { code: String, message: String }` |
| 1-8 | `commands/config.rs` | `src-tauri/src/commands/config.rs` | `get_config`, `set_config` の IPC コマンド実装 |
| 1-9 | `commands/clipboard.rs` スタブ | `src-tauri/src/commands/clipboard.rs` | `copy_to_clipboard` のインターフェース定義（Sprint 2 で本実装） |
| 1-10 | `tauri-commands.ts` | `src/lib/utils/tauri-commands.ts` | 全 IPC コマンドの型安全ラッパー定義。TypeScript 型: `NoteMetadata`, `ListNotesResult`, `SearchNotesResult`, `SearchResultEntry`, `HighlightRange`, `AppConfig`, `TauriCommandError`。関数: `createNote()`, `saveNote()`, `deleteNote()`, `forceDeleteNote()`, `readNote()`, `listNotes()`, `searchNotes()`, `listAllTags()`, `moveNotes()`, `getConfig()`, `setConfig()`, `copyToClipboard()` |
| 1-11 | `timestamp.ts` | `src/lib/utils/timestamp.ts` | `filenameToDate(filename: string): Date` — ファイル名 `YYYY-MM-DDTHHMMSS.md` をパースして `Date` オブジェクトに変換。`dateToFilenamePrefix(date: Date): string` — 日付を `YYYY-MM-DDTHHMMSS` 形式に変換（IPC パラメータ用） |
| 1-12 | ESLint 設定 | `.eslintrc.json` | `no-restricted-imports`: `@tauri-apps/plugin-fs`（直接ファイルシステムアクセス禁止）、`@tauri-apps/plugin-clipboard-manager`（直接クリップボードアクセス禁止）。`no-restricted-globals`: `navigator.clipboard`（Web Clipboard API 禁止） |
| 1-13 | グローバルショートカット登録 | `src-tauri/src/main.rs` | `tauri-plugin-global-shortcut` で `CmdOrCtrl+N` を登録し、`new-note` イベントを WebView に emit |
| 1-14 | Svelte プロジェクト初期化 | `src/`, `svelte.config.js`, `vite.config.ts` | Svelte 4.x + TypeScript 5.x。ルートコンポーネント `App.svelte` のスケルトン |

**検証基準:**

| テスト種別 | 対象 | 基準 |
|---|---|---|
| 単体テスト (Rust) | `file_manager.rs` | `generate_filename()` がパターン合致するファイル名を生成。`validate_filename()` が不正ファイル名・パストラバーサルを拒否。アトミック書き込みが完了 |
| 単体テスト (Rust) | `frontmatter.rs` | `tags: [a, b]` のパース・シリアライズが往復一致。未知フィールドが保持される。空 frontmatter 高速生成が `"---\ntags: []\n---\n"` を返却 |
| 単体テスト (Rust) | `config/mod.rs` | デフォルトパス生成が OS 別に正しい。`config.json` 不在時の新規作成。無効ディレクトリの拒否 |
| 単体テスト (Rust) | `commands/notes.rs` | `create_note` がファイルを作成し `NoteMetadata` を返却。`save_note` がファイルを上書き。`list_notes` が降順ソート済み `ListNotesResult` を返却 |
| 単体テスト (TS) | `timestamp.ts` | ファイル名↔日時変換の正確性 |
| ESLint チェック | 全フロントエンドファイル | 禁止インポート・禁止グローバルの違反ゼロ |

---

#### Sprint 2: エディタ・クリップボード・自動保存

**目標:** CodeMirror 6 エディタの実装、1 クリックコピー機能、自動保存トリガー、新規ノート作成ショートカットの完全動作。

**成果物:**

| # | 成果物 | ファイル | 詳細 |
|---|---|---|---|
| 2-1 | `NoteEditor.svelte` | `src/lib/components/NoteEditor.svelte` | CodeMirror 6 EditorView のライフサイクル管理（`onMount` で生成、`onDestroy` で `destroy()`）。拡張セット: `@codemirror/lang-markdown` + `@codemirror/language-data`（シンタックスハイライト）、`syntaxHighlighting(defaultHighlightStyle)`、`keymap.of(defaultKeymap)`、`frontmatterDecoration()`（ViewPlugin）、`EditorView.theme()`、`EditorView.lineWrapping`。DOM 構造は `<div class="note-editor"><div bind:this={editorContainer}></div></div>` のみ。タイトル入力欄（`<input>`, `<textarea>`, `<h1>`）は一切なし。Markdown HTML レンダリング / プレビュー拡張は禁止 |
| 2-2 | `frontmatter-decoration.ts` | `src/lib/components/frontmatter-decoration.ts` | `ViewPlugin` + `Decoration.line` による frontmatter 領域（`---` 〜 `---`）の背景色装飾。CSS クラス `.cm-frontmatter-line` に `background-color: rgba(59, 130, 246, 0.08)` を適用。`docChanged` または `viewportChanged` 時に再計算 |
| 2-3 | `NoteCard.svelte` | `src/lib/components/NoteCard.svelte` | 2 状態ステートマシン（ViewMode / EditMode）。ViewMode: 本文プレビュー（frontmatter 除去済み）、タグ表示、タイムスタンプ表示、CopyButton、DeleteButton。EditMode: NoteEditor のマウント。自動保存トリガー: カード外クリック・別カード選択時に `saveNote(filename, rawMarkdown)` を呼び出し → ViewMode 遷移。保存失敗時はエディタ維持でエラー表示 |
| 2-4 | `CopyButton.svelte` | `src/lib/components/CopyButton.svelte` | ViewMode 時のみ表示。`frontmatter.ts` の `extractBody()` で frontmatter 除去済み本文を取得 → `tauri-commands.ts` の `copyToClipboard()` で IPC 経由コピー。成功フィードバック: アイコン「✓」+ `text-green-500`、2,000ms 後に復帰。失敗フィードバック: アイコン「✕」+ `text-red-500`、3,000ms 後に復帰。フィードバック中は `disabled` で連打防止 |
| 2-5 | `DeleteButton.svelte` | `src/lib/components/DeleteButton.svelte` | `deleteNote()` IPC 呼び出し。`trash` クレートでゴミ箱移動（確認ダイアログなし）。`TRASH_FAILED` エラー時のみ「完全削除」確認ダイアログ表示 → `forceDeleteNote()` |
| 2-6 | `frontmatter.ts` | `src/lib/utils/frontmatter.ts` | 読み取り専用の軽量パース。`extractBody(rawMarkdown: string): string` — 先頭 `---\n...\n---\n` を正規表現 `/^---\n[\s\S]*?\n---\n/` で除去。`extractTags(rawMarkdown: string): string[]` — frontmatter から tags 配列を抽出（表示用）。書き込み・正規化は禁止（Rust 側 `frontmatter.rs` が正規所有者） |
| 2-7 | `commands/clipboard.rs` 本実装 | `src-tauri/src/commands/clipboard.rs` | `copy_to_clipboard` コマンド: Tauri `clipboard-manager` プラグインの `clipboard.write_text(text)` を呼び出し。エラー時は `CLIPBOARD_FAILED` コードで `TauriCommandError` を返却 |
| 2-8 | `Header.svelte` スケルトン | `src/lib/components/Header.svelte` | New ボタン（`new-note` イベント受信時に `createNote()` → フィードに prepend）、⚙️ ボタン（設定モーダル表示）。SearchBar・フィルタは Sprint 3 で接続。アプリ名は表示しない |
| 2-9 | 新規ノート作成フロー | `Header.svelte` + `Feed.svelte` + `NoteCard.svelte` | `listen("new-note")` → 既存編集中カードの自動保存 → `createNote()` IPC → フィード先頭に新規カード prepend（EditMode）→ CodeMirror 6 フォーカス。合計 200ms 以内 |

**検証基準:**

| テスト種別 | 対象 | 基準 |
|---|---|---|
| 単体テスト (Rust) | `commands/clipboard.rs` | `copy_to_clipboard` がエラーなく完了 |
| 単体テスト (TS) | `frontmatter.ts` | `extractBody()` が frontmatter を正しく除去。frontmatter なしの入力をそのまま返却 |
| コンポーネントテスト | `NoteEditor.svelte` | CodeMirror 6 がマウントされ `.cm-editor` 要素が存在。タイトル入力欄（`<input>`, `<textarea>`）が存在しない。frontmatter 行に `.cm-frontmatter-line` クラスが適用 |
| コンポーネントテスト | `CopyButton.svelte` | クリック後にアイコンが「✓」に変化し 2,000ms 後に復帰 |
| E2E テスト | 新規ノート作成 | Cmd+N / Ctrl+N → エディタフォーカスまで 200ms 以内。作成されたファイルが `YYYY-MM-DDTHHMMSS.md` 形式 |
| E2E テスト | 自動保存 | カード外クリック → ファイル内容が永続化。100ms 以内完了 |
| E2E テスト | コピー | CopyButton クリック → クリップボード内容が frontmatter 除去済み本文と一致。100ms 以内完了 |

---

#### Sprint 3: フィード表示・フィルタ・全文検索

**目標:** ノートカード一覧の降順表示、デフォルト 7 日間フィルタ、タグ/日付フィルタ、全文検索、スクロールロードの完全動作。

**成果物:**

| # | 成果物 | ファイル | 詳細 |
|---|---|---|---|
| 3-1 | `Feed.svelte` | `src/lib/components/Feed.svelte` | `filters` store の reactive 監視 → `query` 空: `listNotes()` / `query` 非空: `searchNotes()` を自動発行。結果を `notes` store・`searchResults` store・`totalCount` store に反映。カード一覧を降順レンダリング。編集状態調停: `editingFilename: string | null` で同時編集カード最大 1 つを強制。スクロール末尾到達で `loadNextPage()`（`offset += 100`）。`totalCount` 超過時は追加取得しない |
| 3-2 | `SearchBar.svelte` | `src/lib/components/SearchBar.svelte` | 検索クエリ入力 UI。300ms デバウンス（`setTimeout` ベース）後に `filters.ts` の `query` を更新。空文字列で `list_notes` フォールバック |
| 3-3 | `TagFilter.svelte` | `src/lib/components/TagFilter.svelte` | タグ選択 UI（複数選択、OR 条件）。2 モード切替: デフォルト状態（`tags=[]` かつ `query=""`）→ `listAllTags()` IPC で全タグ取得。フィルタ適用中 → `notes` store から `tags` を集約。タグ選択/解除で `filters.ts` の `tags` を更新 |
| 3-4 | `DateFilter.svelte` | `src/lib/components/DateFilter.svelte` | 日付範囲選択 UI。`fromDate`/`toDate` を `filters.ts` に反映 |
| 3-5 | `filters.ts` | `src/lib/stores/filters.ts` | `Writable<{ fromDate: string, toDate: string, tags: string[], query: string }>`。初期値: `fromDate` = 7 日前 `00:00:00`、`toDate` = 現在日時、`tags` = `[]`、`query` = `""`。アプリ再起動でデフォルトリセット |
| 3-6 | `notes.ts` | `src/lib/stores/notes.ts` | `Writable<NoteMetadata[]>`。`list_notes` / `search_notes` レスポンス受信時、`create_note` / `delete_note` 成功時に更新 |
| 3-7 | `searchResults.ts` | `src/lib/stores/searchResults.ts` | `Writable<SearchResultEntry[] | null>`。`search_notes` 時に `SearchResultEntry[]` を設定。`list_notes` フォールバック時に `null` にリセット |
| 3-8 | `totalCount.ts` | `src/lib/stores/totalCount.ts` | `Writable<number>`。`list_notes` / `search_notes` レスポンスの `total_count` で更新。スクロールロード次ページ判定に使用 |
| 3-9 | `search.rs` 本実装 | `src-tauri/src/storage/search.rs` | `full_scan()`: `notes_dir` 全 `.md` ファイル走査。処理順序: ファイル名日付フィルタ → `read_to_string` → `frontmatter.rs` でタグ抽出 → タグ OR フィルタ → 本文 + frontmatter で `query` 部分一致検索（大文字小文字無視、`str::to_lowercase().contains()`）→ スニペット生成（マッチ箇所前後各 50 文字、単語境界拡張）→ `HighlightRange` 算出（スニペット内相対オフセット）→ `created_at` 降順ソート → `total_count` 記録後 `offset`/`limit` でスライス |
| 3-10 | `list_all_tags` コマンド | `src-tauri/src/commands/notes.rs` | `notes_dir` 全 `.md` ファイルの frontmatter `tags` を集約。重複排除・アルファベット順ソートして `Vec<String>` を返却 |
| 3-11 | `list_notes` ページネーション拡張 | `src-tauri/src/commands/notes.rs` | `list_notes` コマンドに `limit`（デフォルト 100）・`offset`（デフォルト 0）パラメータを追加。レスポンスを `ListNotesResult { notes, total_count }` に変更 |
| 3-12 | `Header.svelte` 完成 | `src/lib/components/Header.svelte` | Sprint 2 のスケルトンに SearchBar、TagFilter、DateFilter を統合。アプリ名は表示しない |
| 3-13 | `NoteCard.svelte` 検索表示対応 | `src/lib/components/NoteCard.svelte` | `searchResults` store 非 `null` 時: `body_preview` の代わりにスニペットを表示し、`highlights` 範囲を `<mark>` タグで強調 |

**検証基準:**

| テスト種別 | 対象 | 基準 |
|---|---|---|
| 単体テスト (Rust) | `search.rs` | 部分一致検索が大文字小文字無視で動作。スニペット生成がマッチ箇所前後 50 文字を含む。`HighlightRange` が正しい相対オフセット |
| 単体テスト (Rust) | `list_all_tags` | 全ファイルからタグを集約・重複排除・ソート |
| 単体テスト (Rust) | `list_notes` (ページネーション) | `offset=0, limit=100` で先頭 100 件返却。`total_count` がフィルタ条件合致全数 |
| コンポーネントテスト | `Feed.svelte` | フィルタ変更で IPC 再発行。降順レンダリング |
| コンポーネントテスト | `SearchBar.svelte` | 300ms デバウンス後に `filters.query` 更新 |
| コンポーネントテスト | `TagFilter.svelte` | デフォルト状態で `listAllTags()` 呼び出し。タグ選択で `filters.tags` 更新 |
| E2E テスト | フィード初期表示 | アプリ起動 → 7 日間分のノートが降順表示。2 秒以内 |
| E2E テスト | 全文検索 | クエリ入力 → マッチ結果表示 + スニペット + ハイライト。200ms 以内（数十件規模） |
| E2E テスト | タグフィルタ | タグ選択 → OR 条件でフィルタ適用。200ms 以内 |
| E2E テスト | スクロールロード | 100 件超のノート → スクロール末尾到達で次ページ追加 |

---

#### Sprint 4: 設定画面・ディレクトリ変更・ファイル移動

**目標:** 設定モーダルの実装、保存ディレクトリの変更フロー（Rust バックエンド経由の検証・永続化）、ファイル移動の確認ダイアログ。

**成果物:**

| # | 成果物 | ファイル | 詳細 |
|---|---|---|---|
| 4-1 | `SettingsModal.svelte` | `src/lib/components/SettingsModal.svelte` | ⚙️ ボタンで表示するモーダル。`getConfig()` で現在設定を取得・表示。Tauri `dialog` プラグインでディレクトリ選択 → パス文字列を `setConfig({ notes_dir })` で送信。パス解決・検証・書き込みはフロントエンドでは一切行わない |
| 4-2 | `config.ts` store | `src/lib/stores/config.ts` | `Writable<{ notes_dir: string }>`。`getConfig` レスポンス / `setConfig` 成功時に更新 |
| 4-3 | ファイル移動確認ダイアログ | `SettingsModal.svelte` | `setConfig` 成功後に「ノートを新しいディレクトリに移動しますか？」ダイアログ表示。「移動する」→ `moveNotes()` IPC → 結果通知（「12件移動、2件スキップ」）。「移動しない」→ 新ディレクトリの `listNotes()` で読み込み |
| 4-4 | `move_notes` コマンド | `src-tauri/src/commands/notes.rs` | 旧ディレクトリの `.md` ファイルを新ディレクトリに移動。同名ファイル存在時はスキップ（上書きなし）。レスポンス: `{ moved: u32, skipped: u32 }` |
| 4-5 | 設定変更後のフィード再読み込み | `SettingsModal.svelte` → `Feed.svelte` | ディレクトリ変更完了後にフィルタ store を維持したまま `listNotes()` を再発行し、新ディレクトリのノートを表示 |

**検証基準:**

| テスト種別 | 対象 | 基準 |
|---|---|---|
| 単体テスト (Rust) | `set_config` | 有効ディレクトリの設定成功。無効ディレクトリ（存在しない・書き込み不可）の拒否。`config.json` の永続化 |
| 単体テスト (Rust) | `move_notes` | ファイル移動成功。同名ファイルのスキップ。移動件数・スキップ件数の正確性 |
| E2E テスト | ディレクトリ変更フロー | ダイアログでディレクトリ選択 → 設定保存 → ファイル移動 → 新ディレクトリのノートがフィードに表示 |
| E2E テスト | 無効ディレクトリ | 読み取り専用ディレクトリの選択 → エラーメッセージ表示 |

---

#### Sprint 5: 削除操作・エラーハンドリング・ウィンドウクローズ保存

**目標:** ゴミ箱連携削除、統一エラーハンドリング、ウィンドウクローズ時の自動保存、エッジケース対応。

**成果物:**

| # | 成果物 | ファイル | 詳細 |
|---|---|---|---|
| 5-1 | `delete_note` + `trash` 連携 | `src-tauri/src/commands/notes.rs`, `storage/file_manager.rs` | `trash::delete()` でゴミ箱移動（確認ダイアログなし）。失敗時は `TRASH_FAILED` エラー返却 |
| 5-2 | `force_delete_note` | `src-tauri/src/commands/notes.rs` | `std::fs::remove_file()` による完全削除。`TRASH_FAILED` 後のフォールバック用 |
| 5-3 | フロントエンドエラーハンドリング | `tauri-commands.ts`, 各コンポーネント | `TauriCommandError` の `code` で分岐。`STORAGE_NOT_FOUND` → カードをフィードから除去。`STORAGE_WRITE_FAILED` → エラー表示。`CONFIG_INVALID_DIR` → 設定画面誘導。`TRASH_FAILED` → 完全削除確認ダイアログ。`CLIPBOARD_FAILED` → コピー失敗フィードバック。エラー `message` はコンソールに出力 |
| 5-4 | ウィンドウクローズ時の自動保存 | `main.rs`, `App.svelte` | Tauri `close-requested` イベントをフック → `before-close` イベントを WebView に emit → フロントエンドが編集中コンテンツを `saveNote()` → 保存完了後にクローズ許可 |
| 5-5 | 新規ノート作成デバウンス | `Header.svelte` | Cmd+N 連打対策: 500ms デバウンスで `createNote()` の重複呼び出しを防止 |
| 5-6 | ディレクトリ不在時のフォールバック | `config/mod.rs` | `notes_dir` が起動時に無効（削除済み等）の場合、デフォルトパスにフォールバック + 警告ログ出力 |

**検証基準:**

| テスト種別 | 対象 | 基準 |
|---|---|---|
| 単体テスト (Rust) | `delete_note` | ゴミ箱移動成功。存在しないファイルで `STORAGE_NOT_FOUND` |
| 単体テスト (Rust) | `force_delete_note` | `remove_file` による完全削除 |
| E2E テスト | 削除フロー | DeleteButton クリック → ファイルがゴミ箱に移動 → フィードから除去 |
| E2E テスト | ゴミ箱失敗フォールバック | ゴミ箱無効環境 → 確認ダイアログ → 「削除する」→ 完全削除 |
| E2E テスト | ウィンドウクローズ | 編集中にウィンドウ閉じ → ファイル内容が保存済み |
| E2E テスト | エラーハンドリング | 各エラーコードに対応するフロントエンド表示の正確性 |

---

#### Sprint 6: 結合テスト・E2E テスト・クロスプラットフォームビルド

**目標:** 全モジュールの結合テスト、クロスプラットフォーム E2E テスト、リリースビルドの生成と検証。

**成果物:**

| # | 成果物 | 詳細 |
|---|---|---|
| 6-1 | 結合テスト | 全 IPC コマンドのフロントエンド→バックエンド結合テスト。フィルタ変更 → IPC → ストア更新 → UI 反映の一貫性検証 |
| 6-2 | E2E テスト（Linux） | `xvfb-run` 仮想ディスプレイ上で実行。テストマトリクス: 新規ノート作成、自動保存、コピー、削除、フィード表示、タグフィルタ、日付フィルタ、全文検索、設定変更、スクロールロード |
| 6-3 | E2E テスト（macOS） | ネイティブ実行。同一テストマトリクス |
| 6-4 | パフォーマンステスト | ショートカット→エディタ表示 ≤ 200ms、全文検索 ≤ 200ms（数十件）、自動保存 ≤ 100ms、コピー ≤ 100ms、CodeMirror 6 初期化 ≤ 65ms、アプリ起動→フィード表示 ≤ 2 秒。`performance.now()` ベースで計測 |
| 6-5 | Linux ビルド | `.deb`, `.AppImage`, Flatpak |
| 6-6 | macOS ビルド | `.dmg`, Homebrew Cask |
| 6-7 | CI パイプライン | GitHub Actions。マトリクス: `ubuntu-latest` + `macos-latest`。ステップ: lint → 単体テスト → ビルド → E2E テスト。Windows は対象外 |
| 6-8 | セキュリティ検証 | `tauri.conf.json` の capabilities に `fs` WebView アクセスが含まれないこと。CSP `connect-src 'none'` の設定確認。`Cargo.toml` に HTTP クレート不在。ESLint 違反ゼロ |

**検証基準:**

| テスト種別 | 対象 | 基準 |
|---|---|---|
| 結合テスト | 全 IPC コマンド | フロントエンド → Rust → ファイルシステム → レスポンスの往復が正常 |
| E2E テスト | 全機能（Linux） | 全テストケース PASS |
| E2E テスト | 全機能（macOS） | 全テストケース PASS |
| パフォーマンステスト | 6 指標 | 全閾値クリア |
| ビルド検証 | Linux / macOS | バイナリが正常起動し、基本操作が動作 |

## 4. Risks

| # | リスク | 影響度 | 発生確率 | 対策 |
|---|---|---|---|---|
| R-01 | 全文検索のパフォーマンス劣化（1,000 件超過時に 200ms 超過） | 高 | 中 | Sprint 3 の `search.rs` 実装で日付フィルタによる走査対象の事前絞り込みを最適化。200ms 超過が確認された場合、tantivy + lindera ベースのインデックス検索への移行をバックログに追加。通常使用（数十〜数百件）では全走査で 200ms 以内に収まる見込み |
| R-02 | `trash` クレートの Linux 環境互換性（freedesktop trash spec 非準拠環境） | 中 | 中 | Sprint 5 で `TRASH_FAILED` エラー時のフォールバック（`force_delete_note` による完全削除 + 確認ダイアログ）を実装。Flatpak サンドボックス内での `trash` 動作を Sprint 6 の E2E テストで検証 |
| R-03 | CodeMirror 6 の初期化時間が 65ms を超過 | 中 | 低 | Sprint 2 で最小拡張セットでの初期化時間を計測。超過時は拡張の遅延ロード（`frontmatterDecoration` を `requestIdleCallback` で適用）を検討 |
| R-04 | 同一秒内の複数ノート作成によるファイル名衝突 | 低 | 低 | Sprint 1 で `file_manager.rs` に 1 秒待機再生成を実装。Sprint 5 で `Header.svelte` に 500ms デバウンスを追加。ユーザーが 1 秒以内に複数ノートを作成するユースケースは想定外 |
| R-05 | アトミック書き込み（一時ファイル → `rename`）のパフォーマンス影響で自動保存 100ms 超過 | 中 | 低 | Sprint 1 でアトミック書き込みを実装し計測。超過時は直接上書きにフォールバック。SSD 環境では `rename` のオーバーヘッドは無視可能な範囲 |
| R-06 | `serde_yaml` のシリアライズ出力でフィールド順序が変動し、ユーザーの手動編集した frontmatter のフィールド配置が変わる | 低 | 高 | `tags` フィールドが先頭出力されることのみ保証。未知フィールドは `#[serde(flatten)]` で保持するが順序は `serde_yaml` のデフォルト動作に委ねる。ユーザー影響は軽微（メタデータは `tags` のみが正式フィールド） |
| R-07 | Tauri v2 の `global-shortcut` プラグインが特定 Linux デスクトップ環境（Wayland）でショートカットを捕捉できない | 中 | 中 | Sprint 6 の E2E テストで Wayland 環境（`GDK_BACKEND=wayland`）での動作を検証。非対応の場合は New ボタンのみを代替操作として提供（ショートカット自体は必須要件だが UI ボタンも並行提供済み） |
| R-08 | クロスプラットフォームビルドで macOS のコード署名・公証が CI で失敗 | 中 | 中 | Sprint 6 で Apple Developer Certificate の CI シークレット設定。Homebrew Cask 配布時は `--no-quarantine` インストールガイドを提供。初回リリースでは署名なしバイナリ + Gatekeeper 回避手順をドキュメント化 |
| R-09 | `frontmatter.ts`（フロントエンド読み取り専用パース）と `frontmatter.rs`（Rust 正規パーサー）の動作乖離 | 低 | 中 | フロントエンドの `frontmatter.ts` は表示用の近似値パースのみ。正式データは `list_notes` / `read_note` IPC レスポンスに含まれるパース済み構造化データを使用。コピー操作の本文抽出は `extractBody()` の先頭 `---` ブロック除去のみで十分単純であり乖離リスクは低い |
| R-10 | シンボリックリンク経由のファイルが `canonicalize` で `notes_dir` 外と判定され除外される | 低 | 低 | シンボリックリンク先が `notes_dir` 外の場合は意図的に除外する設計。シンボリックリンク先がディレクトリの場合は再帰走査しない。ドキュメントでシンボリックリンクの制限事項を明記 |
