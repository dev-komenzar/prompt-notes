---
codd:
  node_id: design:system-design
  type: design
  depends_on:
  - id: test:acceptance_criteria
    relation: constrained_by
    semantic: governance
  - id: governance:adr_tech_stack
    relation: constrained_by
    semantic: governance
  depended_by:
  - id: detail:component_architecture
    relation: depends_on
    semantic: technical
  conventions:
  - targets:
    - framework:tauri
    - module:shell
    reason: Tauri（Rust + WebView）アーキテクチャ必須。フロントエンド↔Rustバックエンド間はTauri IPC経由。
  - targets:
    - module:storage
    reason: データはローカル .md ファイルのみ。クラウド同期・DB利用は禁止。AI呼び出し機能の実装も禁止。
  - targets:
    - platform:linux
    - platform:macos
    reason: Linux・macOS対応必須。Windowsは将来対応としスコープ外。
  modules:
  - editor
  - grid
  - storage
  - settings
  - shell
---

# System Design

## 1. Overview

PromptNotes は AI へ渡すプロンプトを素早く書き溜めるローカルデスクトップノートアプリである。タイトル不要・本文即記・グリッド振り返りを設計思想とし、ターミナルや IDE へプロンプトをペーストする用途に特化する。

### 技術スタック

| レイヤー | 技術 | 備考 |
|---|---|---|
| アプリケーションフレームワーク | Tauri v2（Rust + OS WebView） | RBC-1: Electron 等への変更はリリース不可 |
| フロントエンド | Svelte（SPA） | コンパイル時最適化、仮想 DOM 不使用 |
| エディタエンジン | CodeMirror 6 | RBC-2: Monaco 等への変更はリリース不可 |
| データ永続化 | ローカル `.md` ファイル | RBC-3: DB・クラウド保存は禁止 |
| 検索方式 | Rust によるファイル全走査 | インデックス不要（想定数十件/週） |

### ターゲットプラットフォーム

Linux および macOS を対象とする。Windows は将来対応としスコープ外である。フロントエンド↔Rust バックエンド間の通信はすべて Tauri IPC（`invoke`）経由で行う。

### スコープ外の明示的排除

以下の機能は実装禁止であり、混入した場合リリース不可となる。

- AI 呼び出し機能
- クラウド同期機能
- タイトル入力欄
- Markdown レンダリングプレビュー
- モバイル対応

### リリースブロッキング制約の準拠

本設計書は以下の制約をアーキテクチャ全体で遵守する。

| ID | 対象 | 制約 | 本設計書での反映箇所 |
|---|---|---|---|
| RBC-1 | `framework:tauri` | Tauri（Rust + WebView）アーキテクチャ必須 | プロセスモデル、IPC 設計、配布方式すべてが Tauri 前提 |
| RBC-2 | `module:editor` | CodeMirror 6 必須。タイトル入力欄禁止。Markdown プレビュー禁止 | エディタモジュール設計で CodeMirror 6 拡張のみ使用 |
| RBC-3 | `module:storage` | ファイル名規則 `YYYY-MM-DDTHHMMSS.md` および自動保存は確定済み | ストレージモジュール設計でファイル I/O のみ使用 |
| RB-1 | `module:editor` | Cmd+N / Ctrl+N 即時新規ノート作成および 1 クリックコピーボタン | エディタモジュールのキーバインド設計・コピー機能設計 |
| RB-4 | `module:grid` | デフォルト直近 7 日間フィルタ・タグ/日付フィルタ・全文検索 | グリッドモジュールのフィルタ・検索設計 |

---

## 2. Architecture

### 2.1 プロセスモデル

Tauri アプリケーションは 2 つのプロセスで構成される。

```
┌─────────────────────────────────────────────────┐
│  Tauri Core Process (Rust)                      │
│                                                 │
│  ┌───────────┐  ┌───────────┐  ┌─────────────┐ │
│  │ storage   │  │ search    │  │ config      │ │
│  │ module    │  │ module    │  │ module      │ │
│  └───────────┘  └───────────┘  └─────────────┘ │
│         ▲              ▲              ▲         │
│         │     Tauri IPC (invoke)      │         │
│         ▼              ▼              ▼         │
│  ┌─────────────────────────────────────────┐    │
│  │  WebView Process (OS WebView)           │    │
│  │                                         │    │
│  │  ┌───────────┐  ┌──────────────────┐    │    │
│  │  │ Svelte    │  │ CodeMirror 6     │    │    │
│  │  │ SPA       │  │ Editor Instance  │    │    │
│  │  └───────────┘  └──────────────────┘    │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

- **Tauri Core Process（Rust）**: ファイルシステム操作、検索、設定管理を担当する。WebView からの `invoke` 呼び出しに応答する。
- **WebView Process**: Svelte SPA が動作し、CodeMirror 6 によるエディタ UI とグリッドビュー UI を提供する。Rust バックエンドとの通信はすべて Tauri IPC 経由で行い、直接のファイルシステムアクセスは行わない。

### 2.2 モジュール構成

#### 2.2.1 Rust バックエンド（`src-tauri/src/`）

| モジュール | 責務 | 主要 Tauri コマンド |
|---|---|---|
| `storage` | ノートファイルの CRUD、ディレクトリ自動作成、ファイル名生成 | `create_note`, `save_note`, `read_note`, `delete_note`, `list_notes` |
| `search` | ファイル全走査による全文検索、タグフィルタ、日付フィルタ | `search_notes`, `filter_by_tags`, `filter_by_date_range` |
| `config` | 保存ディレクトリ設定の読み書き | `get_config`, `set_config` |

#### 2.2.2 Svelte フロントエンド（`src/`）

| モジュール | 責務 | 主要コンポーネント |
|---|---|---|
| `editor` | ノート編集、新規作成、コピー機能、frontmatter 編集 | `EditorView.svelte`, `NoteList.svelte`, `FrontmatterBar.svelte`, `CopyButton.svelte` |
| `grid` | Pinterest スタイルカード表示、フィルタ UI、検索 UI | `GridView.svelte`, `NoteCard.svelte`, `FilterBar.svelte`, `SearchInput.svelte` |
| `settings` | 保存ディレクトリ変更 UI | `SettingsView.svelte` |
| `stores` | Svelte ストアによるアプリケーション状態管理 | `notes.ts`, `filters.ts`, `config.ts` |

### 2.3 画面構成とルーティング

Svelte SPA 内で 3 つの画面を持つ。ルーティングは `svelte-spa-router` または同等の軽量ルーターで実装する。

| パス | 画面 | 説明 |
|---|---|---|
| `/` | エディタ画面 | デフォルト画面。新規ノート作成と過去ノートリスト表示・編集 |
| `/grid` | グリッドビュー | Pinterest スタイルカードによるノート一覧と検索・フィルタ |
| `/settings` | 設定画面 | 保存ディレクトリの変更 |

### 2.4 Tauri IPC コマンド設計

フロントエンドから Rust バックエンドへの呼び出しはすべて `@tauri-apps/api/core` の `invoke` 関数を使用する。以下に主要コマンドのインターフェースを定義する。

```typescript
// ノート操作
invoke<NoteMetadata>('create_note')
// → 新規ファイル YYYY-MM-DDTHHMMSS.md を作成し、メタデータを返す

invoke<void>('save_note', { id: string, frontmatter: { tags: string[] }, body: string })
// → 指定ノートの内容をファイルに上書き保存

invoke<Note>('read_note', { id: string })
// → 指定ノートの frontmatter + body を返す

invoke<void>('delete_note', { id: string })
// → 指定ノートファイルを削除

invoke<NoteMetadata[]>('list_notes', { filter?: NoteFilter })
// → フィルタ条件に合致するノートのメタデータ一覧を返す

// 検索・フィルタ
invoke<NoteMetadata[]>('search_notes', { query: string, filter?: NoteFilter })
// → 全文検索 + フィルタ条件に合致するノートを返す

// 設定
invoke<AppConfig>('get_config')
invoke<void>('set_config', { config: AppConfig })
```

**型定義:**

```typescript
interface NoteMetadata {
  id: string           // ファイル名（拡張子なし）例: "2026-04-04T143205"
  tags: string[]
  created_at: string   // ファイル名から導出した ISO 8601 日時
  body_preview: string // 本文先頭 200 文字
}

interface Note {
  metadata: NoteMetadata
  body: string         // 本文全体
}

interface NoteFilter {
  tags?: string[]           // AND 条件
  date_from?: string        // ISO 8601 日付
  date_to?: string          // ISO 8601 日付
}

interface AppConfig {
  notes_dir: string    // 保存ディレクトリの絶対パス
}
```

### 2.5 ストレージ設計

#### 2.5.1 ファイル名規則（RBC-3 / RB-3 準拠）

ファイル名は `YYYY-MM-DDTHHMMSS.md` 形式に厳密に従う。タイムスタンプはノート作成時点のローカル時刻で確定し、以降変更しない。`id` はファイル名から拡張子を除いた文字列とする。

例: `2026-04-04T143205.md` → id = `"2026-04-04T143205"`

#### 2.5.2 ファイル構造

```markdown
---
tags: [gpt, coding]
---

本文テキスト
```

- frontmatter は YAML 形式で `tags` フィールドのみを含む。
- 作成日時はファイル名から取得し、frontmatter に重複保持しない。

#### 2.5.3 デフォルト保存ディレクトリ

| プラットフォーム | パス |
|---|---|
| Linux | `~/.local/share/promptnotes/notes/` |
| macOS | `~/Library/Application Support/promptnotes/notes/` |

アプリ初回起動時にディレクトリが存在しなければ `std::fs::create_dir_all` で自動作成する。設定画面から任意のディレクトリに変更可能であり、Obsidian vault 内のサブディレクトリを指定する運用をサポートする。

#### 2.5.4 設定ファイル

アプリケーション設定は Tauri の `app_config_dir` 配下に `config.json` として保存する。

| プラットフォーム | パス |
|---|---|
| Linux | `~/.config/promptnotes/config.json` |
| macOS | `~/Library/Application Support/promptnotes/config.json` |

```json
{
  "notes_dir": "/home/user/.local/share/promptnotes/notes"
}
```

設定ファイルが存在しない場合はデフォルト値で自動生成する。

#### 2.5.5 データアクセス制御（RBC-3 準拠）

- アプリケーションは `config.json` で指定された `notes_dir` のみを読み書きする。
- DB（SQLite / IndexedDB）へのデータ保存パスは一切存在しない。
- クラウドストレージへの通信コードは一切存在しない。
- AI API への通信コードは一切存在しない。

### 2.6 エディタモジュール設計

#### 2.6.1 CodeMirror 6 構成（RBC-2 準拠）

CodeMirror 6 を唯一のエディタエンジンとして使用する。以下の拡張を組み合わせてインスタンスを構成する。

| 拡張 | パッケージ | 目的 |
|---|---|---|
| Markdown シンタックスハイライト | `@codemirror/lang-markdown` | Markdown 構文の色分け表示 |
| 基本セットアップ | `codemirror` (basic-setup) | キーバインド、行番号等の基本機能 |
| テーマ | `@codemirror/theme-one-dark` 等 | エディタの外観 |
| 更新リスナー | `@codemirror/view` の `EditorView.updateListener` | 自動保存トリガー |

タイトル入力欄は実装しない（RB-2 準拠）。Markdown レンダリングプレビュー機能は実装しない（RB-2 準拠）。

#### 2.6.2 新規ノート作成（RB-1 準拠）

- macOS では Cmd+N、Linux では Ctrl+N でショートカットを発火する。
- ショートカットは Svelte コンポーネントレベルで `window.addEventListener('keydown', ...)` により捕捉し、`invoke('create_note')` を呼び出す。
- 新規ノート作成後、CodeMirror 6 インスタンスの `focus()` を呼び出してフォーカスを自動移動する。
- 新規ノート作成のレイテンシ目標は 100ms 以下とする。Rust 側でのファイル作成は非同期で行い、フロントエンドは即座に空ノートの編集状態に遷移する。

#### 2.6.3 1 クリックコピーボタン（RB-1 準拠）

- エディタ画面にコピーボタンを配置する。
- クリック時に `navigator.clipboard.writeText()` で本文全体（frontmatter を除く）をシステムクリップボードにコピーする。
- コピー成功時にボタンのアイコン/テキストを一時的に変化させ（例: チェックマーク表示、2 秒後に復帰）、ユーザーにフィードバックする。

#### 2.6.4 frontmatter 領域

- 画面上部に frontmatter 領域を配置し、背景色（例: `bg-gray-100` / `bg-slate-800`）で本文と視覚的に区別する。
- frontmatter 領域ではタグの入力・編集が可能である。タグは YAML 配列形式 `tags: [tag1, tag2]` で保存する。
- frontmatter のメタデータは `tags` のみ。作成日時はファイル名から取得する。

#### 2.6.5 自動保存（RB-3 準拠）

- CodeMirror 6 の `EditorView.updateListener` で `docChanged` を検知し、デバウンス（500ms）後に `invoke('save_note', ...)` を呼び出す。
- 明示的な「保存」ボタンや Cmd+S / Ctrl+S 操作は不要とする。
- frontmatter の変更も同じ自動保存パイプラインで処理する。

#### 2.6.6 ノートリスト表示

- エディタ画面において、過去のノートを時系列降順（新しい順）でリスト表示する。
- 各ノートは frontmatter のタグ領域と本文を含むカード形式で表示する。
- リスト内のノートを選択すると、そのノートが CodeMirror 6 エディタインスタンスでインライン編集可能になる。

### 2.7 グリッドモジュール設計（RB-4 準拠）

#### 2.7.1 Pinterest スタイルカード表示

- CSS Grid または CSS Columns による Pinterest スタイル（Masonry）レイアウトで可変高カードを表示する。
- 各カードにはノートの本文先頭部分（プレビュー）とタグを表示する。
- カードクリックでエディタ画面（`/`）に遷移し、該当ノートを表示する。

#### 2.7.2 デフォルト直近 7 日間フィルタ

- グリッドビューを開いた時点で、フィルタ条件を `date_from: 今日 - 7日, date_to: 今日` に自動設定する。
- フィルタ条件はファイル名のタイムスタンプから算出する。Rust バックエンドの `list_notes` コマンドが日付範囲フィルタを処理する。

#### 2.7.3 タグ・日付フィルタ

- FilterBar コンポーネントでタグ選択と日付範囲指定の UI を提供する。
- タグフィルタは AND 条件で動作する（選択した全タグを含むノートのみ表示）。
- 日付フィルタとタグフィルタは組み合わせ可能（AND 結合）。

#### 2.7.4 全文検索

- SearchInput コンポーネントでテキスト入力を受け付け、`invoke('search_notes', { query, filter })` を呼び出す。
- Rust バックエンドがファイル全走査で本文を検索し、結果を返す。
- 入力のデバウンス（300ms）後に検索を実行し、結果をグリッドビューにリアルタイム反映する。

### 2.8 設定モジュール設計

- 設定画面（`/settings`）で保存ディレクトリの変更 UI を提供する。
- ディレクトリ選択には Tauri の `@tauri-apps/plugin-dialog` の `open` API（ディレクトリ選択モード）を使用する。
- ディレクトリ変更後、`invoke('set_config', ...)` で `config.json` を更新し、以降のノート読み書きは新ディレクトリを対象とする。
- 既存ノートの移動は行わない。ディレクトリ変更後は新ディレクトリ内のノートのみを読み込む。

### 2.9 配布方式

| プラットフォーム | 方式 | ビルドツール |
|---|---|---|
| Linux | バイナリ直接ダウンロード（`.AppImage` / `.deb`） | `tauri build` |
| Linux | Flatpak（Flathub） | Flatpak manifest + `tauri build` |
| Linux | NixOS パッケージ | Nix derivation |
| macOS | バイナリ直接ダウンロード（`.dmg`） | `tauri build` |
| macOS | Homebrew Cask | Cask formula |

すべての配布形式は Tauri ビルド（`cargo-tauri`）を前提とする（RBC-1 準拠）。

### 2.10 非機能要件

| 項目 | 閾値 | 根拠 |
|---|---|---|
| 新規ノート作成レイテンシ | 100ms 以下 | AC-EDIT-03: 体感即時 |
| 自動保存デバウンス | 500ms | 入力中の過剰な I/O を抑制 |
| 全文検索デバウンス | 300ms | 入力中の過剰な検索実行を抑制 |
| 検索応答時間 | 数百 ms 以内（想定数十件/週のデータ量） | ADR-005: ファイル全走査で十分な性能 |
| バイナリサイズ | 数 MB〜10 MB 程度 | Tauri の軽量特性を活かす |
| メモリフットプリント | 100 MB 以下（アイドル時） | OS WebView 利用により低メモリ |

### 2.11 リリースブロッキング制約の遵守マッピング

| 制約 | アーキテクチャ上の遵守方法 |
|---|---|
| `framework:tauri` / `module:shell`（RBC-1） | プロセスモデルを Tauri Core Process + WebView Process の 2 プロセス構成とし、フロントエンド↔Rust バックエンド間の通信はすべて Tauri IPC（`invoke`）経由で行う。Electron 等のフレームワークコードは一切含まない。 |
| `module:storage`（RBC-3） | データ永続化はローカル `.md` ファイルのみ。Rust バックエンドの storage モジュールが `std::fs` を使用してファイル I/O を行う。SQLite / IndexedDB / クラウドストレージへの依存は一切存在しない。AI API への通信コードも一切存在しない。 |
| `platform:linux` / `platform:macos` | Tauri の OS WebView（Linux: WebKitGTK、macOS: WKWebView）を使用し、両プラットフォームで動作する。デフォルト保存ディレクトリは OS ごとに XDG / macOS 規約に従う。Windows 固有のコードパスは含まない。 |
| `module:editor`（RBC-2 / RB-1 / RB-2） | CodeMirror 6 を唯一のエディタエンジンとする。タイトル入力欄コンポーネントは作成しない。Markdown レンダリングプレビューコンポーネントは作成しない。Cmd+N / Ctrl+N ショートカットと 1 クリックコピーボタンをコア UX として実装する。 |
| `module:grid`（RB-4） | グリッドビューにデフォルト直近 7 日間フィルタ、タグ/日付フィルタ、全文検索の 3 機能を必須実装する。 |

---

## 3. Open Questions

| ID | 質問 | 影響範囲 | 決定期限の目安 |
|---|---|---|---|
| OQ-001 | Svelte のルーティングライブラリとして `svelte-spa-router` を採用するか、Svelte 5 の組み込みルーティング機構を使用するか | フロントエンド全体の画面遷移実装 | Sprint 1 開始前 |
| OQ-002 | グリッドビューの Masonry レイアウトを CSS Columns で実装するか、CSS Grid + JavaScript 計算で実装するか | `GridView.svelte` の実装方式 | Sprint 2 開始前 |
| OQ-003 | 自動保存のデバウンス間隔 500ms は最適か。ユーザーテストで調整が必要か | エディタの `updateListener` 設定 | ユーザーテスト実施時 |
| OQ-004 | ノート削除機能を v1 に含めるか。requirements に明示的な削除機能の記載がないため判断が必要 | storage モジュールの `delete_note` コマンドの実装優先度 | Sprint 1 開始前 |
| OQ-005 | Tauri の `@tauri-apps/plugin-dialog` でディレクトリ選択ダイアログが Linux（WebKitGTK）環境で安定動作するか検証が必要 | 設定画面のディレクトリ選択 UI | Sprint 3 開始前 |
