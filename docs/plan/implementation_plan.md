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

本実装計画は PromptNotes の全モジュール（`module:editor`, `module:feed`, `module:storage`, `module:settings`）および Tauri シェル層（`module:shell`）を、設計書群（Component Architecture, Editor & Clipboard Design, Storage & File Format Design, Feed & Search Design）に基づいて段階的に実装するためのタスク構成・成果物・検証基準を定義する。

### 対象プラットフォーム

| プラットフォーム | 配布形式 | 備考 |
|---|---|---|
| Linux | `.deb`, `.AppImage`, Flatpak | デフォルト保存ディレクトリ: `~/.local/share/com.promptnotes/notes/` |
| macOS | `.dmg`, Homebrew Cask | デフォルト保存ディレクトリ: `~/Library/Application Support/com.promptnotes/notes/` |

Windows は対象外であり、ビルドターゲット・CI パイプライン・テストマトリクスに含めない。本制約は `platform:linux` および `platform:macos` のリリースブロッキング要件に準拠する。

### 対象モジュールとスコープ

全 4 必須モジュール（`module:editor`, `module:feed`, `module:storage`, `module:settings`）の実装・テスト完了がリリースの前提条件である。以下の機能はスコープ外であり実装を禁止する。

- AI 呼び出し機能（ネットワークアクセス禁止。CSP `connect-src 'none'`、Cargo.toml に HTTP クレート不使用で構造的に強制）
- クラウド同期
- Markdown プレビュー / HTML レンダリング（CodeMirror 6 はシンタックスハイライトのみ）
- モバイル対応

### リリースブロッキング制約の実装計画への反映

| 制約カテゴリ | 制約内容 | 実装計画での反映箇所 |
|---|---|---|
| プラットフォーム | Linux・macOS 配布必須、Windows 対象外 | T-27 でクロスプラットフォームビルド・E2E テストを Linux/macOS の 2 環境で実施。CI マトリクスは `ubuntu-latest` + `macos-latest` |
| 必須モジュール | `module:editor`, `module:feed`, `module:storage`, `module:settings` 全完了必須 | T-01〜T-26 で全モジュールを段階的に実装。T-27 で結合テスト・E2E テストにより全モジュールの動作を検証 |
| IPC 境界 | フロントエンドからの直接ファイルシステムアクセス禁止。全ファイル操作は Rust バックエンド経由 | T-05 で `tauri-commands.ts` IPC ラッパーと ESLint `no-restricted-imports` ルール（`@tauri-apps/plugin-fs` 禁止）を設定。全タスクで IPC 経由を強制 |
| 設定変更 | 設定変更は Rust バックエンド経由で永続化。フロントエンド単独でのファイルパス操作禁止 | T-20 で `set_config` IPC コマンドを唯一の設定変更エントリポイントとして実装。フロントエンドはパス文字列の送信のみ |
| エディタ | CodeMirror 6 必須、Markdown レンダリング禁止、frontmatter 背景色区別必須、タイトル入力欄禁止 | T-10 で CodeMirror 6 拡張構成（`@codemirror/lang-markdown` + `frontmatterDecoration` ViewPlugin）を実装。禁止拡張の不在を単体テストで検証 |
| コピー | 1 クリックコピーボタンによる本文全体コピー必須。ViewMode / EditMode の両方で常時利用可能。Web Clipboard API 禁止 | T-13 で `CopyButton.svelte` → `tauri-commands.ts` → `commands/clipboard.rs` → `clipboard-manager` プラグインの IPC フローを実装。ESLint `no-restricted-globals` で `navigator.clipboard` を禁止 |
| ショートカット | Cmd+N / Ctrl+N で即座に新規ノート作成・フォーカス移動必須 | T-04 で `tauri-plugin-global-shortcut` による `CmdOrCtrl+N` 登録を実装。T-16 で新規カード生成→CodeMirror 6 フォーカスまでの 200ms 以内完了を E2E テストで検証 |
| ストレージ | ファイル名 `YYYY-MM-DDTHHMMSS.md` 不変、frontmatter は YAML `tags` のみ、自動保存必須、ADR-008 body 意味論の往復冪等性 | T-02 で `file_manager.rs`・T-03 で `frontmatter.rs` を実装。ファイル名バリデーション正規表現・frontmatter スキーマ・自動保存トリガーを単体テストで検証 |
| フィード | デフォルト 7 日間フィルタ、降順表示、タグ/日付フィルタ・全文検索必須 | T-17〜T-19 で `Feed.svelte`・`Toolbar.svelte`・`SearchBar.svelte`・`TagFilter.svelte`・`DateFilter.svelte` と `storage/search.rs` を実装 |
| 保存ディレクトリ | Linux/macOS 別デフォルトパス（`com.promptnotes` identifier 経由）、設定から変更可能（2 段階確定・移動オプション明示同意必須・起動時自動フォールバック禁止） | T-01 で `tauri.conf.json` の identifier を `com.promptnotes` に固定。T-20〜T-22 で設定変更フロー全体を実装 |
| ネットワーク禁止 | AI 呼び出し・クラウド同期はスコープ外で実装禁止 | T-01 で `tauri.conf.json` に CSP `connect-src 'none'` を設定。Cargo.toml に HTTP クレート（`reqwest`, `hyper`）を含めない |

### 技術スタック

| レイヤー | 技術 | バージョン基準 |
|---|---|---|
| シェル | Tauri v2 | 最新安定版 |
| フロントエンド | Svelte + TypeScript | Svelte 5.x / TypeScript 5.x / Vite 6.x |
| エディタ | CodeMirror 6 | `@codemirror/view` 6.x |
| バックエンド | Rust | Edition 2021 |
| frontmatter パース（Rust） | `serde_yaml` | 最新安定版 |
| frontmatter パース（TS テストスタブ） | `js-yaml` | 最新安定版（devDependencies のみ） |
| ゴミ箱操作 | `trash` クレート | Linux: freedesktop trash spec、macOS: NSFileManager |
| 日時処理 | `chrono` | 最新安定版 |
| 単体テストランナー（TS） | `vitest` | 最新安定版（devDependencies のみ） |
| スタイリング | プレーン CSS + CSS カスタムプロパティ | Tailwind は採用しない。`src/styles/global.css` に `--surface`, `--surface-hover`, `--border`, `--text`, `--accent`, `--success`, `--danger` 等を定義 |

## 2. Milestones

#### M1.1 T-01 Tauri プロジェクト初期化 + Svelte 骨格

**depends_on:** なし

**目標:** Tauri v2 アプリケーションの初期化、プラグイン登録、IPC コマンド登録、Svelte プロジェクト骨格の構築。

**成果物:**

| # | 成果物 | ファイル | 詳細 |
|---|---|---|---|
| 1 | Tauri プロジェクト初期化 | `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, `package.json` | ウィンドウサイズ 1280×720。**`tauri.conf.json` の `identifier` を `com.promptnotes` に固定（ADR-010）**。capabilities 設定で `fs` プラグインの WebView 直接アクセスを禁止。CSP `connect-src 'none'` でネットワークリクエストをブロック。`Cargo.toml` に `reqwest`/`hyper` を含めない。`Cargo.toml` に `dirs` クレートを含めない（ADR-010 で identifier 経由のパス解決を義務化、`dirs::data_dir()` 等の迂回は禁止）。`package.json` に `axios` 等を含めない |
| 2 | `main.rs` エントリポイント | `src-tauri/src/main.rs` | Tauri Builder にプラグイン（`fs`, `clipboard-manager`, `dialog`, `global-shortcut`）を登録。IPC コマンド（`create_note`, `save_note`, `delete_note`, `force_delete_note`, `read_note`, `list_notes`, `search_notes`, `list_all_tags`, `get_config`, `pick_notes_directory`, `set_config`, `copy_to_clipboard`）を登録。`move_notes` は廃止（移動は `set_config` に統合）|
| 3 | 統一エラー型 | `src-tauri/src/error.rs` | `TauriCommandError { code: String, message: String }` と `CommandResult<T>` 型エイリアス、各エラーコードのコンストラクタ |
| 4 | Svelte プロジェクト初期化 | `src/`, `svelte.config.js`, `vite.config.ts` | Svelte 5.x + TypeScript 5.x。ルートコンポーネント `App.svelte` のスケルトン |

**検証基準:**

| テスト種別 | 対象 | 基準 |
|---|---|---|
| ビルド検証 | Tauri プロジェクト | `cargo build` + `npm run build` が成功 |
| 構造検証 | `tauri.conf.json` | identifier が `com.promptnotes`、CSP `connect-src 'none'` が設定済み |

---

#### M1.2 T-02 `file_manager.rs` ファイル CRUD 基盤

**depends_on:** T-01

**目標:** ファイル名生成、バリデーション、アトミック書き込み、読み取り、削除の基盤実装。

**成果物:**

| # | 成果物 | ファイル | 詳細 |
|---|---|---|---|
| 1 | `file_manager.rs` | `src-tauri/src/storage/file_manager.rs` | `generate_filename()`: `chrono::Local::now()` → `YYYY-MM-DDTHHMMSS.md` 形式。同一秒衝突時は 1 秒待機再生成。`validate_filename()`: 正規表現 `^\d{4}-\d{2}-\d{2}T\d{6}\.md$` + パスセパレータ検査 + `canonicalize` で `notes_dir` 配下検証。`write_file()`: 一時ファイル → `rename` のアトミック書き込み。`read_file()`, `delete_file()`: バリデーション後にファイル操作 |

**検証基準:**

| テスト種別 | 対象 | 基準 |
|---|---|---|
| 単体テスト (Rust) | `file_manager.rs` | `generate_filename()` がパターン合致するファイル名を生成。`validate_filename()` が不正ファイル名・パストラバーサルを拒否。アトミック書き込みが完了 |

---

#### M1.3 T-03 `frontmatter.rs` ADR-008 Rust 実装

**depends_on:** T-01

**目標:** YAML frontmatter のパース・シリアライズ、ADR-008 body 意味論の Rust 側単一所有者の実装。

**成果物:**

| # | 成果物 | ファイル | 詳細 |
|---|---|---|---|
| 1 | `frontmatter.rs` | `src-tauri/src/storage/frontmatter.rs` | `NoteFrontmatter { tags: Vec<String>, extra: HashMap<String, Value> }` を `serde_yaml` でパース/シリアライズ。未知フィールドは `#[serde(flatten)]` で保持。`parse(content: &str) -> ParsedNote { tags, body, extra }`: 閉じフェンス `\n---\n` 検出後、直後の区切り `\n` を frontmatter 側の責務として切り詰めて body 開始位置とする。`reassemble(tags: &[String], body: &str) -> String`: frontmatter（末尾 `\n` 付き）の後に区切り `\n` を 1 つ追加して body を連結し、`---\n<yaml>\n---\n\n<body>` 形式を保証。body 空時は末尾 `\n` を残す。空 frontmatter 高速生成: 固定文字列 `"---\ntags: []\n---\n\n"` を直接返却。`#[cfg(test)] mod tests` に `parse → reassemble → parse` の往復冪等性、N 回繰り返しで body 先頭に `\n` が累積しないこと（AC-STOR-06）を検証するテストを配置 |

**検証基準:**

| テスト種別 | 対象 | 基準 |
|---|---|---|
| 単体テスト (Rust) | `frontmatter.rs` | `tags: [a, b]` のパース・シリアライズが往復一致。未知フィールドが保持される。空 frontmatter 高速生成が `"---\ntags: []\n---\n\n"` を返却。`parse → reassemble → parse` の往復冪等性。N 回繰り返しで body 先頭に `\n` が累積しない（AC-STOR-06）。body 空時に末尾 `\n` が残る |

---

#### M1.4 T-04 グローバルショートカット登録

**depends_on:** T-01

**目標:** Rust 側でのグローバルショートカット（Cmd+N / Ctrl+N）登録と `new-note` イベント emit。

**成果物:**

| # | 成果物 | ファイル | 詳細 |
|---|---|---|---|
| 1 | グローバルショートカット登録 | `src-tauri/src/main.rs`（lib.rs の setup 内） | `tauri-plugin-global-shortcut` で `CmdOrCtrl+N` を Rust 側で登録し、発火時に main window へ `new-note` イベントを emit |

---

#### M1.5 T-05 `tauri-commands.ts` IPC ラッパー + ESLint 設定

**depends_on:** T-01

**目標:** フロントエンドの IPC 境界確立。型安全ラッパーと構造的制約の強制。

**成果物:**

| # | 成果物 | ファイル | 詳細 |
|---|---|---|---|
| 1 | `tauri-commands.ts` | `src/shell/tauri-commands.ts` | 全 IPC コマンドの型安全ラッパー定義。TypeScript 型: `NoteMetadata`, `ListNotesResult`, `SearchNotesResult`, `SearchResultEntry`, `HighlightRange`, `AppConfig`, `SetConfigResult`, `TauriCommandError`。関数: `createNote()`, `saveNote()`, `deleteNote()`, `forceDeleteNote()`, `readNote()`, `listNotes()`, `searchNotes()`, `listAllTags()`, `getConfig()`, `pickNotesDirectory()`, `setConfig()`, `copyToClipboard()` |
| 2 | ESLint 設定 | `eslint.config.js` | `no-restricted-imports`: `@tauri-apps/plugin-fs`, `@tauri-apps/plugin-clipboard-manager`, `@tauri-apps/plugin-dialog`, `@tauri-apps/plugin-global-shortcut`。`no-restricted-globals`: `navigator` |
| 3 | `global-shortcut.ts` | `src/shell/global-shortcut.ts` | Rust 側から emit される `new-note` イベントを `@tauri-apps/api/event` の `listen` で購読し、フロントエンドのハンドラを発火させる薄いラッパー。**`@tauri-apps/plugin-global-shortcut` の直接 import は禁止** |

**検証基準:**

| テスト種別 | 対象 | 基準 |
|---|---|---|
| ESLint チェック | 全フロントエンドファイル | 禁止インポート・禁止グローバルの違反ゼロ |

---

#### M1.6 T-06 `config/mod.rs` 設定基盤

**depends_on:** T-01

**目標:** アプリケーション設定の読み書き基盤。OS 別デフォルトパス解決。

**成果物:**

| # | 成果物 | ファイル | 詳細 |
|---|---|---|---|
| 1 | `config/mod.rs` | `src-tauri/src/config/mod.rs` | `AppConfig { notes_dir: String }` を `config.json` で永続化。Tauri の `AppHandle::path().app_data_dir()` で OS 別デフォルトパスを解決（identifier `com.promptnotes` 経由で Linux: `~/.local/share/com.promptnotes/`, macOS: `~/Library/Application Support/com.promptnotes/`）。`dirs::data_dir()` の使用禁止。`config.json` 不在時はデフォルト値で新規作成。`validate_notes_directory` のスケルトン実装（T-21 で 6 ステップを完成） |

**検証基準:**

| テスト種別 | 対象 | 基準 |
|---|---|---|
| 単体テスト (Rust) | `config/mod.rs` | デフォルトパス生成が OS 別に正しい。`config.json` 不在時の新規作成。無効ディレクトリの拒否 |

---

#### M2.1 T-07 `commands/notes.rs` IPC コマンド + 型定義

**depends_on:** T-02, T-03, T-06

**目標:** ノート CRUD の IPC エントリポイントと共有型定義。

**成果物:**

| # | 成果物 | ファイル | 詳細 |
|---|---|---|---|
| 1 | `commands/notes.rs` | `src-tauri/src/commands/notes.rs` | `NoteMetadata`, `ListNotesResult`, `SearchNotesResult`, `SearchResultEntry`, `HighlightRange`, `ListOptions` 構造体定義。`create_note`, `save_note`, `read_note`, `list_notes` の IPC コマンド実装。統一エラー型 `TauriCommandError { code: String, message: String }` によるエラー返却 |
| 2 | `search.rs` スタブ | `src-tauri/src/storage/search.rs` | `full_scan()` のインターフェース定義と空実装（T-18 で本実装） |
| 3 | `commands/clipboard.rs` スタブ | `src-tauri/src/commands/clipboard.rs` | `copy_to_clipboard` のインターフェース定義（T-23 で本実装） |

**検証基準:**

| テスト種別 | 対象 | 基準 |
|---|---|---|
| 単体テスト (Rust) | `commands/notes.rs` | `create_note` がファイルを作成し `NoteMetadata` を返却。`save_note` がファイルを上書き。`list_notes` が降順ソート済み `ListNotesResult` を返却 |

---

#### M2.2 T-08 `commands/config.rs` IPC コマンド（基本）

**depends_on:** T-06

**目標:** 設定読み書きの基本 IPC エントリポイント。

**成果物:**

| # | 成果物 | ファイル | 詳細 |
|---|---|---|---|
| 1 | `commands/config.rs` | `src-tauri/src/commands/config.rs` | `get_config`, `set_config`（基本版）の IPC コマンド実装。`set_config` 本体は T-21 で 3 フェーズ実装に拡張する |

---

#### M2.3 T-09 グローバル CSS + TS ユーティリティ + テストランナー整備

**depends_on:** T-01

**目標:** 共有リソース（CSS カスタムプロパティ、タイムスタンプユーティリティ、ADR-008 TS テストスタブ、vitest）の整備。

**成果物:**

| # | 成果物 | ファイル | 詳細 |
|---|---|---|---|
| 1 | グローバル CSS | `src/styles/global.css` | `--surface`, `--surface-secondary`, `--surface-hover`, `--border`, `--text`, `--accent`, `--success`, `--danger`, `--frontmatter-bg` 等を定義。`--frontmatter-bg` はライト/ダークモードそれぞれで視認性の高い控えめな背景色を提供し（例: ライト `#f8f9fa` / ダーク `#252526`）、`@media (prefers-color-scheme: dark)` で切り替える。Tailwind は導入しない |
| 2 | `timestamp.ts` | `src/storage/timestamp.ts` | `filenameToDate(filename: string): Date` — ファイル名 `YYYY-MM-DDTHHMMSS.md` をパースして `Date` オブジェクトに変換。`dateToFilenamePrefix(date: Date): string` — 日付を `YYYY-MM-DDTHHMMSS` 形式に変換 |
| 3 | TS 単体テストランナー整備 | `package.json` | `vitest` を devDependencies に追加し、`scripts.test = "vitest run"` を定義。`tests/unit/*.test.ts` が依存する `js-yaml` / `@types/js-yaml` も devDependencies として固定 |
| 4 | ADR-008 TypeScript スタブ | `tests/unit/frontmatter.ts` | テスト専用スタブ。`splitRaw(content: string): { yaml, body }` と `serializeFrontmatter(tags, body): string` を実装し、往復冪等性検証基盤を提供。`module:storage` が所有 |

**検証基準:**

| テスト種別 | 対象 | 基準 |
|---|---|---|
| 単体テスト (TS) | `timestamp.ts` | ファイル名↔日時変換の正確性 |
| 単体テスト (TS) | `tests/unit/frontmatter.ts` | `parseFrontmatter → serializeFrontmatter → parseFrontmatter` の往復冪等性 |
| テストランナー起動 | `npm test` | `direnv exec . npm test` が exit 0 で完了し vitest が `tests/unit/*.test.ts` を発見・実行する |

---

#### M3.1 T-10 `NoteEditor.svelte` CodeMirror 6 エディタ

**depends_on:** T-05, T-09

**目標:** CodeMirror 6 エディタのライフサイクル管理、Markdown シンタックスハイライト、中間保存（debounce）。

**成果物:**

| # | 成果物 | ファイル | 詳細 |
|---|---|---|---|
| 1 | `NoteEditor.svelte` | `src/editor/NoteEditor.svelte` | CodeMirror 6 EditorView のライフサイクル管理（`onMount` で生成、`onDestroy` で `destroy()`）。拡張セット: `history()`（Undo/Redo 必須）、`@codemirror/lang-markdown` + `@codemirror/language-data`、`syntaxHighlighting(defaultHighlightStyle)`、`keymap.of([{ key: "Escape", run: exitEditMode }, ...defaultKeymap, ...historyKeymap])`、`frontmatterDecoration()`（T-11 で実装）、`EditorView.theme()`、`EditorView.lineWrapping`。DOM 構造は `<div class="note-editor"><div bind:this={editorContainer}></div></div>` のみ。タイトル入力欄なし。Markdown HTML レンダリング禁止。`getContent(): string` で `EditorView.state.doc.toString()` を公開。**中間保存（debounce）**: `ViewPlugin` の `updateListener` で入力変化を検知し 2,000ms の debounce 後に `saveNote()` を呼ぶ（ViewMode 遷移は起こさない）。カーソルはドキュメント末尾（`doc.length`）に配置（AC-EDIT-13） |

**検証基準:**

| テスト種別 | 対象 | 基準 |
|---|---|---|
| コンポーネントテスト | `NoteEditor.svelte` | CodeMirror 6 がマウントされ `.cm-editor` 要素が存在。タイトル入力欄が存在しない。`history()` 拡張が有効で Undo が機能。Escape キー押下で `onExit` コールバックが発火 |

---

#### M3.2 T-11 `frontmatter-decoration.ts` 背景色装飾

**depends_on:** T-10

**目標:** frontmatter 領域（`---` 〜 `---`）の視覚的区別。

**成果物:**

| # | 成果物 | ファイル | 詳細 |
|---|---|---|---|
| 1 | `frontmatter-decoration.ts` | `src/editor/frontmatter-decoration.ts` | `ViewPlugin` + `Decoration.line` による frontmatter 背景色装飾。`EditorView.baseTheme` で `.cm-frontmatter-line` に `backgroundColor: var(--frontmatter-bg)` を適用。`docChanged` または `viewportChanged` 時に再計算 |

**検証基準:**

| テスト種別 | 対象 | 基準 |
|---|---|---|
| コンポーネントテスト | `NoteEditor.svelte` + `frontmatter-decoration` | frontmatter 行に `.cm-frontmatter-line` クラスが適用される |

---

#### M3.3 T-12 `frontmatter.ts` ADR-008 TypeScript 本番実装

**depends_on:** T-09

**目標:** 編集モードのコピー操作専用の body 抽出・本文再構築。

**成果物:**

| # | 成果物 | ファイル | 詳細 |
|---|---|---|---|
| 1 | `frontmatter.ts` | `src/editor/frontmatter.ts` | **編集モードのコピー操作専用**。`extractBody(rawMarkdown: string): string` — 先頭 `---\n...\n---\n` を検出後、直後の区切り `\n` 1 つを body に含めずに本文を返す（ADR-008 準拠）。`generateNoteContent(tags: string[], body: string): string` — `---\n<yaml>\n---\n\n<body>` 形式を構築。**IPC レスポンスの再パース用途には使用しない** |

**検証基準:**

| テスト種別 | 対象 | 基準 |
|---|---|---|
| 単体テスト (TS) | `src/editor/frontmatter.ts` | `extractBody()` が frontmatter と直後の区切り `\n` を除去。frontmatter なしの入力をそのまま返却。`generateNoteContent()` が正規レイアウトを生成 |

---

#### M3.4 T-13 `CopyButton.svelte` 1 クリックコピー

**depends_on:** T-05, T-12

**目標:** ViewMode / EditMode 両方で常時利用可能な 1 クリックコピー機能。

**成果物:**

| # | 成果物 | ファイル | 詳細 |
|---|---|---|---|
| 1 | `CopyButton.svelte` | `src/editor/CopyButton.svelte` | **ViewMode / EditMode の両方で常時表示**。EditMode では `NoteEditor.getContent()` → `extractBody()` → `copyToClipboard()`。ViewMode では `readNote()` → `extractBody()` → `copyToClipboard()`。編集モードでのコピーは自動保存を誘発せず EditorView のフォーカス・選択・Undo 履歴を変更しない。**絵文字単体表示は禁止**: ラベル既定 `Copy`、成功時 `✓ Copied`（2,000ms で復帰）、失敗時 `✕ Failed`（3,000ms で復帰）。CSS は `--surface` / `--border` / `--success` / `--danger` を使用。フィードバック中は `disabled` で連打防止 |

**検証基準:**

| テスト種別 | 対象 | 基準 |
|---|---|---|
| コンポーネントテスト | `CopyButton.svelte` | ViewMode / EditMode の両方でマウント。クリック後にラベルが `✓ Copied` に変化し復帰。bounding box 非ゼロ。`elementFromPoint()` で取得可能。絵文字単体表示がない |

---

#### M3.5 T-14 `DeleteButton.svelte` 削除 UI

**depends_on:** T-05

**目標:** ノート削除 UI（テキストラベル `Delete` + ゴミ箱失敗時の確認ダイアログ）。

**成果物:**

| # | 成果物 | ファイル | 詳細 |
|---|---|---|---|
| 1 | `DeleteButton.svelte` | `src/editor/DeleteButton.svelte` | **ViewMode / EditMode の両方で常時マウント**（INV-CONTAIN-05 準拠）。**絵文字単体表示は禁止**: ラベル `Delete`。`deleteNote()` IPC 呼び出し → `trash` クレートでゴミ箱移動（確認ダイアログなし）。`TRASH_FAILED` エラー時のみ確認ダイアログ表示 → `forceDeleteNote()`。CSS は `--surface` / `--border` / `--danger` を使用 |

**検証基準:**

| テスト種別 | 対象 | 基準 |
|---|---|---|
| コンポーネントテスト | `DeleteButton.svelte` | ViewMode / EditMode の両方でマウント（INV-CONTAIN-05）。bounding box 非ゼロ。`elementFromPoint()` で取得可能。ラベル `Delete` がテキストとして存在 |

---

#### M4.1 T-15 `NoteCard.svelte` 表示/編集モード制御

**depends_on:** T-10, T-11, T-13, T-14

**目標:** ノートカードの 2 状態ステートマシン、自動保存トリガー、レイアウト制約の実装。

**成果物:**

| # | 成果物 | ファイル | 詳細 |
|---|---|---|---|
| 1 | `NoteCard.svelte` | `src/editor/NoteCard.svelte` | 2 状態ステートマシン（ViewMode / EditMode）。ViewMode: 本文を `NoteMetadata.body_preview` から直接表示（frontmatter 独自再パースなし）、タグ表示、タイムスタンプ表示。EditMode: NoteEditor のマウント。**CopyButton と DeleteButton は `.note-card-header .note-actions` に配置し、モード共通領域として常時マウント**（INV-CONTAIN-05）。確定保存トリガー: カード外クリック・別カード選択・Cmd+N・Escape 時に `saveNote()` → ViewMode 遷移。**レイアウト制約**: ルート要素に `flex-shrink: 0`。**モード別カード高さ挙動**（AC-UI-04, FC-UI-01）: ViewMode は本文プレビュー領域に `max-height: 300px` + `overflow: hidden` を適用し冒頭プレビューを表示（カード内スクロール禁止）、EditMode は `max-height` を解除し本文量に応じて伸ばす（`overflow: visible`、内部スクロールなし）。`max-height` の値はアプリ内定数として 1 箇所（CSS カスタムプロパティ等）で定義し、設定モーダル / `config.json` への永続化は本リリースのスコープ外。データ層では本文全量を保持し、`body_preview` のみで持つ・恒久切り詰め（`text-overflow: ellipsis` / `-webkit-line-clamp` 等）は禁止（FBD-03）。モード切替時の高さアニメーション: カード外形高さ（ViewMode = `min(本文+padding, max-height)`、EditMode = `本文+padding`）を 200ms / ease-in-out で補間（AC-UI-11）。`prefers-reduced-motion` で即時切替フォールバック（AC-UI-12） |

**検証基準:**

| テスト種別 | 対象 | 基準 |
|---|---|---|
| コンポーネントテスト | `NoteCard.svelte` | ViewMode → EditMode → ViewMode の遷移。CopyButton / DeleteButton が両モードでマウント済み。`flex-shrink: 0` が適用。ViewMode で本文プレビューに `max-height: 300px` + `overflow: hidden` が適用され、EditMode で解除されること。両モードとも `.note-card` 自身に `overflow-y: auto` / `overflow-y: scroll` が付与されないこと（FC-UI-01） |

---

#### M4.2 T-16 新規ノート作成フロー + `Header.svelte`

**depends_on:** T-04, T-05, T-07, T-15

**目標:** Cmd+N / Ctrl+N → 新規ノート作成 → エディタフォーカスまでの完全動作。

**成果物:**

| # | 成果物 | ファイル | 詳細 |
|---|---|---|---|
| 1 | `Header.svelte` | `src/feed/Header.svelte` | New ボタン（`new-note` イベント受信時に `createNote()` → フィードに prepend）、⚙️ ボタン（設定モーダル表示）。**アプリ名は表示しない**。検索バー・フィルタ UI は `Toolbar.svelte`（T-19）が所有するため配置しない |
| 2 | 新規ノート作成フロー | `Header.svelte` + `Feed.svelte` + `NoteCard.svelte` | `listen("new-note")` → 既存編集中カードの自動保存 → `createNote()` IPC → フィード先頭に新規カード prepend（EditMode）→ CodeMirror 6 フォーカス。合計 200ms 以内 |
| 3 | 新規ノート作成デバウンス | `Header.svelte` | Cmd+N 連打対策: 500ms デバウンスで `createNote()` の重複呼び出しを防止 |

**検証基準:**

| テスト種別 | 対象 | 基準 |
|---|---|---|
| E2E テスト | 新規ノート作成 | Cmd+N / Ctrl+N → エディタフォーカスまで 200ms 以内。作成されたファイルが `YYYY-MM-DDTHHMMSS.md` 形式で内容が `"---\ntags: []\n---\n\n"` |
| E2E テスト | 自動保存 | カード外クリック → ファイル内容が永続化。100ms 以内完了 |
| E2E テスト | コピー（ViewMode） | CopyButton クリック → クリップボード内容が frontmatter 除去済み本文と一致。100ms 以内 |
| E2E テスト | コピー（EditMode） | 編集モード中の CopyButton クリック → 未保存 Doc から body がコピーされる。自動保存が誘発されない |

---

#### M4.3 T-17 `Feed.svelte` フィード表示 + ストア群

**depends_on:** T-15, T-16

**目標:** ノートカード一覧の降順表示、reactive フィルタ連携、スクロールロード、アニメーション。

**成果物:**

| # | 成果物 | ファイル | 詳細 |
|---|---|---|---|
| 1 | `Feed.svelte` | `src/feed/Feed.svelte` | `filters` store の reactive 監視 → `query` 空: `listNotes()` / `query` 非空: `searchNotes()` を自動発行。カード一覧を降順レンダリング。編集状態調停: `editingFilename: string | null` で同時編集カード最大 1 つを強制。Load more ボタンで `loadMoreNotes()`。キーボード ↓ キー最下部で `filters.fromDate = null` として全期間再フェッチ。**アニメーション**: `{#each}` ブロックに `in:fade`・`out:fade`・`animate:flip`。フィルタ変更時は `{#key}` ブロックで抑制。**prefers-reduced-motion** で即時切替フォールバック（AC-UI-12）。**レイアウト**: `display: flex; flex-direction: column; overflow-y: auto` の単一スクロール領域 |
| 2 | `filters.ts` | `src/feed/filters.ts` | `Writable<{ fromDate: string, toDate: string, tags: string[], query: string }>`。初期値: `fromDate` = 7 日前（`YYYY-MM-DD`）、`toDate` = 今日、`tags` = `[]`、`query` = `""` |
| 3 | `notes.ts` | `src/feed/notes.ts` | `Writable<NoteMetadata[]>` |
| 4 | `searchResults.ts` | `src/feed/searchResults.ts` | `Writable<SearchResultEntry[] | null>` |
| 5 | `totalCount.ts` | `src/feed/totalCount.ts` | `Writable<number>` |

**検証基準:**

| テスト種別 | 対象 | 基準 |
|---|---|---|
| コンポーネントテスト | `Feed.svelte` | フィルタ変更で IPC 再発行。降順レンダリング。二重スクロール領域が生成されない。フィルタ変更時にアニメーション抑制 |
| E2E テスト | フィード初期表示 | アプリ起動 → 7 日間分のノートが降順表示。2 秒以内 |
| E2E テスト | INV-CONTAIN 不変条件 | 2 件以上のノートで編集モード遷移時に (1) `[data-testid="note-card"]` が 2 個以上存在（INV-CONTAIN-03）、(2) `.cm-editor` が編集中カードの子孫（INV-CONTAIN-02）、(3) 他カードの CopyButton / DeleteButton が DOM に存在（INV-CONTAIN-05） |

---

#### M4.4 T-18 `search.rs` 全文検索 + `list_all_tags`

**depends_on:** T-03, T-07

**目標:** 全文検索ロジック（ファイル全走査）とタグ一覧集約の実装。

**成果物:**

| # | 成果物 | ファイル | 詳細 |
|---|---|---|---|
| 1 | `search.rs` 本実装 | `src-tauri/src/storage/search.rs` | `full_scan()`: `notes_dir` 全 `.md` ファイル走査。処理順序: ファイル名日付フィルタ → `read_to_string` → `frontmatter.rs` の `parse`（ADR-008 準拠）→ タグ OR フィルタ → `str::to_lowercase().contains()` で部分一致検索 → スニペット生成（前後各 50 文字、単語境界拡張）→ `HighlightRange` 算出 → 降順ソート → `offset`/`limit` でスライス |
| 2 | `list_all_tags` コマンド | `src-tauri/src/commands/notes.rs` | 全 `.md` ファイルの frontmatter `tags` を集約。重複排除・アルファベット順ソートして `Vec<String>` を返却 |
| 3 | `list_notes` ページネーション拡張 | `src-tauri/src/commands/notes.rs` | `limit`（デフォルト 100）・`offset`（デフォルト 0）パラメータ追加。レスポンスを `ListNotesResult { notes, total_count }` に変更 |

**検証基準:**

| テスト種別 | 対象 | 基準 |
|---|---|---|
| 単体テスト (Rust) | `search.rs` | 部分一致検索が大文字小文字無視で動作。スニペット生成がマッチ箇所前後 50 文字を含む。`HighlightRange` が正しい相対オフセット。body が ADR-008 に従う |
| 単体テスト (Rust) | `list_all_tags` | 全ファイルからタグを集約・重複排除・ソート |
| 単体テスト (Rust) | `list_notes` | `offset=0, limit=100` で先頭 100 件返却。`total_count` がフィルタ合致全数 |

---

#### M4.5 T-19 `Toolbar.svelte` + フィルタ UI + 検索表示対応

**depends_on:** T-17, T-18

**目標:** 検索バー、タグフィルタ、日付フィルタの UI 実装とフィード統合。検索結果のスニペット・ハイライト表示。

**成果物:**

| # | 成果物 | ファイル | 詳細 |
|---|---|---|---|
| 1 | `Toolbar.svelte` | `src/feed/Toolbar.svelte` | 検索バー + タグフィルタ + 日付フィルタ + Reset ボタン。**タグ候補の 2 モード切替**: デフォルト状態 → `listAllTags()` IPC。フィルタ適用中 → `notes` store から集約 |
| 2 | `SearchBar.svelte` | `src/feed/SearchBar.svelte` | 検索クエリ入力 UI。300ms デバウンス後に `filters.query` を更新 |
| 3 | `TagFilter.svelte` | `src/feed/TagFilter.svelte` | タグ選択 UI（複数選択可能）。**タグ候補は props で受け取り IPC を呼ばない**。`list_notes` 使用時は AND 条件、`search_notes` 使用時は OR 条件 |
| 4 | `DateFilter.svelte` | `src/feed/DateFilter.svelte` | 日付範囲選択 UI（`<input type="date">` ベース） |
| 5 | `NoteCard.svelte` 検索表示対応 | `src/editor/NoteCard.svelte` | `searchResults` store 非 `null` 時: スニペット表示 + `highlights` 範囲を `<mark>` タグで強調 |

**検証基準:**

| テスト種別 | 対象 | 基準 |
|---|---|---|
| コンポーネントテスト | `SearchBar.svelte` | 300ms デバウンス後に `filters.query` 更新 |
| コンポーネントテスト | `Toolbar.svelte` | デフォルト状態で `listAllTags()` 呼び出し。フィルタ適用中は `notes` store からタグ集約 |
| E2E テスト | 全文検索 | クエリ入力 → マッチ結果 + スニペット + ハイライト。200ms 以内 |
| E2E テスト | タグフィルタ | タグ選択 → フィルタ適用。200ms 以内 |
| E2E テスト | スクロールロード | 100 件超 → Load more で次ページ追加。↓ 最下部で全期間再フェッチ |
| E2E テスト | 多数カード視認性 | 全カードで CopyButton / DeleteButton の bounding box 非ゼロ |

---

#### M5.1 T-20 `SettingsModal.svelte` + 2 段階確定 UI

**depends_on:** T-05, T-08

**目標:** 設定モーダルの 2 段階確定 UI（pick → apply）と移動オプション二次確認。

**成果物:**

| # | 成果物 | ファイル | 詳細 |
|---|---|---|---|
| 1 | `SettingsModal.svelte` | `src/settings/SettingsModal.svelte` | ⚙️ ボタンで表示するモーダル。`getConfig()` で現在設定を取得・表示。`[参照]` ボタンで `pickNotesDirectory()` → `pendingPath` に保持（`config.json` 未更新）。`[ ] 既存ノートを新ディレクトリへ移動する` チェックボックス。`[Apply]` で `setConfig({ notes_dir, move_existing })` を発行 |
| 2 | `config.ts` store | `src/settings/config.ts` | `Writable<{ notes_dir: string, pendingPath: string | null, moveExisting: boolean, lastResult: SetConfigResult | null }>` |
| 3 | 移動オプション二次確認 | `SettingsModal.svelte` 内 | `moveExisting: true` 時の Apply 前確認ダイアログ: 「既存ノート N 件を新ディレクトリへ移動します。元のディレクトリからは削除され、元に戻せません。実行しますか？ [キャンセル] [実行]」 |
| 4 | 設定変更後フィード再読み込み | `SettingsModal.svelte` → `Feed.svelte` | Apply 完了後に `listNotes()` を再発行。`remaining_in_old > 0` の場合はトースト表示 |

**検証基準:**

| テスト種別 | 対象 | 基準 |
|---|---|---|
| E2E テスト | 2 段階確定 | 参照直後は `config.json` 未変更。Apply 後のみ書き換わる |

---

#### M5.2 T-21 `set_config` 3 フェーズ実装 + `validate_notes_directory`

**depends_on:** T-06, T-08

**目標:** 保存ディレクトリ変更の 3 フェーズ移動フロー（copy → atomic write → delete）とバリデーション 6 ステップの完成。

**成果物:**

| # | 成果物 | ファイル | 詳細 |
|---|---|---|---|
| 1 | `set_config` 3 フェーズ実装 | `src-tauri/src/commands/config.rs`, `config/mod.rs` | Phase 0: `validate_notes_directory` 再実行（TOCTOU 対策）。Phase 1: `move_existing: true` 時、衝突チェック後に旧→新へ `.md` コピー（失敗時ロールバック）。Phase 2: `config.json` atomic write（tmp → fsync → rename）= point of no return。Phase 3: `move_existing: true` 時、旧 `.md` 削除（部分失敗は `remaining_in_old` に計上）。`SetConfigResult { notes_dir, moved, remaining_in_old, old_dir }` を返却 |
| 2 | `validate_notes_directory` 6 ステップ | `src-tauri/src/config/mod.rs` | (1) 絶対パス化、(2) canonicalize、(3) ディレクトリ判定、(4) 書き込みプローブ `.promptnotes-probe`、(5) config.json 配置ディレクトリとの同一禁止、(6) システムディレクトリへの警告フラグ付与 |
| 3 | `pick_notes_directory` コマンド | `src-tauri/src/commands/config.rs` | `tauri-plugin-dialog::blocking_pick_folder` 起動。キャンセル時 `null`。選択時は `validate_notes_directory` 実行して canonical PathBuf 返却。`config.json` は書き換えない |
| 4 | `ConfigError` 型 | `src-tauri/src/config/mod.rs` | `InvalidPath`, `NotADirectory`, `NotWritable`, `ReservedDirectory`, `SameDirectory`, `MoveConflict`, `CopyFailed`, `ConfigWriteFailed` |

**検証基準:**

| テスト種別 | 対象 | 基準 |
|---|---|---|
| 単体テスト (Rust) | `validate_notes_directory` | 6 ステップのエラーケース（InvalidPath / NotADirectory / NotWritable / ReservedDirectory）を網羅 |
| 単体テスト (Rust) | `set_config` 3 フェーズ | Phase 1 失敗時の旧データ無傷。Phase 2 失敗時の新側クリーンアップ。Phase 3 部分失敗時の `remaining_in_old` 正確性 |
| 単体テスト (Rust) | 衝突検出 | 新側に同名 `.md` がある場合 `MoveConflict(filenames)` 返却 |
| E2E テスト | 移動オプション | `.md` のみ移動（非 `.md` は残る）、`SetConfigResult.moved == N` |
| E2E テスト | 衝突検出 | 衝突状態を UI で通知、新側は変更されない |

---

#### M5.3 T-22 起動時ディレクトリ不在エラー処理

**depends_on:** T-21

**目標:** 起動時 `notes_dir` アクセス失敗の 4 エラー分類と 3 択 UI。

**成果物:**

| # | 成果物 | ファイル | 詳細 |
|---|---|---|---|
| 1 | errno 分類 | `src-tauri/src/config/mod.rs` | `ENOENT`（NotFound）/ `EACCES`（NotAccessible）/ `EIO`系（DeviceError）/ `ENOTDIR` に分類。自動フォールバック禁止 |
| 2 | `StartupErrorModal.svelte` | `src/settings/StartupErrorModal.svelte` | エラー分類に応じたメッセージ + `[再試行] / [別のディレクトリを選ぶ] / [デフォルトに戻す]` の 3 択 UI |

**検証基準:**

| テスト種別 | 対象 | 基準 |
|---|---|---|
| 単体テスト (Rust) | errno 分類 | モック errno ごとに正しい `ConfigError` 種別。自動デフォルト書き換えなし |
| E2E テスト | 起動時不在 | 4 エラーに応じたメッセージと 3 択 UI 表示、自動フォールバックなし |

---

#### M6.1 T-23 `commands/clipboard.rs` 本実装

**depends_on:** T-01

**目標:** クリップボード書き込みの IPC コマンド実装。

**成果物:**

| # | 成果物 | ファイル | 詳細 |
|---|---|---|---|
| 1 | `commands/clipboard.rs` | `src-tauri/src/commands/clipboard.rs` | `copy_to_clipboard` コマンド: Tauri `clipboard-manager` プラグインの `clipboard.write_text(text)` を呼び出し。エラー時は `CLIPBOARD_FAILED` コードで `TauriCommandError` を返却 |

**検証基準:**

| テスト種別 | 対象 | 基準 |
|---|---|---|
| 単体テスト (Rust) | `commands/clipboard.rs` | `copy_to_clipboard` がエラーなく完了 |

---

#### M6.2 T-24 ゴミ箱連携削除 + `force_delete_note`

**depends_on:** T-07

**目標:** `trash` クレートによるゴミ箱移動と完全削除フォールバック。

**成果物:**

| # | 成果物 | ファイル | 詳細 |
|---|---|---|---|
| 1 | `delete_note` + `trash` 連携 | `src-tauri/src/commands/notes.rs`, `storage/file_manager.rs` | `trash::delete()` でゴミ箱移動（確認ダイアログなし）。失敗時は `TRASH_FAILED` エラー返却 |
| 2 | `force_delete_note` | `src-tauri/src/commands/notes.rs` | `std::fs::remove_file()` による完全削除。`TRASH_FAILED` 後のフォールバック用 |

**検証基準:**

| テスト種別 | 対象 | 基準 |
|---|---|---|
| 単体テスト (Rust) | `delete_note` | ゴミ箱移動成功。存在しないファイルで `STORAGE_NOT_FOUND` |
| 単体テスト (Rust) | `force_delete_note` | `remove_file` による完全削除 |
| E2E テスト | 削除フロー | DeleteButton クリック → ファイルがゴミ箱に移動 → フィードから除去 |
| E2E テスト | ゴミ箱失敗フォールバック | ゴミ箱無効環境 → 確認ダイアログ → 完全削除 |

---

#### M6.3 T-25 ウィンドウクローズ時自動保存 + エラーハンドリング統合

**depends_on:** T-15, T-24

**目標:** ウィンドウクローズ時の自動保存、統一エラーハンドリングのフロントエンド接続。

**成果物:**

| # | 成果物 | ファイル | 詳細 |
|---|---|---|---|
| 1 | ウィンドウクローズ時自動保存 | `src-tauri/src/main.rs`, `src/shell/window-close.ts`, `App.svelte` | Tauri `close-requested` イベントをフック。`window-close.ts` が `registerPendingSave` / `clearPendingSave` API で未保存 save 関数を受け取り、クローズ直前に best-effort 実行 |
| 2 | フロントエンドエラーハンドリング | `tauri-commands.ts`, 各コンポーネント | `TauriCommandError.code` で分岐。`STORAGE_NOT_FOUND` → カード除去。`STORAGE_WRITE_FAILED` → エラー表示。`STORAGE_FRONTMATTER_PARSE` → タグ・スニペット空で継続。`CONFIG_INVALID_DIR` → 設定画面誘導。`TRASH_FAILED` → 完全削除確認。`CLIPBOARD_FAILED` → コピー失敗フィードバック |
| 3 | errno エラーコード統合 | `StartupErrorModal.svelte`, `SettingsModal.svelte` | `CONFIG_DIR_NOT_FOUND` / `CONFIG_DIR_NOT_ACCESSIBLE` / `CONFIG_DIR_DEVICE_ERROR` / `CONFIG_DIR_NOT_A_DIRECTORY` に対して 3 択ダイアログと再呼び出しフローを配線 |

**検証基準:**

| テスト種別 | 対象 | 基準 |
|---|---|---|
| E2E テスト | ウィンドウクローズ | 編集中にウィンドウ閉じ → ファイル内容が保存済み |
| E2E テスト | エラーハンドリング | 各エラーコードに対応するフロントエンド表示の正確性 |

---

#### M7.1 T-26 ADR-008 往復冪等性テスト統合

**depends_on:** T-03, T-12

**目標:** Rust/TS 両実装の ADR-008 body 意味論整合を往復冪等性テストで検証。

**成果物:**

| # | 成果物 | ファイル | 詳細 |
|---|---|---|---|
| 1 | 往復冪等性テスト | `tests/unit/frontmatter.test.ts` | `generateNoteContent(tags, body) → extractBody(...)` の擬似往復で body 不変。`parseFrontmatter → serializeFrontmatter → parseFrontmatter`（スタブ経由）の往復で `(tags, body)` 不変。N 回繰り返しで body 先頭 `\n` 累積なし（AC-STOR-06）。body 空時末尾 `\n` 残存。Rust 側 `#[cfg(test)] mod tests` とセットで実行する運用規約を README に明記 |

**検証基準:**

| テスト種別 | 対象 | 基準 |
|---|---|---|
| 単体テスト (TS) | `frontmatter.test.ts` | 往復冪等性・N 回反復・body 空時末尾 `\n` テスト全 PASS |
| 単体テスト (Rust) | `frontmatter.rs #[cfg(test)]` | `parse → reassemble → parse` 往復冪等性テスト全 PASS |

---

#### M7.2 T-27 結合テスト・E2E テスト・クロスプラットフォームビルド

**depends_on:** T-17, T-19, T-20, T-21, T-22, T-24, T-25, T-26

**目標:** 全モジュールの結合テスト、クロスプラットフォーム E2E テスト、リリースビルドの生成と検証。

**成果物:**

| # | 成果物 | 詳細 |
|---|---|---|
| 1 | 結合テスト | 全 IPC コマンドのフロントエンド→バックエンド結合テスト。フィルタ変更 → IPC → ストア更新 → UI 反映の一貫性検証 |
| 2 | E2E テスト（Linux） | `xvfb-run` 仮想ディスプレイ上で実行。テストマトリクス: 新規ノート作成、自動保存、コピー（ViewMode / EditMode）、削除、フィード表示、タグフィルタ、日付フィルタ、全文検索、設定変更、スクロールロード、多数カード CopyButton / DeleteButton 視認性、アニメーション（フェードイン / フェードアウト / FLIP） |
| 3 | E2E テスト（macOS） | ネイティブ実行。同一テストマトリクス |
| 4 | パフォーマンステスト | ショートカット→エディタ表示 ≤ 200ms、全文検索 ≤ 200ms（数十件）、自動保存 ≤ 100ms、コピー ≤ 100ms、CodeMirror 6 初期化 ≤ 65ms、アプリ起動→フィード表示 ≤ 2 秒 |
| 5 | Linux ビルド | `.deb`, `.AppImage`, Flatpak |
| 6 | macOS ビルド | `.dmg`, Homebrew Cask |
| 7 | CI パイプライン | GitHub Actions。マトリクス: `ubuntu-latest` + `macos-latest`。ステップ: lint → 単体テスト（Rust `cargo test` + TS `npm test`）→ ビルド → E2E テスト。Windows は対象外。ADR-008 両実装テスト並列実行を必須化し片側のみ PASS は CI 失敗扱い |
| 8 | セキュリティ検証 | capabilities に `fs` WebView アクセス不在。CSP `connect-src 'none'`。`Cargo.toml` に HTTP クレート不在。ESLint 違反ゼロ |

**検証基準:**

| テスト種別 | 対象 | 基準 |
|---|---|---|
| 結合テスト | 全 IPC コマンド | フロントエンド → Rust → ファイルシステム → レスポンスの往復が正常 |
| E2E テスト | 全機能（Linux） | 全テストケース PASS |
| E2E テスト | 全機能（macOS） | 全テストケース PASS |
| パフォーマンステスト | 6 指標 | 全閾値クリア |
| ビルド検証 | Linux / macOS | バイナリが正常起動し基本操作が動作 |

## 3. Risks

| # | リスク | 影響度 | 発生確率 | 対策 |
|---|---|---|---|---|
| R-01 | 全文検索のパフォーマンス劣化（1,000 件超過時に 200ms 超過） | 高 | 中 | T-18 の `search.rs` 実装で日付フィルタによる走査対象の事前絞り込みを最適化。200ms 超過確認時は tantivy + lindera ベースのインデックス検索への移行をバックログに追加。通常使用（数十〜数百件）では全走査で 200ms 以内に収まる見込み |
| R-02 | `trash` クレートの Linux 環境互換性（freedesktop trash spec 非準拠環境） | 中 | 中 | T-24 で `TRASH_FAILED` エラー時のフォールバック（`force_delete_note` による完全削除 + 確認ダイアログ）を実装。Flatpak サンドボックス内での `trash` 動作を T-27 の E2E テストで検証 |
| R-03 | CodeMirror 6 の初期化時間が 65ms を超過 | 中 | 低 | T-10 で最小拡張セットでの初期化時間を計測。超過時は拡張の遅延ロード（`frontmatterDecoration` を `requestIdleCallback` で適用）を検討 |
| R-04 | 同一秒内の複数ノート作成によるファイル名衝突 | 低 | 低 | T-02 で `file_manager.rs` に 1 秒待機再生成を実装。T-16 で `Header.svelte` に 500ms デバウンスを追加 |
| R-05 | アトミック書き込み（一時ファイル → `rename`）のパフォーマンス影響で自動保存 100ms 超過 | 中 | 低 | T-02 でアトミック書き込みを実装し計測。超過時は直接上書きにフォールバック。SSD 環境では `rename` のオーバーヘッドは無視可能 |
| R-06 | `serde_yaml` のシリアライズ出力でフィールド順序が変動 | 低 | 高 | `tags` フィールド先頭出力のみ保証。未知フィールドは `#[serde(flatten)]` で保持するが順序は `serde_yaml` デフォルトに委ねる。影響は軽微 |
| R-07 | Tauri v2 `global-shortcut` プラグインが Wayland 環境でショートカットを捕捉できない | 中 | 中 | T-27 の E2E テストで Wayland 環境での動作を検証。非対応時は New ボタンを代替操作として提供 |
| R-08 | クロスプラットフォームビルドで macOS コード署名・公証が CI で失敗 | 中 | 中 | T-27 で Apple Developer Certificate の CI シークレット設定。初回リリースでは署名なしバイナリ + Gatekeeper 回避手順をドキュメント化 |
| R-09 | `src/editor/frontmatter.ts`（TS）と `storage/frontmatter.rs`（Rust）の ADR-008 body 意味論ドリフト | 高 | 中 | 両実装の doc コメントに ADR-008 リンクを記載。T-03 の Rust テストと T-26 の TS テストで往復冪等性を両実装横断で検証。T-27 の CI で両テスト並列実行を必須化し、片側のみ PASS は CI 失敗扱い |
| R-10 | シンボリックリンク経由のファイルが `canonicalize` で `notes_dir` 外と判定され除外される | 低 | 低 | `notes_dir` 外のリンク先は意図的に除外する設計。ドキュメントでシンボリックリンクの制限事項を明記 |
| R-11 | フィード内でカードが flex 縮小され CopyButton / DeleteButton がクリップされる（AC-EDIT-06 / 06b / 07 違反） | 高 | 中 | T-15 で `NoteCard.svelte` に `flex-shrink: 0` を必須化。T-17 で `Feed.svelte` を単一スクロール領域として構成。T-19 の E2E テストで多数カード表示時のボタン bounding box 非ゼロ・`elementFromPoint()` 取得可能性を検証 |
| R-12 | CopyButton / DeleteButton の絵文字単体表示によりフォント依存で不可視化 | 中 | 中 | T-13 / T-14 でラベルをテキスト + 枠線で常に視認可能とし絵文字単体表示を禁止。コンポーネントテストでラベルテキスト存在と bounding box 非ゼロを検証 |
