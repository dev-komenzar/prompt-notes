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

本実装計画は、PromptNotes の全必須モジュール（`module:editor`、`module:grid`、`module:storage`、`module:settings`）を対象とし、Tauri v2 + Svelte フロントエンド + Rust バックエンドの 3 層アーキテクチャに基づくデスクトップアプリケーションを Linux および macOS 向けに構築するための段階的実装ロードマップを定義する。

**対象プラットフォーム（リリース不可制約）**: Linux（バイナリ・Flatpak・NixOS）および macOS（バイナリ・Homebrew Cask）での配布を必須とする。Windows は対象外であり、Windows 固有のコードパスやビルド設定は一切含めない。すべての OS 判定ロジック（`std::env::consts::OS`、`#[cfg(target_os)]`）は `linux` と `macos` のみを分岐対象とする。

**必須モジュール完了制約（リリース不可制約）**: `module:editor`、`module:grid`、`module:storage`、`module:settings` の 4 モジュールすべての実装・テスト完了がリリース条件である。AI 呼び出し・クラウド同期・Markdown プレビュー（HTML レンダリング）・モバイル対応はスコープ外であり、これらの機能を実装するコード・依存パッケージ・設定の追加は禁止される。

**アーキテクチャ原則**: フロントエンド（Svelte / WebView）からの直接ファイルシステムアクセスは設計上禁止される。Tauri `tauri.conf.json` において `fs` プラグインを `deny`、`shell` プラグインを `deny`、`http` プラグインを `deny` に設定し、すべてのファイル操作は `#[tauri::command]` ハンドラ経由の IPC 通信でのみ実行される。設定変更（保存ディレクトリ）を含むすべてのファイルパス操作は Rust バックエンド経由で永続化し、フロントエンド単独でのファイルパス操作は禁止される。ネットワーク通信は設計上存在せず、すべてのデータはユーザーのローカルファイルシステムにのみ保存される。

**技術スタック**:

| レイヤー | 技術 | 備考 |
|---|---|---|
| フロントエンド | SvelteKit + TypeScript | ファイルベースルーティング（`/`, `/edit/:filename`, `/new`, `/settings`） |
| エディタエンジン | CodeMirror 6 + `@codemirror/lang-markdown` | Markdown シンタックスハイライトのみ。HTML レンダリング禁止。 |
| IPC 層 | Tauri v2 `invoke()` / `listen()` | 8 コマンド: `create_note`, `save_note`, `read_note`, `list_notes`, `search_notes`, `delete_note`, `get_settings`, `update_settings` |
| バックエンド | Rust (Tauri v2) | `module:shell`, `module:storage`, 設定永続化ロジック |
| データ形式 | `.md` ファイル（YAML frontmatter + Markdown 本文） | `tags` フィールドのみ。DB・インデックスエンジン不使用。 |
| YAML パース | `serde_yaml`（または `serde_yml`）クレート | frontmatter の未知フィールドはラウンドトリップ保全 |
| 日時処理 | `chrono` クレート | ファイル名 `YYYY-MM-DDTHHMMSS.md` 生成用 |
| 開発環境 | `direnv` + `nix flake` | `direnv allow` で Rust ツールチェイン・Node.js・Tauri CLI が利用可能 |
| CI/CD | GitHub Actions | Linux (`.deb`, `.AppImage`, Flatpak, NixOS) / macOS (`.dmg`, Homebrew Cask) |
| E2E テスト | Playwright | `tests/e2e/` 配下 |

**IPC コマンド一覧と所有モジュール**:

| IPC コマンド | 用途 | 所有 Rust モジュール |
|---|---|---|
| `create_note` | 新規ノート作成（ファイル名生成 + テンプレート書き込み） | `module:storage` (`storage::core`) |
| `save_note` | ノート保存（frontmatter + 本文のアトミック書き込み） | `module:storage` (`storage::core`) |
| `read_note` | ノート読み取り（frontmatter パース + 本文返却） | `module:storage` (`storage::core`) |
| `list_notes` | ノートメタデータ一覧取得（`created_at` 降順） | `module:storage` (`storage::core`) |
| `search_notes` | 全文検索 + タグフィルタ + 日付フィルタ | `module:storage` (`storage::search`) |
| `delete_note` | ノート物理削除 | `module:storage` (`storage::core`) |
| `get_settings` | 設定値読み取り | `module:settings` (Rust 側) |
| `update_settings` | 設定値更新（パスバリデーション含む） | `module:settings` (Rust 側) |

**デフォルト保存ディレクトリ**:

| OS | ノート保存先 | 設定ファイル |
|---|---|---|
| Linux | `~/.local/share/promptnotes/notes/` | `~/.config/promptnotes/config.json` |
| macOS | `~/Library/Application Support/promptnotes/notes/` | `~/Library/Application Support/promptnotes/config.json` |

**性能目標**:

| 操作 | 目標応答時間 |
|---|---|
| `create_note` | 50ms 以内 |
| `save_note`（自動保存） | 50ms 以内 |
| `read_note` | 50ms 以内 |
| `list_notes`（数百件） | 200ms 以内 |
| `search_notes`（直近 7 日間・数十件） | 100ms 以内 |
| `delete_note` | 50ms 以内 |
| `Cmd+N` / `Ctrl+N` → エディタフォーカス移動 | 200ms 以内 |
| コピーボタンクリック → クリップボード書き込み完了 | 50ms 以内 |
| エディタ画面初回ロード（`read_note` + CodeMirror マウント） | 300ms 以内 |

## 2. Milestones

### Milestone 1: プロジェクト基盤構築（Week 1〜2）

Tauri v2 プロジェクトの初期化、開発環境セットアップ、IPC 境界のセキュリティ設定、および `module:shell` の骨格実装を行う。

| タスク | 成果物 | 完了条件 |
|---|---|---|
| Tauri v2 + SvelteKit プロジェクト初期化 | `src-tauri/`, `src/`, `package.json`, `Cargo.toml` | `tauri dev` で `http://localhost:1420` にて空のアプリが起動する |
| `nix flake` + `direnv` 開発環境構築 | `flake.nix`, `.envrc` | `direnv allow` 後に Rust ツールチェイン・Node.js・Tauri CLI がすべて利用可能 |
| `tauri.conf.json` セキュリティ設定 | `tauri.conf.json` | `fs` プラグイン `deny`、`shell` プラグイン `deny`、`http` プラグイン `deny`、`clipboard-manager` は Clipboard API で代替のため不使用 |
| `module:shell` 骨格実装 | `src-tauri/src/main.rs`, `src-tauri/src/lib.rs` | `tauri::Builder` 初期化、`AppState` の `manage()` 登録、`generate_handler!` マクロに 8 コマンドのスタブ登録完了 |
| SvelteKit ルーティング設定 | `src/routes/+page.svelte`, `src/routes/edit/[filename]/+page.svelte`, `src/routes/new/+page.svelte`, `src/routes/settings/+page.svelte` | 4 ルートが空ページとして表示される |
| フロントエンド IPC 呼び出し層作成 | `src/lib/api/notes.ts`, `src/lib/api/settings.ts` | 8 コマンドの TypeScript ラッパー関数が型付きで定義される |
| 共有型定義 | `src/lib/types/note.ts`, `src/lib/types/settings.ts`, `src/lib/types/search.ts`, `src-tauri/src/storage/types.rs` | `NoteMetadata`, `Frontmatter`, `NoteData`, `SaveResult`, `SearchParams`, `Settings` の Rust 正規定義と TypeScript ミラー型が一致する |
| GitHub Actions CI パイプライン初期設定 | `.github/workflows/build.yml` | Linux と macOS の両ターゲットで `cargo build` + `npm run build` が通る |

**Milestone 1 完了基準**: `tauri dev` でアプリが起動し、8 コマンドのスタブが IPC 経由で呼び出し可能。`fs`/`shell`/`http` プラグインが `deny` 設定されていることを確認。

### Milestone 2: `module:storage` コア実装（Week 2〜3）

Rust バックエンドのファイル CRUD・frontmatter パース/シリアライズ・パス解決ロジックを実装する。

| タスク | 成果物 | 完了条件 |
|---|---|---|
| ファイル名生成 (`generate_filename`) | `src-tauri/src/storage/core.rs` | `chrono::Local::now().format("%Y-%m-%dT%H%M%S.md")` によるファイル名生成。同一秒衝突時のミリ秒サフィックス付与ロジック。 |
| ディレクトリ解決 (`resolve_notes_dir`) | `src-tauri/src/storage/core.rs` | `#[cfg(target_os = "linux")]` で `~/.local/share/promptnotes/notes/`、`#[cfg(target_os = "macos")]` で `~/Library/Application Support/promptnotes/notes/` を返却。カスタムディレクトリ設定時はそちらを優先。存在しない場合 `create_dir_all` で自動作成。 |
| frontmatter パース/シリアライズ | `src-tauri/src/storage/frontmatter.rs` | `serde_yaml` による YAML 解析。`Frontmatter` 構造体（`tags: Vec<String>`, `extra: serde_yaml::Mapping`）でラウンドトリップ保全。frontmatter 不在時は `tags: []` として扱う。 |
| `create_note` 実装 | `src-tauri/src/storage/core.rs` | ファイル名生成 → frontmatter テンプレート（空 `tags`）付き `.md` ファイル作成 → `{filename}` 返却 |
| `read_note` 実装 | `src-tauri/src/storage/core.rs` | ファイル読み込み → frontmatter/本文分離 → `NoteData { metadata, body }` 返却 |
| `save_note` 実装（アトミック書き込み） | `src-tauri/src/storage/core.rs` | frontmatter シリアライズ + 本文結合 → `.{filename}.tmp` に書き込み → `std::fs::rename()` でアトミック置換 |
| `delete_note` 実装 | `src-tauri/src/storage/core.rs` | パストラバーサル防止バリデーション（`filename` にパス区切り文字が含まれないことを検証）→ ファイル物理削除 |
| `list_notes` 実装 | `src-tauri/src/storage/core.rs` | ディレクトリ走査 → `.md` ファイルのみ対象（`.tmp` 除外、`YYYY-MM-DDTHHMMSS.md` 形式チェック）→ frontmatter パース → `NoteMetadata[]` を `created_at` 降順で返却。`body_preview` は本文先頭 200 文字。 |
| セキュリティ対策 | `src-tauri/src/storage/core.rs` | パストラバーサル防止（フルパス正規化後に `notes_dir` 配下であることを確認）、シンボリックリンク非追跡 |
| Rust ユニットテスト | `src-tauri/src/storage/tests/` | 全 CRUD 操作、frontmatter パース、パス解決、パストラバーサル拒否、アトミック書き込みの各テスト |

**Milestone 2 完了基準**: 8 IPC コマンドのうち `create_note`, `read_note`, `save_note`, `delete_note`, `list_notes` が Rust ユニットテストを通過し、IPC 経由でフロントエンドから呼び出し可能。

### Milestone 3: `module:storage` 検索 + `module:settings` 実装（Week 3〜4）

全文検索・フィルタリングと設定管理の実装を行う。

| タスク | 成果物 | 完了条件 |
|---|---|---|
| `search_notes` 実装 | `src-tauri/src/storage/search.rs` | ファイル全走査方式。パラメータ: `query`（大文字小文字非区別部分文字列検索、本文のみ対象）、`tags`（AND 条件完全一致）、`date_from`/`date_to`（ファイル名からパースした日付に対する範囲フィルタ）。直近 7 日間・数十件で 100ms 以内。 |
| 設定永続化ロジック（Rust 側） | `src-tauri/src/settings/` | `config.json` の読み書き。Linux: `~/.config/promptnotes/config.json`、macOS: `~/Library/Application Support/promptnotes/config.json`。`notes_dir` フィールドの管理。 |
| `get_settings` 実装 | `src-tauri/src/settings/` | 設定ファイル読み込み → `Settings { notes_dir }` 返却。ファイル不在時はデフォルト値を返却。 |
| `update_settings` 実装 | `src-tauri/src/settings/` | 新しい `notes_dir` を受け取り → ディレクトリ存在確認 + 書き込み権限検証（`module:storage` のバリデーション関数呼び出し）→ `config.json` に永続化。バリデーション失敗時はエラー返却。 |
| Rust ユニットテスト追加 | `src-tauri/src/storage/tests/`, `src-tauri/src/settings/tests/` | `search_notes` のフィルタ組み合わせテスト、設定読み書きテスト |

**Milestone 3 完了基準**: 8 IPC コマンドすべてが実装完了し、Rust ユニットテストを通過。

### Milestone 4: `module:editor` 実装（Week 4〜5）

CodeMirror 6 エディタ、コピーボタン、自動保存、キーバインドを実装する。

| タスク | 成果物 | 完了条件 |
|---|---|---|
| `CodeMirrorWrapper.svelte` | `src/lib/components/editor/CodeMirrorWrapper.svelte` | CodeMirror 6 `EditorView` のライフサイクル管理。拡張登録: `@codemirror/lang-markdown`（シンタックスハイライト）、`defaultKeymap`、`historyKeymap`、`history()`、`EditorView.lineWrapping`。HTML レンダリング要素（`<h1>`, `<strong>` 等）の生成なし。 |
| `frontmatter-decoration.ts` | `src/lib/components/editor/frontmatter-decoration.ts` | CodeMirror 6 `ViewPlugin` として `---` 〜 `---` 範囲に `.cm-frontmatter-bg` CSS クラスを `Decoration.line()` で適用。CSS: `background-color: rgba(59, 130, 246, 0.08)` を `src/lib/styles/editor.css` に定義。 |
| `CopyButton.svelte` | `src/lib/components/editor/CopyButton.svelte` | 1 クリックで本文全体（frontmatter 除外、正規表現 `/^---\n[\s\S]*?\n---\n/` で検出）をクリップボードにコピー。`navigator.clipboard.writeText()` 使用（Tauri `clipboard-manager` プラグイン不使用）。クリック後「✓ コピー済み」表示を 2 秒間維持。エディタ画面右上に固定配置。 |
| `autosave.ts` | `src/lib/components/editor/autosave.ts` | `EditorView.updateListener` 拡張。デバウンス間隔 750ms（初期値、500ms〜1000ms 範囲で最終調整）。`docChanged` 時のみ発火。frontmatter/body 分離後に `saveNote()` を呼び出し。 |
| `keybindings.ts` | `src/lib/components/editor/keybindings.ts` | `Cmd+N`（macOS）/ `Ctrl+N`（Linux）グローバルキーバインド。`navigator.platform` で OS 判定。`event.preventDefault()` でブラウザデフォルト動作抑制。`createNote()` → `goto('/edit/${filename}')` → `editorView.focus()`（frontmatter 末尾次行にカーソル配置）。 |
| `TagInput.svelte` | `src/lib/components/editor/TagInput.svelte` | タグの追加・削除 UI。frontmatter 内 `tags` フィールドとの双方向バインディング。`tags` 以外のメタデータフィールドの自動挿入禁止。 |
| `EditorRoot.svelte` | `src/lib/components/editor/EditorRoot.svelte` | エディタ画面全体のレイアウト（ヘッダーバー + CodeMirror + TagInput）。状態管理（Loading/Editing/Saving/Error/Copied/Creating/SaveError）。タイトル入力欄（`<input>`, `<textarea>`）の設置禁止。`onMount` で `editorView.focus()` 呼び出し。 |
| `/edit/:filename` ルート統合 | `src/routes/edit/[filename]/+page.svelte` | `read_note` でノート読み込み → CodeMirror にセット → 自動保存有効化 |
| `/new` ルート実装 | `src/routes/new/+page.svelte` | `create_note` → `/edit/:filename` へ即時リダイレクト |

**Milestone 4 完了基準**: エディタ画面で CodeMirror 6 によるプレーンテキスト Markdown 編集、frontmatter 背景色表示、1 クリックコピー、自動保存、`Cmd+N`/`Ctrl+N` による新規ノート作成がすべて動作する。タイトル入力欄・HTML レンダリング要素が存在しない。

### Milestone 5: `module:grid` 実装（Week 5〜6）

グリッドビューの Masonry レイアウト、フィルタリング UI、全文検索連携、画面遷移を実装する。

| タスク | 成果物 | 完了条件 |
|---|---|---|
| `MasonryGrid.svelte` | `src/lib/components/grid/MasonryGrid.svelte` | CSS `columns` による Pinterest スタイル可変高カードレイアウト。レスポンシブ: 3 列（900px 超）、2 列（600px〜900px）、1 列（600px 以下）。 |
| `NoteCard.svelte` | `src/lib/components/grid/NoteCard.svelte` | `NoteMetadata` に基づくカード表示（`body_preview`、タグバッジ、`created_at` の人間可読形式、削除ボタン）。カード全体がクリック領域で `/edit/:filename` へ遷移。削除ボタンは `stopPropagation()` でクリック伝播防止。 |
| `SearchBar.svelte` | `src/lib/components/grid/SearchBar.svelte` | 全文検索テキスト入力。300ms デバウンス。 |
| `TagFilter.svelte` | `src/lib/components/grid/TagFilter.svelte` | `list_notes` 結果からタグ候補を収集・重複排除。複数選択（AND 条件）。 |
| `DateFilter.svelte` | `src/lib/components/grid/DateFilter.svelte` | 日付範囲セレクタ。デフォルト: 直近 7 日間（`date_from` = 7 日前、`date_to` = 当日）。「全期間」選択でフィルタ解除可能。 |
| `DeleteConfirmDialog.svelte` | `src/lib/components/grid/DeleteConfirmDialog.svelte` | 削除確認ダイアログ。`body_preview` 先頭部分を表示して誤削除防止。確認後 `delete_note` → `search_notes` 再発行で一覧更新。 |
| `gridFilter.ts` ストア | `src/lib/stores/gridFilter.ts` | `SearchParams` 型のリアクティブストア。デフォルトフィルタ値の初期化。エディタからの戻り遷移時にフィルタ状態保持。 |
| `GridPage` 統合 | `src/routes/+page.svelte` | フィルタ変更 → `search_notes` 発行 → `MasonryGrid` 再描画。空結果時メッセージ表示（「この期間のノートはありません。日付フィルタを変更してください。」）。ローディングインジケータ表示。 |

**Milestone 5 完了基準**: グリッドビューで直近 7 日間のノートが Masonry レイアウトで表示され、全文検索・タグフィルタ・日付フィルタが動作し、カードクリックでエディタ画面に遷移し、削除確認後にノートが物理削除される。

### Milestone 6: `module:settings` UI + 結合テスト（Week 6〜7）

設定画面の UI 実装と全モジュールの結合テストを行う。

| タスク | 成果物 | 完了条件 |
|---|---|---|
| 設定画面 UI | `src/lib/components/settings/SettingsPage.svelte`, `src/routes/settings/+page.svelte` | 保存ディレクトリパスの変更 UI。`get_settings` で現在値表示、`update_settings` でバリデーション付き更新。パスバリデーション失敗時のエラー表示。 |
| 全モジュール結合確認 | — | グリッドビュー → エディタ → 自動保存 → グリッドビューに戻り変更が反映されるエンドツーエンドのワークフロー確認 |
| E2E テスト実装 | `tests/e2e/` 配下 | 下記テストケース一覧のすべてが Playwright で通過 |

**E2E テストケース一覧**:

| テストファイル | 検証内容 |
|---|---|
| `scope-guard.browser.spec.ts` | 外部 API 呼び出し（`fetch`, `XMLHttpRequest`）の不在（ネットワーク通信禁止） |
| `editor-copy.spec.ts` | コピーボタンで本文（frontmatter 除外）がクリップボードに書き込まれる。「✓ コピー済み」が 2 秒間表示される。 |
| `editor-new-note.spec.ts` | `Cmd+N` / `Ctrl+N` で新規ノート作成 → エディタにフォーカス移動 |
| `editor-frontmatter.spec.ts` | frontmatter 領域に `.cm-frontmatter-bg` CSS クラスが適用されている |
| `editor-no-title-input.spec.ts` | エディタ画面にタイトル専用 `input` / `textarea` が存在しない |
| `editor-no-render.spec.ts` | エディタ本文領域に `<h1>`, `<strong>`, `<em>` 等の HTML 要素が存在しない |
| `editor-autosave.spec.ts` | テキスト入力後、デバウンス経過後に `save_note` IPC が発行される |
| `grid-default-filter.spec.ts` | 初回ロード時に直近 7 日間フィルタが適用され、該当ノートが Masonry レイアウトで表示される |
| `grid-search.spec.ts` | 全文検索入力後 300ms デバウンス経過後に結果が更新される |
| `grid-tag-filter.spec.ts` | タグ選択時にフィルタ結果が更新される |
| `grid-date-filter.spec.ts` | 日付範囲変更時にフィルタ結果が更新される |
| `grid-card-click.spec.ts` | カードクリックで `/edit/:filename` へ遷移 |
| `grid-delete.spec.ts` | 削除確認ダイアログ → 確認後にカードが消去される |
| `grid-empty.spec.ts` | 検索結果 0 件時に空状態メッセージが表示される |
| `dom-no-title-input.spec.ts` | DOM 全体にタイトル専用 `input` / `textarea` が存在しない |

**Milestone 6 完了基準**: 4 モジュールすべてが統合動作し、上記 E2E テストがすべて通過。

### Milestone 7: ビルド・配布パイプライン + リリース（Week 7〜8）

GitHub Actions での自動ビルドと各プラットフォーム向けパッケージ生成を完了する。

| タスク | 成果物 | 完了条件 |
|---|---|---|
| Linux ビルド | `.deb`, `.AppImage` | GitHub Actions で自動生成、動作確認済み |
| Linux Flatpak パッケージ | Flatpak manifest + ビルド | Flatpak でインストール・起動可能 |
| Linux NixOS パッケージ | Nix derivation | NixOS でインストール・起動可能 |
| macOS ビルド | `.dmg` | GitHub Actions で自動生成、動作確認済み |
| macOS Homebrew Cask | Cask formula | `brew install --cask promptnotes` でインストール・起動可能 |
| リリースチェックリスト | — | 4 モジュール実装完了、全 E2E テスト通過、Linux/macOS 両プラットフォームでパッケージ配布可能 |

**Milestone 7 完了基準**: Linux（`.deb`, `.AppImage`, Flatpak, NixOS）および macOS（`.dmg`, Homebrew Cask）向けのビルド成果物が GitHub Actions から自動生成され、各パッケージ形式でインストール・起動・基本ワークフロー（ノート作成 → 編集 → コピー → グリッド表示 → 検索 → 削除）が動作する。

## 3. Risks

### R1: 全文検索の性能劣化（高影響・中確率）

**リスク**: `search_notes` はファイル全走査方式で実装するため、ノート件数が数千件規模に達した場合に 100ms 目標を超過し、グリッドビューの検索操作で体感遅延が発生する。

**緩和策**: 直近 7 日間デフォルトフィルタにより日常的な検索対象件数を数十件に抑制する。日付フィルタが指定されている場合はファイル名の日付パースのみで走査対象を絞り込み、本文読み込み件数を削減する。件数増大で体感遅延が発生した時点で ADR FU-002 として Tantivy 等の Rust ネイティブ全文検索エンジン導入を判断する。

### R2: 同一秒内ファイル名衝突（低影響・低確率）

**リスク**: `Cmd+N`/`Ctrl+N` の連打により同一秒内に複数の `create_note` が発行され、`YYYY-MM-DDTHHMMSS.md` 形式のファイル名が衝突する。

**緩和策**: `module:storage` の `generate_filename` でファイル存在チェックを行い、衝突時はミリ秒サフィックス（例: `2026-04-10T091530_001.md`）を付与する。フロントエンド側でも `create_note` 完了まで追加の `Cmd+N`/`Ctrl+N` を抑制する。

### R3: TypeScript 型と Rust 構造体の乖離（中影響・中確率）

**リスク**: `NoteMetadata` 等の共有型について、Rust 側の `struct` 定義とフロントエンド側の TypeScript ミラー型が手動同期のため乖離し、ランタイムエラーが発生する。

**緩和策**: E2E テストで IPC 経由のデータ受け渡しを検証し、型不一致をテスト時に検出する。将来的に `ts-rs` クレートによる TypeScript 型自動生成の導入を検討する（初回実装完了後、型乖離が問題化した時点で判断）。

### R4: CodeMirror 6 + Tauri WebView の互換性（中影響・低確率）

**リスク**: CodeMirror 6 の一部機能（IME 入力、クリップボード操作等）が Tauri v2 の WebView（Linux: WebKitGTK、macOS: WKWebView）で期待どおりに動作しない。

**緩和策**: Milestone 4 のエディタ実装時に Linux（WebKitGTK）と macOS（WKWebView）の両環境で IME 入力・`navigator.clipboard.writeText()` の動作を早期検証する。問題発覚時は Tauri の `clipboard-manager` プラグインへのフォールバックを検討する。

### R5: frontmatter ラウンドトリップ保全の不完全性（低影響・中確率）

**リスク**: `serde_yaml` の `serde(flatten)` + `serde_yaml::Mapping` 方式では、YAML コメントやフォーマット（インデント、クォート形式等）がラウンドトリップ時に維持されない可能性がある。ユーザーが手動編集した frontmatter の書式が自動保存で変更される。

**緩和策**: Milestone 2 の frontmatter パース実装時にラウンドトリップ保全の動作検証を行う。書式維持が不十分な場合は、正規表現ベースの frontmatter 抽出（`tags` フィールドのみ更新し、他の部分は原文を保持）への切り替えを検討する。

### R6: Flatpak / NixOS パッケージングの複雑性（中影響・中確率）

**リスク**: Tauri v2 アプリの Flatpak マニフェスト作成や NixOS derivation 記述に想定以上の工数がかかり、Milestone 7 の配布パイプライン構築が遅延する。

**緩和策**: Milestone 1 の段階で Flatpak / NixOS 向けの基本ビルドを試行し、技術的障壁を早期に特定する。`.deb` / `.AppImage` / `.dmg` は Tauri の標準ビルド機能で生成可能なため、これらを優先し、Flatpak / NixOS は並行して対応する。

### R7: 自動保存のデバウンス間隔の最適化（低影響・高確率）

**リスク**: デバウンス間隔 750ms（初期値）がユーザーのタイピングパターンと合わず、ディスク I/O が過剰に発生するか、または保存漏れリスクが生じる。

**緩和策**: デバウンス間隔を定数として分離し、500ms〜1000ms の範囲で調整可能にする。Milestone 6 の結合テスト時にユーザーテストを実施し、体感フィードバックに基づいて最終値を決定する。

### R8: 保存ディレクトリ変更時の既存ノート扱い（中影響・低確率）

**リスク**: 設定画面で保存ディレクトリを変更した場合、既存ノートが旧ディレクトリに残り、グリッドビューから見えなくなる。ユーザーが混乱する可能性がある。

**緩和策**: 設定変更時の UI に「既存ノートは自動的には移動されません。手動で移動してください。」の警告メッセージを表示する。既存ノートの自動移動機能は将来の設計レビューで判断する。
