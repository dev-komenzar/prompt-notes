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

PromptNotes は AI へ渡すプロンプトを素早く書き溜めるローカルファーストのノートアプリである。タイトル不要・本文即記・グリッド振り返りをコアUXとし、ターミナルや IDE へプロンプトをペーストする用途に特化する。

アプリケーションは Tauri（Rust + WebView）上で動作し、フロントエンドに Svelte、エディタエンジンに CodeMirror 6 を採用する。データはローカルファイルシステム上の `.md` ファイルのみに保存し、データベース（SQLite・IndexedDB 等）およびクラウド同期は一切使用しない。AI 呼び出し機能の実装も禁止する。

対象プラットフォームは Linux および macOS である。Windows は将来対応としスコープ外とする。

画面構成は以下の3画面である。

| 画面 | モジュール | 概要 |
|------|-----------|------|
| エディタ画面 | `module:editor` | CodeMirror 6 によるプレーンテキスト Markdown 編集。frontmatter（タグ）+ 本文。タイトル入力欄なし。Markdown プレビュー（レンダリング）なし。 |
| グリッドビュー | `module:grid` | Pinterest スタイル可変高カードレイアウトによるノート一覧。デフォルト直近7日間表示。タグ/日付フィルタ、全文検索。 |
| 設定画面 | `module:settings` | 保存ディレクトリの変更。 |

### Release-Blocking Constraints への準拠

本設計書は以下のリリース不可制約を全面的に反映している。各制約が設計上どのように実現されるかを Architecture セクション内で具体的に記述する。

| 制約 | 対象 | 設計上の反映 |
|------|------|-------------|
| Tauri（Rust + WebView）アーキテクチャ必須 | `framework:tauri`, `module:shell` | アプリケーションシェルは Tauri。バックエンド Rust、フロントエンド Svelte on WebView。フロントエンド↔Rust バックエンド間は Tauri IPC（`invoke`）経由で通信する。Electron・Wails・Neutralino 等への変更は禁止。 |
| データはローカル `.md` ファイルのみ | `module:storage` | 全ノートをローカル `.md` ファイルとして保存。SQLite・IndexedDB・クラウドストレージ・AI 呼び出し機能は禁止。 |
| Linux・macOS 対応必須 | `platform:linux`, `platform:macos` | Linux（GTK WebView）および macOS（WKWebView）でビルド・テスト・配布。Windows は将来対応としスコープ外。 |
| Cmd+N / Ctrl+N 即時新規ノート・1クリックコピーボタン | `module:editor` | コアUX。未実装ならリリース不可。 |
| CodeMirror 6 必須。タイトル入力欄禁止・Markdown プレビュー禁止 | `module:editor` | CodeMirror 6 以外のエディタエンジン採用はリリース不可。タイトル入力欄または Markdown レンダリング機能が存在する場合もリリース不可。 |
| ファイル名規則 `YYYY-MM-DDTHHMMSS.md` および自動保存 | `module:storage` | ファイル名はノート作成時タイムスタンプで確定。自動保存はデバウンス付き変更検知で実装。違反時リリース不可。 |
| デフォルト直近7日間フィルタ・タグ/日付フィルタ・全文検索 | `module:grid` | グリッドビューのデフォルト表示は直近7日間。タグフィルタ・日付フィルタ・全文検索の全てが必須。未実装ならリリース不可。 |

---

## 2. Architecture

### 2.1 全体構成

PromptNotes は Tauri アプリケーションとして、Rust バックエンドと Svelte フロントエンドの2層で構成される。両者は Tauri IPC（`invoke`）を介して通信する。

```
┌──────────────────────────────────────────────────────┐
│  OS (Linux GTK / macOS Cocoa)                        │
│  ┌────────────────────────────────────────────────┐  │
│  │  Tauri Shell (module:shell)                    │  │
│  │  ┌──────────────────┐  ┌────────────────────┐  │  │
│  │  │  Rust Backend    │  │  WebView           │  │  │
│  │  │                  │  │  (Svelte SPA)      │  │  │
│  │  │  - FileIO        │◄─┤                    │  │  │
│  │  │  - Search        │  │  - Editor (CM6)    │  │  │
│  │  │  - Config        │──►  - GridView        │  │  │
│  │  │  - Note CRUD     │  │  - Settings        │  │  │
│  │  │                  │  │                    │  │  │
│  │  └──────────────────┘  └────────────────────┘  │  │
│  │         Tauri IPC (invoke)                     │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ~/.local/share/promptnotes/notes/  (Linux)          │
│  ~/Library/Application Support/promptnotes/notes/    │
│                                        (macOS)       │
└──────────────────────────────────────────────────────┘
```

**フレームワーク確定事項:**

- **アプリケーションシェル:** Tauri（Rust + WebView）。Electron・Wails・Neutralino への変更はリリース不可（CONV-1）。
- **フロントエンド UI フレームワーク:** Svelte。Tauri 公式テンプレートでサポートされており、バンドルサイズが小さく、3画面規模のアプリに適する。CodeMirror 6 との統合は Svelte コンポーネント内で直接 CodeMirror インスタンスを生成・管理する方式とする。
- **エディタエンジン:** CodeMirror 6。Monaco・Ace・ProseMirror への変更はリリース不可（CONV-2）。
- **ストレージ:** ローカル `.md` ファイルのみ。DB・クラウド保存は禁止（CONV-3）。

### 2.2 Rust バックエンド（`module:shell`, `module:storage`）

Rust バックエンドは Tauri の `#[tauri::command]` マクロで IPC コマンドを公開する。フロントエンドは `@tauri-apps/api` の `invoke()` を通じてこれらを呼び出す。

#### 2.2.1 IPC コマンド一覧

| コマンド名 | 引数 | 戻り値 | 説明 |
|-----------|------|--------|------|
| `create_note` | なし | `{ filename: string, path: string }` | 現在時刻から `YYYY-MM-DDTHHMMSS.md` ファイルを生成。空の frontmatter テンプレート付き。 |
| `save_note` | `{ filename: string, content: string }` | `void` | 指定ファイルに内容を上書き保存。 |
| `read_note` | `{ filename: string }` | `{ content: string }` | 指定ファイルの内容を読み取り。 |
| `list_notes` | `{ from_date?: string, to_date?: string, tag?: string }` | `NoteEntry[]` | ディレクトリ内の `.md` ファイルをファイル名タイムスタンプでフィルタし、frontmatter パースしてメタデータ付きリストを返却。 |
| `search_notes` | `{ query: string, from_date?: string, to_date?: string, tag?: string }` | `NoteEntry[]` | ファイル全走査による全文検索。`std::fs::read_to_string` + `str::contains` で実装。 |
| `get_config` | なし | `Config` | 現在の設定（保存ディレクトリ等）を返却。 |
| `set_config` | `{ notes_dir: string }` | `void` | 保存ディレクトリを変更。 |
| `delete_note` | `{ filename: string }` | `void` | 指定ファイルを削除。 |

`NoteEntry` の型定義:

```typescript
interface NoteEntry {
  filename: string;       // e.g. "2026-04-04T143205.md"
  tags: string[];         // e.g. ["gpt", "coding"]
  preview: string;        // 本文先頭の抜粋（カード表示用）
  created_at: string;     // ファイル名から導出した ISO 8601 日時
}
```

#### 2.2.2 ファイル I/O

- ファイル操作は Rust 標準ライブラリ `std::fs` を使用する。
- ファイル名生成は `chrono` クレートで現在時刻を `%Y-%m-%dT%H%M%S` 形式にフォーマットする。
- frontmatter パースは Rust 側で `---` デリミタを検出し、YAML 部分を `serde_yaml` でデシリアライズする。
- デフォルト保存ディレクトリは `dirs` クレートの `data_dir()` を使用して OS 標準パスを取得する:
  - Linux: `~/.local/share/promptnotes/notes/`
  - macOS: `~/Library/Application Support/promptnotes/notes/`
- 初回起動時にディレクトリが存在しない場合は `std::fs::create_dir_all` で自動作成する。

#### 2.2.3 設定管理

- 設定ファイルは保存ディレクトリと同階層の親ディレクトリに `config.json` として保存する。
  - Linux: `~/.local/share/promptnotes/config.json`
  - macOS: `~/Library/Application Support/promptnotes/config.json`
- 設定項目は `notes_dir`（保存ディレクトリパス）のみ。
- 設定変更後、新規ノートは新しいディレクトリに保存される。既存ノートの移動は行わない。

#### 2.2.4 検索方式

ファイル全走査方式で実装する（ADR-005 準拠）。インデックスエンジン（Tantivy・SQLite FTS 等）は導入しない。

- `list_notes` コマンドでディレクトリ内の全 `.md` ファイルをスキャンし、ファイル名タイムスタンプで日付フィルタ、frontmatter パースでタグフィルタを適用する。
- `search_notes` コマンドで各ファイルの本文に対して `str::contains`（大文字小文字非区別）で全文検索を実行する。
- 想定ノート件数は1週間あたり数十件、蓄積が進んでも数百〜数千件規模であり、この規模ではファイル全走査で実用的な応答速度が得られる。
- 将来ノート件数が 5,000 件を超過した場合、応答時間を計測し Tantivy 等のインデックスエンジン導入を検討する。

### 2.3 Svelte フロントエンド

フロントエンドは Svelte で構築した SPA を Tauri の WebView 上で動作させる。画面遷移は Svelte のリアクティビティとコンポーネント切り替えで実現する（SPA ルーティングライブラリの必要性は低い。3画面のみのため、状態変数による条件レンダリングで十分）。

#### 2.3.1 エディタ画面（`module:editor`）

**CodeMirror 6 統合:**

- Svelte コンポーネント内で `EditorView` インスタンスを `onMount` 時に生成し、DOM にマウントする。
- Markdown シンタックスハイライトは `@codemirror/lang-markdown` パッケージを使用する。
- frontmatter 領域（`---` で囲まれた YAML ブロック）は `ViewPlugin` / `Decoration` によるカスタムデコレーションで背景色を変更し、本文領域と視覚的に区別する。
- エディタはプレーンテキスト編集モードのみとする。Markdown を HTML に変換して表示するレンダリング機能は実装しない（RBC-2 準拠。実装した場合リリース不可）。
- タイトル入力欄（テキストフィールド、ヘッダ入力エリア等）はエディタ画面に設けない（RBC-2 準拠。存在する場合リリース不可）。

**Cmd+N / Ctrl+N 新規ノート作成（RBC-1）:**

- CodeMirror のキーマップに `Cmd-n`（macOS）/ `Ctrl-n`（Linux）を登録する。
- キー押下時、Tauri IPC 経由で `create_note` コマンドを呼び出し、新規ファイルを生成する。
- ファイル生成後、エディタのドキュメントを新規ファイルの空テンプレートに切り替え、本文領域にフォーカスを自動移動する。
- キー押下からフォーカス移動完了まで体感上の遅延がないこと。

**1クリックコピーボタン（RBC-1）:**

- エディタ画面上部にコピーボタンを1つ配置する。
- ボタンクリック時、CodeMirror の `EditorView.state.doc` から本文テキスト（frontmatter を除く）を抽出し、`navigator.clipboard.writeText()` でシステムクリップボードにコピーする。
- コピー対象は frontmatter（`---` ブロック）を除いた本文のみ。

**自動保存（RBC-3）:**

- CodeMirror の `EditorView.updateListener` で変更を検知する。
- 変更検知後、デバウンス（500ms）を適用し、Tauri IPC 経由で `save_note` コマンドを呼び出す。
- ユーザーの明示的な「保存」操作は不要。

**frontmatter 領域:**

- エディタ画面上部に YAML 形式の frontmatter 編集領域を表示する。
- frontmatter には `tags` フィールドのみを保持する。形式: `tags: [gpt, coding]`
- メタデータとしての作成日はファイル名から導出するため、frontmatter に含めない。

#### 2.3.2 グリッドビュー（`module:grid`）

**Pinterest スタイルカード表示:**

- CSS Grid または CSS Columns による Masonry（Pinterest スタイル）可変高カードレイアウトを実装する。
- 各カードにはノートの本文プレビュー（先頭抜粋）を表示する。
- カードクリックで該当ノートのエディタ画面に遷移する。

**デフォルト直近7日間フィルタ（RBC-4）:**

- グリッドビューを開いた時点で、直近7日間に作成されたノートのみをデフォルト表示する。
- 7日間の起点はファイル名のタイムスタンプに基づく。
- `list_notes` コマンドに `from_date`（7日前）と `to_date`（現在）を渡して絞り込む。

**タグフィルタ（RBC-4）:**

- タグ選択UI（ドロップダウンまたはチップ）を提供する。
- 選択したタグを `list_notes` コマンドの `tag` パラメータに渡してフィルタリングする。

**日付フィルタ（RBC-4）:**

- 日付範囲指定UI（日付ピッカーまたはプリセット選択）を提供する。
- デフォルトの直近7日間以外の任意期間で絞り込みが可能。

**全文検索（RBC-4）:**

- 検索テキストボックスを提供する。
- 入力テキストを `search_notes` コマンドに渡し、ファイル全走査で結果を取得する。
- 想定件数（1週間あたり数十件）で実用的な速度で結果を返す。

#### 2.3.3 設定画面（`module:settings`）

- 保存ディレクトリのパスを表示・編集するテキストフィールドを提供する。
- ディレクトリ変更時、Tauri のファイルダイアログ API（`@tauri-apps/api/dialog`）でディレクトリ選択を可能にする。
- 変更確定時に `set_config` コマンドを呼び出して設定を永続化する。

### 2.4 データモデル

#### 2.4.1 ノートファイル

```
---
tags: [gpt, coding]
---

本文をここに書く...
```

| 項目 | 仕様 |
|------|------|
| ファイル名 | `YYYY-MM-DDTHHMMSS.md`（例: `2026-04-04T143205.md`） |
| ファイル形式 | UTF-8 エンコード Markdown |
| frontmatter | YAML 形式。`tags` フィールドのみ。 |
| 作成日時 | ファイル名から一意に導出。frontmatter に含めない。 |
| 保存先 | OS 標準データディレクトリ配下 `promptnotes/notes/`、または設定で指定した任意ディレクトリ |

#### 2.4.2 設定ファイル

```json
{
  "notes_dir": "/home/user/.local/share/promptnotes/notes/"
}
```

- ファイルパス:
  - Linux: `~/.local/share/promptnotes/config.json`
  - macOS: `~/Library/Application Support/promptnotes/config.json`

### 2.5 Obsidian 互換性

- 保存された `.md` ファイルは標準的な YAML frontmatter + Markdown 本文形式であり、Obsidian および VSCode でそのまま開ける。
- Obsidian vault 内のサブディレクトリを保存先に指定した場合、Obsidian 側でノートが正常に認識される。
- Git リポジトリ内に配置した場合、通常の `git add` / `git commit` でバージョン管理できる。
- データのバックアップ・復元はファイルシステムレベル（`cp`、`rsync`、Git）でユーザーが行う。アプリ内バックアップ機能は提供しない。

### 2.6 プラットフォーム対応

| プラットフォーム | WebView エンジン | ステータス |
|----------------|-----------------|-----------|
| Linux | GTK WebKitGTK | 対応必須 |
| macOS | WKWebView | 対応必須 |
| Windows | WebView2 | 将来対応（スコープ外） |

### 2.7 配布形式

| プラットフォーム | 配布方式 |
|----------------|---------|
| Linux | バイナリ直接ダウンロード（`.AppImage` または `.deb`）、Flatpak（Flathub）、NixOS パッケージ |
| macOS | バイナリ直接ダウンロード（`.dmg`）、Homebrew Cask |

CI/CD パイプラインで `tauri build` を実行し、各配布形式のアーティファクトを自動生成する。Flatpak マニフェストおよび Homebrew Cask formula はリポジトリ内で管理する。

### 2.8 スコープ外（実装禁止）

以下の機能はスコープ外であり、実装された場合リリース不可となる。

| 禁止項目 | 理由 |
|---------|------|
| AI 呼び出し機能（LLM API コール、チャット UI、プロンプト送信） | スコープ外。CONV-3 に関連。 |
| クラウド同期（リモートサーバーへのデータ送信・同期） | CONV-3 違反。 |
| データベース利用（SQLite・IndexedDB・PostgreSQL 等） | CONV-3 違反。 |
| タイトル入力欄 | RBC-2 違反。 |
| Markdown プレビュー（HTML レンダリング） | RBC-2 違反。 |
| モバイル対応（iOS / Android） | スコープ外。 |
| Windows ビルド・配布 | 将来対応。現時点ではスコープ外。 |

---

## 3. Open Questions

| ID | 対象 | 質問 | 備考 |
|----|------|------|------|
| ~~OQ-001~~ | ~~ADR-002~~ | ~~React vs Svelte の最終選定~~ | **解決済み: Svelte に決定。** バンドルサイズの小ささ、ボイラープレートの少なさ、Tauri 公式テンプレートサポートを評価。 |
| OQ-002 | `module:editor` | CodeMirror 6 の frontmatter カスタムデコレーション（背景色変更）を `ViewPlugin` で実装するか `StateField` + `Decoration` で実装するか。Svelte コンポーネントとの統合パターンのプロトタイプで最終判断する。 | 開発着手時に技術検証で決定。 |
| OQ-003 | `module:grid` | Masonry レイアウトを CSS Grid（`grid-template-rows: masonry`、Firefox のみ実験的サポート）で実装するか、CSS Columns で実装するか、JavaScript ライブラリ（例: svelte-masonry）で実装するか。 | WebKitGTK / WKWebView での CSS Masonry サポート状況を確認の上決定。 |
| OQ-004 | `module:editor` | 自動保存のデバウンス間隔を 500ms とするか、より長い間隔（1000ms 等）とするか。体感の即時性とファイル I/O 頻度のバランスを検証する。 | プロトタイプでユーザーテストを実施して決定。 |
| OQ-005 | 配布 | Tauri v2 の安定版リリース状況に応じて、v1 と v2 のいずれをベースにするか。IPC モデル・セキュリティモデルの変更点を評価する。 | 開発開始時点の Tauri 安定版に基づいて決定。 |
