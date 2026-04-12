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

本実装計画は PromptNotes アプリケーションの全モジュール（`module:editor`、`module:grid`、`module:storage`、`module:settings`）を設計書群に基づき段階的に実装するためのスプリント構成、マイルストーン、リスク管理を定義する。

PromptNotes は Tauri v2（Rust Core Process + OS WebView Process）上に構築されるローカルデスクトップノートアプリであり、「タイトル不要・本文即記・グリッド振り返り」を設計思想とする。データ永続化はローカル `.md` ファイルのみで行い、データベース・クラウドストレージの使用は禁止される。

### 対象プラットフォーム

Linux（WebKitGTK、バイナリ・Flatpak・NixOS 配布）および macOS（WKWebView、バイナリ・Homebrew Cask 配布）を対象とする。Windows は対象外であり、Windows 固有のコード・ビルド設定・テストは一切含めない。本計画のすべてのスプリントにおいて、Linux と macOS の両環境での動作検証を必須とする。

### スコープ内モジュール

| モジュール | 概要 | リリースブロッキング |
|---|---|---|
| `module:editor` | CodeMirror 6 ベースの Markdown エディタ、1クリックコピー、Cmd+N 新規作成 | Yes — 全機能未実装ならリリース不可 |
| `module:grid` | Pinterest スタイル可変高カードレイアウト、全文検索、タグ・日付フィルタ | Yes — 全機能未実装ならリリース不可 |
| `module:storage` | Rust バックエンドによるノート CRUD、`YYYY-MM-DDTHHMMSS.md` ファイル名、frontmatter（tags のみ）、自動保存 | Yes — 全機能未実装ならリリース不可 |
| `module:settings` | 保存ディレクトリ変更 UI、config.json の Rust バックエンド経由永続化 | Yes — 全機能未実装ならリリース不可 |

### スコープ外（実装禁止）

AI 呼び出し、クラウド同期、Markdown プレビュー（HTML レンダリング）、モバイル対応はスコープ外であり、いかなるスプリントにおいても実装してはならない。

### IPC 境界の原則

フロントエンドからの直接ファイルシステムアクセスは全面禁止とする。すべてのファイル操作は Rust バックエンドの Tauri コマンド経由で実行する。Tauri v2 のケイパビリティシステムにより `fs` プラグインを無効化し、この制約を構造的に強制する。設定変更（保存ディレクトリ）も Rust バックエンド経由でのみ永続化し、`localStorage`・`IndexedDB` への設定保存は禁止する。

### 検証方針

V-Model に基づき下位から積み上げる。Unit テスト（Rust モジュール単体・Svelte コンポーネント単体）→ Integration テスト（IPC 境界を跨いだ連携）→ E2E テスト（要件定義・受入基準に対する画面操作検証）の順で実施する。

### リリースブロッキング制約の遵守

本計画は以下のリリースブロッキング制約を各スプリントに組み込み、すべての制約が満たされるまでリリースゲートを通過させない。

1. **platform:linux, platform:macos**: 全スプリントのテスト・検証を Linux（WebKitGTK）および macOS（WKWebView）の両環境で実施する。Windows 向けビルド・テストは含めない。
2. **module:editor, module:grid, module:storage, module:settings**: 4モジュールすべての必須機能が実装・テスト完了するまでリリース不可。AI 呼び出し・クラウド同期・Markdown プレビュー・モバイル対応はスコープ外であり実装禁止。
3. **framework:tauri / module:shell**: Tauri IPC 境界を厳格化し、フロントエンドからの直接ファイルシステムアクセスを構造的に禁止する。`fs` プラグイン無効化を `tauri.conf.json` で設定し、CI の ESLint カスタムルールで `@tauri-apps/plugin-fs` インポートを検出・ブロックする。
4. **module:storage / module:settings**: 設定変更は Rust バックエンド経由で永続化する。フロントエンド単独でのファイルパス操作は禁止する。

---

## 2. Milestones

### Sprint 1: プロジェクト基盤 + Storage コア（2週間）

**目標:** Tauri v2 プロジェクトの初期化、Rust バックエンドの `storage` モジュールと `config` モジュールの実装、IPC 境界の構造的強制。

| タスク | 成果物 | 担当モジュール | 完了基準 |
|---|---|---|---|
| Tauri v2 プロジェクト初期化 | `src-tauri/`、`tauri.conf.json`、`Cargo.toml` | `module:shell` | `cargo tauri dev` で空ウィンドウが Linux・macOS で起動 |
| `tauri.conf.json` セキュリティ設定 | CSP 設定、`fs` プラグイン無効化、`dialog:open` のみ許可 | `module:shell` | `fs` プラグインが WebView から利用不可であることを確認 |
| `models.rs` 共有データ構造体定義 | `Frontmatter`、`Note`、`NoteMetadata`、`NoteFilter`、`AppConfig` 構造体 | `module:storage` | `serde::Serialize` / `serde::Deserialize` の derive 確認 |
| `error.rs` 統一エラー型定義 | `StorageError`、`ConfigError` enum（`thiserror` + `Serialize`） | `module:storage` | Tauri IPC エラー応答として JSON シリアライズ可能 |
| `config.rs` 実装 | `get_config`、`set_config` Tauri コマンド、`config.json` 読み書き | `module:settings` | Linux: `~/.config/promptnotes/config.json`、macOS: `~/Library/Application Support/promptnotes/config.json` の読み書き成功 |
| `storage.rs` CRUD 実装 | `create_note`、`save_note`、`read_note`、`delete_note`、`list_notes` Tauri コマンド | `module:storage` | 全 CRUD 操作の Unit テスト通過（`chrono`、`serde_yaml`、`dirs` クレート使用） |
| `generate_filename()` 実装 | `YYYY-MM-DDTHHMMSS.md` 形式のファイル名生成、衝突チェック | `module:storage` | 同一秒衝突時のインクリメント動作テスト通過 |
| `parse_frontmatter()` / `serialize_frontmatter()` 実装 | frontmatter YAML パース・シリアライズ（`tags` フィールドのみ） | `module:storage` | frontmatter なしファイルの `tags: []` 扱い、未知フィールド破棄テスト通過 |
| `atomic_write()` 実装 | `{id}.md.tmp` → `rename` によるアトミック書き込み | `module:storage` | Linux（ext4/btrfs）・macOS（APFS）での動作確認 |
| `resolve_notes_dir()` / `ensure_dir()` 実装 | `config.rs` 連携によるディレクトリパス解決、再帰的ディレクトリ作成 | `module:storage` | Linux デフォルト `~/.local/share/promptnotes/notes/`、macOS デフォルト `~/Library/Application Support/promptnotes/notes/` の自動作成確認 |
| `main.rs` コマンド登録 | `tauri::Builder` に全コマンドを `invoke_handler` で登録 | `module:shell` | 全コマンドが `invoke` 経由で呼び出し可能 |
| Rust Unit テスト | `storage.rs`、`config.rs`、`models.rs` の Unit テスト | `module:storage` | `cargo test` 全テスト通過 |

**Sprint 1 完了ゲート:**
- `cargo tauri dev` で Linux・macOS の両環境で起動可能
- 全 Tauri コマンドが `invoke` 経由で正常応答
- `fs` プラグイン無効化の検証完了
- `cargo test` で storage / config の全 Unit テスト通過

### Sprint 2: フロントエンド基盤 + Editor コア（2週間）

**目標:** Svelte SPA の初期化、型定義・IPC ラッパー層の構築、CodeMirror 6 エディタの基本実装、自動保存パイプラインの完成。

| タスク | 成果物 | 担当モジュール | 完了基準 |
|---|---|---|---|
| Svelte SPA 初期化 | `src/App.svelte`、ルーティング設定（`/`、`/grid`、`/settings`） | フロントエンド基盤 | 3 ルート間の遷移が動作 |
| `src/lib/types.ts` 型定義 | `NoteMetadata`、`Note`、`NoteFilter`、`AppConfig` TypeScript 型 | フロントエンド基盤 | Rust 構造体とフィールド名（snake_case）が一致 |
| `src/lib/ipc.ts` IPC ラッパー | `createNote`、`saveNote`、`readNote`、`deleteNote`、`listNotes`、`searchNotes`、`getConfig`、`setConfig` 型付きラッパー関数 | フロントエンド基盤 | 全関数が Tauri バックエンドと正常通信 |
| ESLint カスタムルール設定 | `@tauri-apps/plugin-fs` インポート検出・ブロック、`@tauri-apps/api/core` の直接インポート警告（`ipc.ts` 以外） | `module:shell` | CI lint で違反コードがエラー |
| `src/stores/notes.ts` 実装 | `notesStore` Svelte writable ストア | `module:editor` | `NoteMetadata[]` のリアクティブ管理 |
| `src/stores/config.ts` 実装 | `configStore` Svelte writable ストア | `module:settings` | `getConfig` 応答の反映 |
| `EditorView.svelte` 実装 | CodeMirror 6 初期化（`@codemirror/lang-markdown`、`syntaxHighlighting`、`history`、`lineWrapping`、`updateListener`）、frontmatter 背景色プラグイン（`ViewPlugin` + `Decoration`） | `module:editor` | Markdown シンタックスハイライト表示、frontmatter 領域の背景色区別（ライトテーマ `#f0f4f8`）が視覚確認可能 |
| 自動保存パイプライン実装 | `EditorView.svelte` 内の 500ms デバウンス `setTimeout`、`updateListener` → `debouncedSave()` → `saveNote()` | `module:editor` | テキスト入力後 500ms で `save_note` IPC 発行確認 |
| `FrontmatterBar.svelte` 実装 | タグ表示・追加・削除 UI、タグ変更が自動保存パイプラインに合流 | `module:editor` | タグ追加→ 500ms 後に frontmatter 含めて保存 |
| `NoteList.svelte` 実装 | 左サイドバー（240px 固定幅）、ノート一覧表示（`created_at` 降順）、選択状態管理、削除操作 | `module:editor` | `listNotes` 応答の一覧表示、ノート選択で `readNote` 呼び出し |
| ノート選択・読込フロー | `NoteList` 選択 → `readNote` → CodeMirror 6 にドキュメント設定 | `module:editor` | ノート間の切り替えが正常動作 |
| タイトル入力欄の不在確認 | `EditorView.svelte` にタイトル `<input>` / `<textarea>` が存在しないことの確認 | `module:editor` | コードレビューで確認 |

**Sprint 2 完了ゲート:**
- CodeMirror 6 エディタが Markdown シンタックスハイライト付きで表示
- frontmatter 背景色が視覚的に区別可能
- 自動保存（500ms デバウンス）がファイルシステムに反映
- タイトル入力欄が存在しない
- NoteList でのノート選択・切り替えが動作
- Linux（WebKitGTK）・macOS（WKWebView）両環境で動作確認

### Sprint 3: Editor 完成 + CopyButton + キーバインド（1週間）

**目標:** 1クリックコピーボタン、Cmd+N / Ctrl+N グローバルキーバインド、エディタの IPC エラーハンドリングを完成させ、`module:editor` の全リリースブロッキング機能を達成。

| タスク | 成果物 | 担当モジュール | 完了基準 |
|---|---|---|---|
| `CopyButton.svelte` 実装 | `navigator.clipboard.writeText()` による本文全体コピー（frontmatter 除外）、成功時チェックマークアイコン 1.5 秒表示、失敗時赤色フラッシュ 500ms | `module:editor` | ボタン押下で OS クリップボードに本文がコピーされる |
| `extractBody()` 実装 | `EditorView.svelte` 内の frontmatter 分離関数、`getEditorContent()` コールバック | `module:editor` | frontmatter を含むドキュメントから本文のみが抽出される |
| Cmd+N / Ctrl+N グローバルキーバインド | `window.addEventListener('keydown')` による登録、`createNote()` → `EditorView.focus()` | `module:editor` | ショートカット押下から 100ms 以内に空エディタにフォーカス移動 |
| CopyButton 浮遊配置 | エディタ領域右下に `position: fixed` で配置 | `module:editor` | 常時表示で本文と重ならない位置に配置 |
| IPC エラーハンドリング | `createNote` 失敗時赤帯 3 秒、`saveNote` 自動リトライ 3 秒×3 回、`readNote` 失敗時選択リセット、`deleteNote` 失敗時赤帯 3 秒、`listNotes` 失敗時「読み込み失敗」テキスト | `module:editor` | 各エラーケースの動作テスト通過 |
| エディタ非機能要件検証 | 新規ノート作成 100ms 以下、コピー操作 50ms 以下、CodeMirror 6 初期化 200ms 以下 | `module:editor` | Linux・macOS 両環境でのパフォーマンス計測 |

**Sprint 3 完了ゲート:**
- 1クリックコピーボタンが動作し視覚フィードバックを提供
- Cmd+N（macOS）/ Ctrl+N（Linux）で新規ノート即座作成＋フォーカス移動
- `module:editor` の全リリースブロッキング制約を充足
- 新規ノート作成レイテンシ 100ms 以下を Linux・macOS で確認

### Sprint 4: Grid View + Search（2週間）

**目標:** Pinterest スタイルグリッドビュー、全文検索、タグ・日付フィルタ、カードクリックからエディタ遷移の全機能を実装し、`module:grid` の全リリースブロッキング機能を達成。

| タスク | 成果物 | 担当モジュール | 完了基準 |
|---|---|---|---|
| `search.rs` 実装 | `search_notes` Tauri コマンド、ファイル全走査、ケースインセンシティブ部分一致、タグ・日付フィルタ適用 | `module:grid` / `module:storage` | Unit テスト通過（100 件走査 < 50ms） |
| `list_note_files()` 共通関数 | `storage.rs` にディレクトリ内 `.md` ファイル列挙関数を定義、`search.rs` から利用 | `module:storage` | ファイル列挙ロジックの重複排除 |
| `src/stores/filters.ts` 実装 | `filtersStore`（`tags`、`date_from`、`date_to`、`query`）、`getDefaultFilters()`（直近 7 日間）、`resetFilters()` | `module:grid` | 初期値が直近 7 日間に設定される |
| `GridView.svelte` 実装 | CSS `columns`（3 列、最小幅 280px）による Masonry レイアウト、`filtersStore` 購読によるデータ取得オーケストレーション、ローディング・空状態表示 | `module:grid` | Pinterest スタイルの可変高カードレイアウトが表示 |
| `NoteCard.svelte` 実装 | プレビューテキスト（100 文字）、タグチップ、作成日時表示、`click` → ルーター遷移、`role="button"` + `tabindex="0"` | `module:grid` | カードクリックでエディタ画面に遷移しノートが読み込まれる |
| `FilterBar.svelte` 実装 | タグチップフィルタ（トグル選択）、日付範囲フィルタ（`<input type="date">`）、クリアボタン | `module:grid` | フィルタ条件変更でグリッド再描画、クリアで直近 7 日間に復帰 |
| `SearchInput.svelte` 実装 | 全文検索テキスト入力、300ms デバウンス `setTimeout` | `module:grid` | 入力停止 300ms 後に `search_notes` IPC 発行 |
| `query` 空/非空による API 分岐 | `GridView` で `query` が空なら `listNotes`、非空なら `searchNotes` を呼び出し | `module:grid` | 検索クエリの有無で適切な API が使い分けられる |
| カードクリック → エディタ遷移 | `NoteCard` の `click` で `push('/?note={id}')` → `EditorView` が `readNote(id)` で読み込み | `module:grid` + `module:editor` | グリッドからエディタへの遷移が正常動作 |
| グリッド非機能要件検証 | 初回マウント 100ms 以下（数十件）、全文検索 200ms 以下（100 件）、カードクリック → エディタ表示 150ms 以下 | `module:grid` | Linux・macOS 両環境でのパフォーマンス計測 |

**Sprint 4 完了ゲート:**
- Pinterest スタイル可変高カードレイアウトが表示
- デフォルトフィルタが直近 7 日間
- タグフィルタ・日付フィルタ・全文検索（ファイル全走査）がすべて動作
- カードクリックでエディタ画面に遷移しノートが編集可能
- `module:grid` の全リリースブロッキング制約を充足

### Sprint 5: Settings + Integration テスト（1週間）

**目標:** 設定画面の実装、IPC 境界を跨いだ Integration テスト、全モジュール連携の検証。

| タスク | 成果物 | 担当モジュール | 完了基準 |
|---|---|---|---|
| `SettingsView.svelte` 実装 | 保存ディレクトリ変更 UI、`@tauri-apps/plugin-dialog` のネイティブ OS ダイアログによるディレクトリ選択、`invoke('set_config')` 経由での設定保存 | `module:settings` | ディレクトリ選択→ `config.json` 更新→新ディレクトリのノートのみ表示 |
| `localStorage` / `IndexedDB` 不使用の検証 | フロントエンドコードに `localStorage`、`sessionStorage`、`IndexedDB` への書き込みが存在しないことの確認 | `module:settings` | コードレビュー + ESLint ルールで検出 |
| `dialog` プラグインと `fs` 無効化の共存検証 | `@tauri-apps/plugin-dialog` のディレクトリ選択が `fs` プラグイン無効化環境で正常動作することの確認 | `module:settings` + `module:shell` | Linux（WebKitGTK）・macOS で動作確認 |
| Integration テスト: Editor ↔ Storage | ノート作成→編集→自動保存→再読み込みの E2E フロー | `module:editor` + `module:storage` | ファイルシステム上のノートファイルが正しい frontmatter + 本文で保存 |
| Integration テスト: Grid ↔ Search ↔ Storage | ノート作成→グリッド表示→検索→フィルタ→カードクリック→エディタ遷移 | `module:grid` + `module:storage` | 全検索・フィルタ操作が正常動作 |
| Integration テスト: Settings ↔ Config ↔ Storage | ディレクトリ変更→新ディレクトリでのノート CRUD | `module:settings` + `module:storage` | ディレクトリ変更後に新ディレクトリのノートのみ表示 |

**Sprint 5 完了ゲート:**
- `module:settings` の全機能が動作
- 全 Integration テスト通過
- `localStorage` / `IndexedDB` 不使用が確認済み
- 全モジュール連携が Linux・macOS 両環境で正常動作

### Sprint 6: E2E テスト + パッケージング + リリース準備（2週間）

**目標:** 受入基準に対する E2E テスト、Linux（バイナリ・Flatpak・NixOS）および macOS（バイナリ・Homebrew Cask）のパッケージング、リリースゲート通過。

| タスク | 成果物 | 担当モジュール | 完了基準 |
|---|---|---|---|
| E2E テスト: ノートライフサイクル | 新規作成（Cmd+N）→ 本文入力 → 自動保存 → コピー → 削除 | 全モジュール | 要件定義の受入基準を満たす |
| E2E テスト: グリッド検索フロー | グリッド表示 → 全文検索 → タグフィルタ → 日付フィルタ → カードクリック → エディタ遷移 | 全モジュール | 検索・フィルタの全パターンが正常動作 |
| E2E テスト: 設定変更フロー | ディレクトリ変更 → 新ディレクトリでの CRUD | 全モジュール | 設定変更後の動作が正常 |
| Linux バイナリビルド | `cargo tauri build` → `.deb`、`.AppImage` | パッケージング | Linux x86_64 でインストール・起動・基本操作が動作 |
| Linux Flatpak パッケージ | Flatpak マニフェスト作成・ビルド | パッケージング | `flatpak install` → 起動・基本操作が動作 |
| Linux NixOS パッケージ | Nix derivation 作成 | パッケージング | `nix-build` → 起動・基本操作が動作 |
| macOS バイナリビルド | `cargo tauri build` → `.dmg` | パッケージング | macOS でインストール・起動・基本操作が動作 |
| macOS Homebrew Cask 定義 | Cask formula 作成 | パッケージング | `brew install --cask` → 起動・基本操作が動作 |
| 全リリースブロッキング制約の最終確認 | チェックリストによる全制約の充足確認 | 全モジュール | 全制約が文書化された検証結果とともに承認 |
| 非機能要件の最終計測 | 新規ノート作成 100ms 以下、自動保存デバウンス 500ms、検索応答数百 ms 以内、メモリ 100MB 以下（アイドル時）、バイナリサイズ数 MB〜10MB | 全モジュール | 全閾値を Linux・macOS 両環境で達成 |

**Sprint 6 完了ゲート（リリースゲート）:**
- 全 E2E テスト通過
- Linux（バイナリ・Flatpak・NixOS）・macOS（バイナリ・Homebrew Cask）の全配布形式でインストール・起動・基本操作が動作
- 全リリースブロッキング制約の充足が検証済み
- 非機能要件の全閾値を両プラットフォームで達成
- `module:editor`、`module:grid`、`module:storage`、`module:settings` の全必須機能が実装・テスト完了

### マイルストーンサマリー

| マイルストーン | スプリント | 累計期間 | 達成内容 |
|---|---|---|---|
| M1: Backend Core | Sprint 1 | 2 週 | Rust バックエンド（storage / config / error）完成、IPC 境界構造的強制 |
| M2: Editor MVP | Sprint 2-3 | 5 週 | CodeMirror 6 エディタ全機能（ハイライト・自動保存・コピー・Cmd+N）完成 |
| M3: Grid & Search | Sprint 4 | 7 週 | グリッドビュー全機能（Masonry・検索・フィルタ・遷移）完成 |
| M4: Full Integration | Sprint 5 | 8 週 | 設定画面完成、全モジュール Integration テスト通過 |
| M5: Release | Sprint 6 | 10 週 | E2E テスト通過、全配布パッケージ完成、リリースゲート通過 |

---

## 3. Risks

### R1: WebKitGTK と WKWebView のレンダリング差異（影響度: 高、発生確率: 中）

**内容:** Linux の WebKitGTK と macOS の WKWebView は同じ WebKit 系エンジンだがバージョン・機能サポートが異なる。CSS `columns` による Masonry レイアウト、CodeMirror 6 の描画、`navigator.clipboard.writeText()` の動作に差異が生じる可能性がある。

**軽減策:** Sprint 2 の時点で Linux・macOS 両環境での動作確認を必須とし、差異を早期に検出する。CSS `columns` は両環境でサポート済みだが、Sprint 4 のグリッド実装時に 100 件以上のカード描画パフォーマンスを WebKitGTK で計測する。クリップボード API の動作は Sprint 3 で両環境テストする。

**対応計画:** レイアウト差異が発見された場合、CSS フォールバック（`columns` → CSS Grid + JavaScript 高さ計算）への切り替えを Sprint 4 内で実施する。

### R2: Tauri v2 の `fs` プラグイン無効化と `dialog` プラグインの共存問題（影響度: 高、発生確率: 低）

**内容:** `@tauri-apps/plugin-dialog` のディレクトリ選択機能が `fs` プラグイン無効化環境で正常動作しない可能性がある（OQ-CA-003）。`dialog` プラグインは OS ネイティブダイアログを使用するため理論上は `fs` プラグインに依存しないが、内部実装の依存関係が不明。

**軽減策:** Sprint 1 で `tauri.conf.json` のケイパビリティ設定を確定した直後に、Linux・macOS 両環境で `dialog:open`（ディレクトリモード）の動作を検証する。

**対応計画:** 共存不可の場合、`dialog` プラグインに代えて Rust バックエンド側で `rfd`（Rust File Dialog）クレートを使用し、Tauri コマンド経由でディレクトリ選択を実装する。

### R3: 同一秒ファイル名衝突（影響度: 低、発生確率: 低）

**内容:** `YYYY-MM-DDTHHMMSS.md` 形式のファイル名は秒精度であり、同一秒内に複数の `create_note` が呼び出された場合に衝突する（OQ-SF-001）。

**軽減策:** Sprint 1 の `generate_filename()` 実装時に、ファイル存在チェック + 秒数インクリメントの防御ロジックを組み込む。通常のユーザー操作（Cmd+N 手動押下）では秒単位の衝突は実質発生しない。

**対応計画:** 自動テストで高速連続呼び出し（1 秒内に 5 回）のケースを検証し、衝突回避が動作することを確認する。

### R4: `list_notes` のスケーラビリティ（影響度: 中、発生確率: 低）

**内容:** ノート件数が 1000 件を超えた場合、ファイル全走査 + frontmatter パースの `list_notes` レイテンシが 500ms を超える可能性がある。全文検索（`search_notes`）はさらに遅延する。

**軽減策:** 想定データ量（数十件/週）では数年間の運用でも数千件に達しない見込み。Sprint 4 で 1000 件のテストデータによるベンチマークを実施し、500ms 以内に収まることを確認する。

**対応計画:** 500ms を超過した場合、`notesStore` にメタデータキャッシュを導入し、起動時に一括ロード→以後は差分更新とする。検索については日付フィルタによるファイル名ベースの事前絞り込み（ファイル読み込み前スキップ）で最適化する。

### R5: ルーティングライブラリの選定遅延（影響度: 中、発生確率: 中）

**内容:** フロントエンドのルーティングに `svelte-spa-router` を使用するか Svelte 5 組み込み機構を使用するかが未確定（OQ-CA-005）。選定が遅れると Sprint 2 のルーティング実装とSprint 4 のカードクリック遷移に影響する。

**軽減策:** Sprint 2 開始時点で `svelte-spa-router` をデフォルト採用として実装を進め、Svelte 5 の安定版ルーティング API が利用可能になった時点で移行を検討する。ルーティング呼び出しを `src/lib/router.ts` に局所化し、ライブラリ切り替えの影響範囲を最小化する。

**対応計画:** `svelte-spa-router` で Sprint 2-4 を進行。Svelte 5 組み込みルーティングが安定した場合、Sprint 6 の余裕時間で移行するか、次リリースに持ち越す。

### R6: アトミック書き込みのクロスプラットフォーム保証（影響度: 中、発生確率: 低）

**内容:** `std::fs::write` + `std::fs::rename` によるアトミック書き込みが Linux（ext4/btrfs）および macOS（APFS）で期待通りにアトミックに動作するか（OQ-SF-003）。`rename` は POSIX 準拠環境で同一ファイルシステム内であればアトミックだが、一時ファイルが別ファイルシステムに配置される可能性がある。

**軽減策:** 一時ファイル（`{id}.md.tmp`）をノートファイルと同一ディレクトリに作成し、同一ファイルシステム内の `rename` を保証する。Sprint 1 の `atomic_write()` テストで両環境での動作を検証する。

**対応計画:** `rename` がクロスファイルシステムでエラーとなった場合、`tempfile` クレートの `NamedTempFile::persist` を使用してフォールバックする。

### R7: `notesStore` のメモリ保持戦略の未確定（影響度: 低、発生確率: 中）

**内容:** `notesStore` がノート一覧の `NoteMetadata` キャッシュをどこまで保持するか未確定（OQ-CA-002）。全件メモリ保持とすると数千件時にメモリ使用量が増加し、画面遷移ごとの再取得とするとレイテンシが増加する。

**軽減策:** Sprint 2 では画面遷移ごとの `list_notes` 再発行をデフォルト実装とする。`NoteMetadata` は軽量（id + tags + created_at + preview 100 文字）であり、数千件でも数 MB 程度の見込み。

**対応計画:** Sprint 4 のベンチマークで 1000 件以上のメモリ使用量を計測し、100MB のアイドル時メモリ閾値に対して余裕があればキャッシュ導入を見送る。閾値に近づいた場合はページネーション（100 件ずつ取得）を導入する。
