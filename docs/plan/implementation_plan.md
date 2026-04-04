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

本実装計画は、PromptNotes（Tauri ベースのローカルファーストプロンプトノートアプリケーション）の開発を、依存設計書群（Component Architecture & IPC Boundary、Editor & Clipboard Detailed Design、Storage & File Format Detailed Design、Grid View & Search Detailed Design）に基づき、具体的なマイルストーンとリスク管理に落とし込むものである。

### 1.1 対象スコープ

PromptNotes は Tauri（Rust バックエンド + WebView フロントエンド）アーキテクチャ上に構築され、以下の5モジュールで構成される。

| モジュール | 所有者 | 主要責務 |
|-----------|--------|---------|
| `module:shell` | Rust バックエンド | Tauri IPC コマンドルーティング、CSP/allowlist 管理、プラットフォーム固有パス解決 |
| `module:editor` | フロントエンド WebView SPA | CodeMirror 6 エディタ、1クリックコピーボタン、自動保存デバウンス、`Cmd+N`/`Ctrl+N` キーバインド |
| `module:grid` | フロントエンド（UI）+ Rust バックエンド（データ） | Pinterest スタイル可変高カードレイアウト、タグ/日付フィルタ、全文検索、カードクリック遷移 |
| `module:storage` | Rust バックエンド | ファイル I/O（`std::fs`）、ファイル名生成（`chrono`）、frontmatter パース（`serde_yaml`）、プレビュー生成 |
| `module:settings` | フロントエンド（UI）+ Rust バックエンド（永続化） | 保存ディレクトリ変更 UI、`config.json` 読み書き（`serde_json`）、パスバリデーション |

### 1.2 対象プラットフォーム

| プラットフォーム | WebView エンジン | 配布形式 |
|-----------------|-----------------|---------|
| Linux | GTK WebView（WebKitGTK） | `.AppImage` / `.deb`、Flatpak（Flathub）、Nix パッケージ |
| macOS | WKWebView | `.dmg`、Homebrew Cask |

**Windows は対象外であり、ビルド・配布パイプラインを構築しない。** この制約は CI/CD 構成、テストマトリクス、依存クレート選定の全工程に反映される。

### 1.3 リリース不可制約への準拠

本実装計画は以下のリリース不可制約をすべてのマイルストーンの完了条件に組み込む。各制約に違反する成果物が存在する場合、該当マイルストーンは完了とみなさない。

**プラットフォーム制約（`platform:linux`, `platform:macos`）:**

Linux（バイナリ・Flatpak・NixOS）および macOS（バイナリ・Homebrew Cask）での配布を必須とする。全マイルストーンの受け入れテストは Linux・macOS 双方で実行する。Windows 向けビルド・テスト・配布パイプラインは構築禁止とする。

**モジュール制約（`module:editor`, `module:grid`, `module:storage`, `module:settings`）:**

4つの必須モジュールの実装・テスト完了がリリースの前提条件である。以下の機能はスコープ外であり実装禁止とする。

| 実装禁止機能 | CI 検出方法 |
|-------------|-----------|
| AI 呼び出し（LLM API） | `tauri.conf.json` の `http` allowlist が `false` であること。CSP `connect-src` 制限。`fetch`/`XMLHttpRequest` 使用の lint 検出。 |
| クラウド同期 | `Cargo.toml` に `reqwest`、`hyper` 等ネットワーク系クレートが存在しないこと。 |
| Markdown プレビュー（HTML レンダリング） | `package.json` に `marked`、`markdown-it`、`remark-html` 等が存在しないこと。受け入れテスト FAIL-05。 |
| モバイル対応 | Tauri モバイルビルド設定が存在しないこと。 |
| データベース | `Cargo.toml` に `rusqlite`、`diesel`、`sea-orm`、`sqlx` 等が存在しないこと。IndexedDB API 使用の lint 検出。 |

**Tauri IPC 境界制約（`module:shell`, `framework:tauri`）:**

Tauri IPC 境界を明確化し、フロントエンドからの直接ファイルシステムアクセスを禁止する。全ファイル操作は Rust バックエンド経由とする。この制約は3層で担保する。

1. **`tauri.conf.json` の `allowlist`:** `fs: { all: false }`, `path: { all: false }`, `shell: { all: false }`, `http: { all: false }`, `dialog: { all: false }` を設定。
2. **CSP ヘッダ:** `connect-src` を `ipc:` スキームのみに制限。
3. **カスタムコマンドのパスバリデーション:** `save_note`、`read_note`、`update_settings` 等でパストラバーサル（`../` 等）を検出・拒否。ファイル名形式 `YYYY-MM-DDTHHMMSS.md` の正規表現チェック。

**設定永続化制約（`module:storage`, `module:settings`）:**

設定変更（保存ディレクトリ）は Rust バックエンド経由で永続化する。フロントエンド単独でのファイルパス操作は禁止する。フロントエンドは `update_settings` IPC コマンドでパス文字列を送信するのみであり、`config.json` のパス・フォーマット・ディレクトリ作成ロジックを知ることはない。

### 1.4 IPC コマンド一覧（確定・全8コマンド）

| コマンド | 引数 | 戻り値 | 呼び出し元モジュール |
|---------|------|--------|-------------------|
| `create_note` | なし | `{ filename: string, path: string }` | `module:editor` |
| `save_note` | `{ filename: string, content: string }` | `{ success: bool }` | `module:editor` |
| `read_note` | `{ filename: string }` | `{ content: string, tags: string[] }` | `module:editor` |
| `list_notes` | `{ from_date: string, to_date: string, tag?: string }` | `{ notes: NoteEntry[] }` | `module:grid` |
| `search_notes` | `{ query: string, from_date?: string, to_date?: string }` | `{ results: NoteEntry[] }` | `module:grid` |
| `get_all_tags` | なし | `{ tags: string[] }` | `module:grid` |
| `get_settings` | なし | `{ notes_dir: string }` | `module:settings` |
| `update_settings` | `{ notes_dir: string }` | `{ success: bool }` | `module:settings` |

### 1.5 未決定事項の実装計画への影響

設計書群に記載されたオープンクエスチョンのうち、マイルストーン構成に直接影響するものを以下に示す。

| OQ ID | 内容 | 影響マイルストーン | 暫定方針 |
|-------|------|------------------|---------|
| OQ-001 | フロントエンド UI フレームワーク選定（React vs Svelte） | M0（技術検証） | プロトタイプで比較評価し M0 完了時に確定 |
| OQ-002 | 自動保存デバウンス間隔（500ms–2000ms） | M2（エディタ実装） | 暫定値 1000ms で実装し M4（統合テスト）で最終調整 |
| GS-OQ-001 | Masonry レイアウト実装方式（CSS columns / CSS Grid masonry / JS ライブラリ） | M0（技術検証） | WebKitGTK・WKWebView での技術検証プロトタイプで確定 |
| OQ-006 / Tauri v2 | Tauri v2 の IPC/セキュリティモデル変更への対応 | M0（技術検証） | Tauri v2 安定版のリリース状況を評価し、v1 または v2 を M0 完了時に確定 |
| Storage OQ-001 | 同一秒内ファイル名衝突のフォールバック | M1（ストレージ実装） | 秒精度で十分と想定し、衝突時はエラー返却。連打テストで検証。 |
| Storage OQ-003 | 外部ツール追加 frontmatter フィールド保持ポリシー | M1（ストレージ実装） | 互換性重視で raw YAML 部分更新を検討。技術検証で実装コスト比較。 |

---

## 2. Milestones

### M0: 技術検証・プロジェクト基盤構築（2週間）

**目的:** フロントエンド UI フレームワーク、Masonry レイアウト方式、Tauri バージョンを確定し、プロジェクトスケルトンを構築する。

**成果物:**

| 成果物 | 詳細 |
|--------|------|
| Tauri プロジェクトスケルトン | `tauri.conf.json`（allowlist 全 false 設定済み）、CSP ヘッダ設定、Rust バックエンド空プロジェクト |
| UI フレームワーク選定結果 | React vs Svelte の技術検証レポート。CodeMirror 6 統合安定性（React: `@uiw/react-codemirror` ラッパー品質、Svelte: 直接 DOM マウント）、frontmatter 背景色カスタムデコレーション実装容易性、ビルドサイズ比較、Tauri IPC 統合パターンの評価結果。 |
| Masonry レイアウト方式選定結果 | CSS `columns` / CSS Grid `masonry` / JavaScript ライブラリ（`react-masonry-css` 等）の WebKitGTK・WKWebView 双方での動作検証結果 |
| CI/CD パイプライン初期構成 | Linux・macOS デュアルプラットフォームビルド、排除機能検出チェック（`Cargo.toml` 依存検査、`package.json` 依存検査、`tauri.conf.json` allowlist 検査） |
| `<input type="date">` の WebView 互換性検証 | WebKitGTK・WKWebView での日付ピッカー UI ネイティブサポート状況 |

**完了条件:**

- OQ-001（UI フレームワーク選定）が確定している
- GS-OQ-001（Masonry レイアウト方式）が確定している
- `tauri.conf.json` の `allowlist` が全 `false` で設定され、CI でチェックされている
- Linux・macOS 双方で `tauri dev` によるスケルトンアプリ起動が確認されている
- 排除機能（AI、クラウド同期、DB、Markdown レンダリング）の CI 検出チェックが稼働している

---

### M1: Rust バックエンド — `module:storage` + `module:shell` コア実装（2週間）

**目的:** ファイル I/O、IPC コマンドルーティング、設定管理の Rust バックエンドコアを実装する。

**実装対象:**

| コンポーネント | 実装内容 |
|--------------|---------|
| `module:shell` — Tauri Command Router | `#[tauri::command]` マクロによる全8 IPC コマンド登録。コマンド許可リスト管理。 |
| `module:storage` — ファイル名生成 | `chrono::Local::now()` → `format!("{}", dt.format("%Y-%m-%dT%H%M%S"))` + `.md`。同一秒衝突検出（`path.exists()` チェック、衝突時エラー返却）。 |
| `module:storage` — ファイル読み書き | `std::fs::write`（新規作成・上書き保存）、`std::fs::read_to_string`（読み取り）。パストラバーサル防止（`..`、`/`、`\` 検出）。ファイル名正規表現 `^\d{4}-\d{2}-\d{2}T\d{6}\.md$` チェック。 |
| `module:storage` — frontmatter パーサー | `serde_yaml` による `Frontmatter { tags: Vec<String> }` デシリアライズ。`serde(default)` で `tags` 未指定時は空配列。寛容パース（`tags` 以外のフィールドは無視）。 |
| `module:storage` — frontmatter テンプレート | 新規ノート用 `---\ntags: []\n---\n\n` テンプレート生成・書き込み。 |
| `module:storage` — プレビュー生成 | 本文先頭から最大200文字（暫定値、OQ-004）を切り出し、改行を半角スペースに置換。 |
| `module:storage` — 日付フィルタリング | ファイル名 `YYYY-MM-DDTHHMMSS.md` → `NaiveDate` パース → `from_date` ≤ 日付 ≤ `to_date` 判定。 |
| `module:storage` — タグフィルタリング | frontmatter `tags` フィールドと指定タグの一致判定。日付フィルタとの AND 結合。 |
| `module:storage` — 全文検索 | `std::fs::read_dir` → `std::fs::read_to_string` → `content.to_lowercase().contains(&query_lower)`（case-insensitive デフォルト）。 |
| `module:storage` — タグ一覧集約 | 全 `.md` ファイルの frontmatter から `tags` を収集し、重複排除して返却。 |
| Settings Manager — `config.json` 読み書き | `serde_json` + `std::fs` による `config.json`（`{ "notes_dir": "..." }`）の読み書き。`serde_json::to_string_pretty` で人間可読形式。 |
| Settings Manager — ディレクトリ変更バリデーション | `Path::canonicalize`、`std::fs::create_dir_all`、書き込み権限テスト（テストファイル書き込み→削除）。 |
| Settings Manager — デフォルトパス解決 | `dirs::data_dir()` + `promptnotes/notes/`（ノート）、`dirs::config_dir()` + `promptnotes/config.json`（設定）。 |
| `NoteEntry` 型定義 | `#[derive(Serialize)] struct NoteEntry { filename, created_at, tags, preview }`。`created_at` はファイル名から導出。 |

**プラットフォーム別デフォルトパス:**

| プラットフォーム | ノート保存先 | 設定ファイル |
|-----------------|-------------|-------------|
| Linux | `~/.local/share/promptnotes/notes/` | `~/.config/promptnotes/config.json` |
| macOS | `~/Library/Application Support/promptnotes/notes/` | `~/Library/Application Support/promptnotes/config.json` |

**完了条件:**

- 全8 IPC コマンド（`create_note`、`save_note`、`read_note`、`list_notes`、`search_notes`、`get_all_tags`、`get_settings`、`update_settings`）が `#[tauri::command]` で登録され、単体テスト合格
- ファイル名 `YYYY-MM-DDTHHMMSS.md` の生成・パース・不変性がテストで検証済み
- パストラバーサル防止、ファイル名形式バリデーションがテストで検証済み
- frontmatter パース（`serde_yaml`、`tags` のみ、寛容パース）がテストで検証済み
- デフォルトディレクトリ解決・`config.json` 読み書き・ディレクトリ変更バリデーションが Linux・macOS 双方でテスト済み
- `Cargo.toml` に `rusqlite`、`diesel`、`sea-orm`、`sqlx`、`reqwest`、`hyper` が含まれないことを CI で確認

---

### M2: フロントエンド — `module:editor` 実装（2週間）

**目的:** CodeMirror 6 ベースのエディタ画面を実装し、自動保存・1クリックコピー・新規ノート作成のコア UX を完成させる。

**実装対象:**

| コンポーネント | 実装内容 |
|--------------|---------|
| `EditorPage` コンポーネント | エディタ画面ルートコンテナ。DOM 構成: Toolbar + CodeMirrorContainer のみ。タイトル入力欄（`<input>`、`<textarea>`、`contenteditable` タイトル要素）を一切含めない。Markdown プレビューパネルを含めない。 |
| CodeMirror 6 統合 | `EditorState.create` に以下の extensions 配列を構成: `markdown()`（`@codemirror/lang-markdown`）、`frontmatterDecoration()`、`autoSaveListener()`、`keymap.of(promptNotesKeymap)`、`keymap.of(defaultKeymap)`、`keymap.of(historyKeymap)`、`history()`、`EditorView.lineWrapping` |
| `FrontmatterDecoration` ViewPlugin | `ViewPlugin.fromClass` で実装。`Decoration.line` による背景色 CSS クラス（`.cm-frontmatter-line { background-color: rgba(135, 206, 250, 0.12) }`）付与。3状態遷移: デコレーションなし → 部分 frontmatter → 完全 frontmatter。 |
| `AutoSaveListener` エクステンション | `EditorView.updateListener.of` で `docChanged` 検出。デバウンス間隔 1000ms（暫定値、OQ-002）。`saving` フラグで重複保存防止。デバウンス完了後 `invoke("save_note", { filename, content })` 呼び出し。 |
| `promptNotesKeymap` エクステンション | `keymap.of([{ key: "Mod-n", run: handleCreateNote }])`。`Mod` は macOS で `Cmd`、Linux で `Ctrl`。未保存変更の即時保存（デバウンスバイパス、`await` で完了待ち） → `invoke("create_note")` → `read_note` → `EditorState` 再構築 → 本文先頭（frontmatter 直後）にカーソル配置・フォーカス移動。 |
| `CopyButton` コンポーネント | ツールバー配置。クリック時: `editorView.state.doc.toString()` → 正規表現 `/^---\n[\s\S]*?\n---\n/` で frontmatter 除外 → `bodyText.trim()` → `navigator.clipboard.writeText(trimmedBody)`。コピー完了フィードバック: ボタンアイコンを ✓ に1.5秒間一時変更（暫定値、OQ-009）。連続クリック時は即座にリセットし新たに ✓ 表示。 |
| エラーハンドリング | `save_note` IPC 失敗: インライン警告バー表示、次変更時再試行。`create_note` IPC 失敗: インラインエラー表示、現在ノート維持。`read_note` IPC 失敗: エラー画面 + グリッドビュー戻りリンク。`navigator.clipboard.writeText` 失敗: ボタンにエラーアイコン一時表示。 |
| ルーティング | `/edit/:filename`（既存ノート編集）、`/edit/new`（新規ノート作成、`Cmd+N`/`Ctrl+N` と同等） |

**必須 npm パッケージ:**

| パッケージ | 用途 |
|-----------|------|
| `@codemirror/state` | エディタ状態管理 |
| `@codemirror/view` | エディタビュー・DOM 統合 |
| `@codemirror/lang-markdown` | Markdown シンタックスハイライト（レンダリングではない） |
| `@codemirror/commands` | 基本編集コマンド（undo/redo 等） |
| `@codemirror/language` | 言語サポート基盤（`lang-markdown` 依存） |

**禁止パッケージ:** `marked`、`markdown-it`、`remark-html` 等の Markdown → HTML 変換ライブラリ。`@codemirror/view` の `Decoration.widget` を使った HTML プレビューウィジェット。

**完了条件:**

- CodeMirror 6 インスタンスが正常動作し、Markdown シンタックスハイライトが適用されている
- frontmatter 領域が背景色（`.cm-frontmatter-line`）で視覚的に区別されている
- `Cmd+N`（macOS）/ `Ctrl+N`（Linux）でフォーカス移動完了まで体感遅延なしで新規ノート作成できる
- 1クリックコピーボタンで frontmatter 除外後の本文全文がクリップボードにコピーされ、✓ フィードバックが表示される
- 自動保存がデバウンス後に `save_note` IPC を正常に呼び出し、手動保存（`Cmd+S`/`Ctrl+S`、ボタン）が存在しない
- エディタ画面 DOM にタイトル入力欄が存在しないことを Playwright で自動検証（FAIL-04）
- プレビューパネル・レンダリング UI が存在しないことを Playwright で自動検証（FAIL-05）
- `package.json` に Markdown レンダリングライブラリが含まれないことを CI で確認
- Linux・macOS 双方で動作確認済み

---

### M3: フロントエンド — `module:grid` + `module:settings` 実装（2週間）

**目的:** グリッドビュー（Pinterest スタイルカードレイアウト、フィルタ、検索）と設定画面を実装し、アプリケーションの画面遷移を完成させる。

**`module:grid` 実装対象:**

| コンポーネント | 実装内容 |
|--------------|---------|
| `GridPage` | ルートコンポーネント。マウント時に `list_notes`（デフォルト直近7日間: `from_date = now - 7日`, `to_date = now`）と `get_all_tags` を `Promise.all` で並行呼び出し。7日間の算出はフロントエンド側。 |
| `FilterBar` | `TagFilter` + `DateFilter` のコンテナ。 |
| `TagFilter` | `get_all_tags` で取得したタグ一覧からドロップダウン選択。選択時 `list_notes` を `tag` 引数付きで再呼び出し。日付フィルタとの AND 結合。 |
| `DateFilter` | `<input type="date">` による日付範囲（`from_date`, `to_date`）入力。初期値は直近7日間。変更時 `list_notes` 再呼び出し。 |
| `SearchBar` | 全文検索入力欄。入力デバウンス 300ms。デバウンス完了後 `invoke("search_notes", { query, from_date?, to_date? })`。クエリ空でフィルタモード復帰。 |
| `CardGrid` | `NoteEntry[]` を Pinterest スタイル Masonry レイアウトで描画。M0 で確定した方式（CSS `columns` / CSS Grid `masonry` / JS ライブラリ）で実装。 |
| `NoteCard` | カード表示要素: `created_at`（日時）、`tags`（チップ形式）、`preview`（本文プレビュー）。タイトル表示欄なし。`onClick` → `navigate("/editor/{filename}")`。`role="button"` + `tabIndex={0}` でキーボードアクセシビリティ対応。 |
| フィルタモード/検索モード排他制御 | 検索バーにクエリがある間は `search_notes` を使用、クエリ空で `list_notes` に切り替え。 |

**`module:settings` 実装対象:**

| コンポーネント | 実装内容 |
|--------------|---------|
| `SettingsPage` | 設定画面コンポーネント。マウント時 `invoke("get_settings")` で現在の `notes_dir` を取得・表示。 |
| ディレクトリ変更 UI | 新しいディレクトリパス文字列を入力し、`invoke("update_settings", { notes_dir })` で送信。フロントエンドはパスの正規化・ディレクトリ作成・`config.json` 書き込みには関与しない。 |

**ルーティング定義（全画面）:**

| ルートパス | 画面 | 所有モジュール |
|-----------|------|--------------|
| `/` または `/grid` | グリッドビュー（デフォルト画面） | `module:grid` |
| `/editor/:filename` | エディタ画面 | `module:editor` |
| `/settings` | 設定画面 | `module:settings` |

**完了条件:**

- グリッドビューに Pinterest スタイル可変高カードが表示される
- 画面マウント時にデフォルト直近7日間のノートが表示される
- タグフィルタ（ドロップダウン選択）・日付フィルタ（日付範囲変更）が AND 条件で正常動作する
- 全文検索（300ms デバウンス後）が case-insensitive で結果を返す
- カードクリックで `/editor/{filename}` に SPA 遷移し、エディタに該当ノートが表示される
- 設定画面で保存ディレクトリを変更でき、変更後のディレクトリにノートが保存される
- フロントエンドから直接ファイルシステムアクセスが不可能であることを確認
- Linux・macOS 双方で動作確認済み

---

### M4: 統合テスト・E2E テスト・品質保証（2週間）

**目的:** 全モジュールを統合した E2E テスト、リリース不可制約の自動検証、パフォーマンスベンチマーク、クロスプラットフォーム動作確認を完了する。

**テスト項目:**

| テストカテゴリ | 対象 | 検証内容 |
|--------------|------|---------|
| IPC 境界統合テスト | 全8コマンド | フロントエンド → IPC → Rust バックエンド → ファイルシステムの往復が全コマンドで正常動作 |
| FAIL-04 受け入れテスト | `module:editor` | エディタ画面 DOM にタイトル入力欄（`[data-testid="title-input"]`、タイトル用 `<input>`、`<h1 contenteditable>` 等）が存在しないこと（Playwright） |
| FAIL-05 受け入れテスト | `module:editor` | プレビューパネル・レンダリング UI が存在しないこと（Playwright） |
| 1クリックコピー E2E テスト | `module:editor` | コピーボタンクリック後クリップボードに frontmatter 除外の本文全文が書き込まれていること |
| `Cmd+N`/`Ctrl+N` E2E テスト | `module:editor` | キーバインド発火 → 新規ノート作成 → 本文先頭フォーカス移動まで体感遅延なし |
| 自動保存 E2E テスト | `module:editor` + `module:storage` | テキスト入力 → デバウンス → ファイル書き込み完了をファイルシステム上で検証 |
| グリッドビュー E2E テスト | `module:grid` | デフォルト7日間フィルタ、タグフィルタ、日付フィルタ、全文検索、カードクリック遷移 |
| 設定変更 E2E テスト | `module:settings` | ディレクトリ変更 → `config.json` 更新 → 新ディレクトリへのノート保存 |
| セキュリティテスト | IPC 境界 | パストラバーサル攻撃（`../` 含むファイル名）の拒否、`allowlist` 全 false の検証、CSP `connect-src` 制限の検証 |
| パフォーマンスベンチマーク | `list_notes`、`search_notes` | 5,000 件規模での応答時間計測。許容範囲超過時 Tantivy 導入 ADR 起票。 |
| クロスプラットフォームテスト | 全モジュール | Linux（WebKitGTK）・macOS（WKWebView）双方での全 E2E テスト実行 |
| frontmatter 背景色テスト | `module:editor` | frontmatter 領域に背景色デコレーションが適用されていること（Visual regression テスト / 手動 UI レビュー） |
| 排除機能 CI ガード | 全体 | `Cargo.toml` 禁止クレート検査、`package.json` 禁止パッケージ検査、`tauri.conf.json` allowlist 検査 |

**未決定事項の最終確定:**

| 項目 | 確定方法 |
|------|---------|
| 自動保存デバウンス間隔（OQ-002） | ユーザーテストで体感遅延と保存信頼性を検証し 500ms–2000ms 内で最終値決定 |
| frontmatter 背景色カラー値（OQ-007） | デザインレビューでライトモード・ダークモードの値を確定 |
| コピー完了フィードバック表示時間（OQ-009） | ユーザーテストで 1.5秒の妥当性を検証 |
| プレビュー文字数上限（OQ-004 / GS-OQ-003） | デザインモックアップで視覚的に検証し暫定 200 文字から調整 |
| 検索の大文字小文字区別（OQ-003 / GS-OQ-004） | 日本語・英語混在テキストでの検索精度検証 |

**完了条件:**

- 全 E2E テストが Linux・macOS 双方で合格
- FAIL-04、FAIL-05 受け入れテストが CI で自動実行・合格
- パフォーマンスベンチマーク（5,000 件）が実行され、結果が記録されている
- 排除機能 CI ガードが全パス
- 全未決定事項が確定値で実装されている

---

### M5: 配布パッケージング・リリース準備（1週間）

**目的:** Linux・macOS 向けの配布アーティファクトを生成し、配布チャネルへの登録準備を完了する。

**配布パイプライン:**

| OS | 形式 | ビルドコマンド | 配布チャネル |
|----|------|--------------|-------------|
| Linux | `.AppImage` / `.deb` | `tauri build` | GitHub Releases |
| Linux | Flatpak | Flathub マニフェスト + `flatpak-builder` | Flathub |
| Linux | Nix パッケージ | `flake.nix` / `default.nix` | NixOS パッケージリポジトリ / Flake |
| macOS | `.dmg` | `tauri build` | GitHub Releases |
| macOS | Homebrew Cask | Cask フォーミュラ | Homebrew Cask tap |

**Windows 向けビルド・配布パイプラインは構築しない。**

**完了条件:**

- Linux 向け `.AppImage`/`.deb`、Flatpak、Nix パッケージが CI で自動ビルドされる
- macOS 向け `.dmg`、Homebrew Cask フォーミュラが CI で自動ビルドされる
- 全配布アーティファクトが Linux・macOS の各プラットフォームでインストール・起動・基本操作が確認されている
- リリースノートが作成されている
- Windows 向けアーティファクトが存在しないことが確認されている

---

### マイルストーン全体タイムライン

| マイルストーン | 期間 | 依存関係 |
|-------------|------|---------|
| M0: 技術検証・基盤構築 | 2週間 | なし |
| M1: Rust バックエンドコア | 2週間 | M0 完了後 |
| M2: `module:editor` 実装 | 2週間 | M1 完了後（IPC コマンド利用のため） |
| M3: `module:grid` + `module:settings` 実装 | 2週間 | M1 完了後（M2 と並行可能だが、カードクリック遷移テストに M2 が必要） |
| M4: 統合テスト・品質保証 | 2週間 | M2 + M3 完了後 |
| M5: 配布パッケージング | 1週間 | M4 完了後 |

合計: 約11週間（M2 と M3 の並行度により短縮可能）

---

## 3. Risks

### R1: WebView エンジン互換性リスク

**リスク:** Linux（WebKitGTK）と macOS（WKWebView）で CSS レイアウト（Masonry）、`<input type="date">` の日付ピッカー UI、CodeMirror 6 の描画動作に差異が発生し、デュアルプラットフォーム品質維持のコストが増大する。

**影響:** M0 の技術検証遅延、M3 のグリッドビュー実装期間超過。

**緩和策:** M0 で WebKitGTK・WKWebView 双方の技術検証プロトタイプを必須とする。CSS `columns` フォールバックまたは JavaScript ベース Masonry ライブラリ（`react-masonry-css` 等）を準備する。日付ピッカーが不十分な場合は軽量な日付入力コンポーネントで代替する。全 E2E テストを Linux・macOS 双方で実行する CI マトリクスを M0 で構築する。

### R2: UI フレームワーク選定リスク（OQ-001）

**リスク:** React と Svelte の技術検証で、CodeMirror 6 統合安定性・frontmatter カスタムデコレーション実装容易性・Tauri IPC 統合パターンにおいて、どちらのフレームワークも十分な品質を示さず、選定が遅延する。

**影響:** M0 完了遅延 → M2、M3 の開始遅延。全フロントエンドコンポーネント（`EditorPage`、`CopyButton`、`GridPage`、`CardGrid`、`NoteCard`、`FilterBar`、`SearchBar`、`SettingsPage`）の実装方式が未定のまま開発が進行するリスク。

**緩和策:** M0 の技術検証プロトタイプで、CodeMirror 6 の `ViewPlugin`（frontmatter デコレーション）と `EditorView.updateListener`（自動保存）の統合を必須検証項目とする。タイムボックスを2週間に厳守し、期限内にプロトタイプ結果で判定する。判定基準を事前に定量化する（ビルドサイズ閾値、デコレーション描画遅延閾値、コード行数比較）。

### R3: Tauri バージョン互換性リスク（OQ-006）

**リスク:** Tauri v2 安定版リリースにより、`allowlist` → permissions 体系への移行、IPC モデル変更、CSP 設定方式の変更が発生し、`tauri.conf.json` 構成・IPC コマンド登録パターン・セキュリティモデルの全面的な書き換えが必要になる。

**影響:** M1 の `module:shell` 実装が Tauri v2 非互換となり、大規模リファクタリングが発生する。IPC エンフォースメントの3層（allowlist、CSP、パスバリデーション）のうち allowlist 層の再実装が必要になる可能性。

**緩和策:** M0 開始時点で Tauri v2 のリリース状況を評価し、v1 または v2 を確定する。v1 を選択した場合のマイグレーションパスを ADR として記録する。IPC コマンド登録（`#[tauri::command]` マクロ）と CSP 設定は Tauri v1/v2 間で互換性が高いため、パスバリデーション（第3層）に依存する堅牢な設計を維持する。

### R4: 全文検索パフォーマンスリスク（OQ-005 / GS-OQ-005）

**リスク:** ノート件数が増加した場合、`str::contains` によるファイル全走査の `search_notes` 応答時間がユーザー許容範囲を超える。`list_notes` もファイル名走査 + frontmatter パースの全量処理であり、大量ファイルで劣化する。

**影響:** M4 のパフォーマンスベンチマークで許容範囲超過が判明した場合、Tantivy 導入による `module:storage` 内部構成変更、フロントエンド側の仮想スクロール（`react-window` / `svelte-virtual-list`）導入が追加タスクとなる。

**緩和策:** 当面の想定規模は5,000件以下であり、`str::contains` 方式で実用的応答速度を確保できる見込み。M4 で5,000件規模のベンチマークを必須実施する。許容範囲超過時は Tantivy 導入 ADR を起票し、M5 の配布パッケージングとは独立した追加マイルストーンとして対応する。`module:storage` の IPC インターフェース（`list_notes`、`search_notes` の引数・戻り値）は変更不要であり、バックエンド内部実装の置換で対応可能な設計とする。

### R5: 自動保存データ消失リスク

**リスク:** 手動保存（`Cmd+S`/`Ctrl+S`、ボタン）を実装しない設計のため、デバウンス間隔（500ms–2000ms）中のアプリクラッシュ・強制終了でデバウンス未完了分の入力が消失する。

**影響:** ユーザーの入力データが最大デバウンス間隔分（最大2秒分）消失する可能性。

**緩和策:** `Cmd+N`/`Ctrl+N` 新規ノート作成時はデバウンスバイパスで即時保存（`await` で完了待ち）する設計を採用済み。デバウンス間隔の暫定値を 1000ms とし、M4 のユーザーテストでデータ消失リスクと保存頻度のバランスを検証して最終値を確定する。デバウンス完了前のアプリ終了（`beforeunload` イベント相当）時に即時保存をトリガーする追加ガードの導入を検討する。

### R6: ファイル名衝突リスク（Storage OQ-001）

**リスク:** `Cmd+N`/`Ctrl+N` の連打やプログラム的な高速呼び出しにより、同一秒内に `create_note` が複数回実行され、`YYYY-MM-DDTHHMMSS.md` のファイル名が衝突する。

**影響:** 2回目以降の `create_note` がエラーとなり、新規ノート作成に失敗する。

**緩和策:** `path.exists()` チェックで衝突を検出し、`StorageError::FilenameCollision` エラーを返却する設計を採用済み。フロントエンド側で `create_note` エラー時にユーザーへインラインエラーメッセージを表示し、再試行（1秒後に自動リトライ）する。現実的にはプロンプトノートの作成頻度は低く、秒精度での衝突は極めてまれである。M4 の連打テストで発生頻度を検証し、頻度が無視できない場合はミリ秒精度への拡張を検討する。

### R7: 外部ツール互換性リスク（Storage OQ-003）

**リスク:** Obsidian vault 内サブディレクトリとして保存ディレクトリを指定した場合、Obsidian が追加する frontmatter フィールド（`aliases`、`cssclass` 等）が `save_note` による上書きで消失する。

**影響:** Obsidian との共存が事実上不可能となり、ユーザーのワークフロー互換性が損なわれる。

**緩和策:** M1 の `module:storage` 実装時に frontmatter の保持ポリシーを確定する。互換性重視の場合は raw YAML 文字列を部分更新する方式を採用し、`tags` フィールドのみを変更して他フィールドを保持する。シンプル実装の場合は `tags` のみ再生成する方式とし、Obsidian 互換性の制限事項をリリースノートに明記する。技術検証で両方式の実装コストを比較し、M1 完了時に確定する。

### R8: 配布チャネル登録リスク

**リスク:** Flatpak（Flathub）への登録審査、Homebrew Cask tap への登録プロセスに想定以上の時間がかかる。Nix パッケージのビルド定義（`flake.nix`）が Tauri アプリケーションのビルド要件と適合しない。

**影響:** M5 の期間超過。一部配布チャネルでのリリース遅延。

**緩和策:** M5 とは独立して、Flathub マニフェスト・Homebrew Cask フォーミュラ・`flake.nix` のドラフト作成を M4 期間中に開始する。GitHub Releases（`.AppImage`/`.deb`、`.dmg`）を最低限の配布チャネルとし、Flathub・Homebrew Cask・Nix は順次対応とする。各配布チャネルの審査プロセスのリードタイムを M0 で事前調査する。
