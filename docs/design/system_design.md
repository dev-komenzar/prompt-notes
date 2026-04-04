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

PromptNotes は AI へ渡すプロンプトを素早く書き溜めるローカルファーストのノートアプリケーションである。タイトル不要・本文即記・グリッド振り返りをコアUXとし、ターミナルや IDE へプロンプトをペーストする用途に特化する。

アプリケーションは Tauri（Rust + WebView）上で構築され、フロントエンド（WebView SPA）と Rust バックエンド間は Tauri IPC（`invoke`）を介して通信する。データはすべてローカル `.md` ファイルとして保存し、クラウド同期・データベース利用・AI 呼び出し機能の実装は禁止する。

対象プラットフォームは Linux および macOS とする。Windows は将来対応でありスコープ外である。

### 画面構成

アプリケーションは以下の3画面で構成される。

| 画面 | モジュール | 概要 |
|------|-----------|------|
| エディタ画面 | `module:editor` | CodeMirror 6 によるプレーンテキスト Markdown 編集。frontmatter（タグ）+ 本文。タイトル入力欄なし・Markdown プレビューなし。 |
| グリッドビュー | `module:grid` | Pinterest スタイル可変高カードレイアウトによるノート一覧。デフォルト直近7日間フィルタ、タグ/日付フィルタ、全文検索。 |
| 設定画面 | `module:settings` | 保存ディレクトリの変更。 |

### Release-Blocking Constraints の反映

本設計書は以下のリリース不可制約に準拠する。各制約がアーキテクチャ上どのように反映されているかを明示する。

| 制約 | 対象 | 本設計書での反映 |
|------|------|-----------------|
| Tauri（Rust + WebView）アーキテクチャ必須。フロントエンド↔Rust バックエンド間は Tauri IPC 経由。 | `framework:tauri`, `module:shell` | アーキテクチャ全体を Tauri IPC ベースのプロセス分離モデルで設計。Rust バックエンドがファイル I/O・検索・設定管理を担当し、フロントエンドは WebView SPA として動作する（§2.1, §2.2, §2.3）。 |
| データはローカル `.md` ファイルのみ。クラウド同期・DB 利用は禁止。AI 呼び出し機能の実装も禁止。 | `module:storage` | ストレージ層はファイルシステム直接操作のみで構成。SQLite・IndexedDB・クラウドストレージは一切使用しない。検索もファイル全走査方式とする。LLM API コール・チャット UI・プロンプト送信機能は実装しない（§2.4, §2.5）。 |
| Linux・macOS 対応必須。Windows は将来対応としスコープ外。 | `platform:linux`, `platform:macos` | Linux（GTK WebView）および macOS（WKWebView）を対象とし、プラットフォーム固有パス解決・配布パイプラインを両 OS 向けに設計する。Windows 向けビルド・配布パイプラインは構築しない（§2.6, §2.7）。 |
| Cmd+N / Ctrl+N 即時新規ノート作成および1クリックコピーボタンはコアUX。未実装ならリリース不可。 | `module:editor` | エディタ画面のキーバインド設計および UI コンポーネント設計に反映（§2.3.1, §2.3.2）。 |
| CodeMirror 6 必須。タイトル入力欄禁止・Markdown プレビュー（レンダリング）禁止はスコープ外として明示されており、実装した場合リリース不可。 | `module:editor` | エディタエンジンとして CodeMirror 6 を使用。タイトル入力欄を設けず、Markdown を HTML に変換表示する機能を含めない（§2.3）。 |
| ファイル名規則 `YYYY-MM-DDTHHMMSS.md` および自動保存は確定済み。違反時リリース不可。 | `module:storage` | ストレージ層のファイル命名ロジックおよび自動保存フローに反映（§2.4.1, §2.4.2）。 |
| デフォルト直近7日間フィルタ・タグ/日付フィルタ・全文検索は必須機能。未実装ならリリース不可。 | `module:grid` | グリッドビューのデータ取得・フィルタリング・検索アーキテクチャに反映（§2.5）。 |

---

## 2. Architecture

### 2.1 全体アーキテクチャ

PromptNotes は Tauri のプロセス分離モデルに基づき、以下の2レイヤーで構成される。

```
┌─────────────────────────────────────────────────┐
│                   WebView SPA                    │
│  ┌────────────┐ ┌────────────┐ ┌──────────────┐ │
│  │   Editor    │ │  GridView  │ │   Settings   │ │
│  │ (CodeMirror │ │ (Pinterest │ │  (Dir config)│ │
│  │     6)      │ │   cards)   │ │              │ │
│  └─────┬──────┘ └─────┬──────┘ └──────┬───────┘ │
│        │              │               │          │
│        └──────────┬───┴───────────────┘          │
│                   │ Tauri IPC (invoke)            │
├───────────────────┼─────────────────────────────-┤
│                   ▼                               │
│            Rust Backend (module:shell)            │
│  ┌─────────────┐ ┌──────────┐ ┌───────────────┐ │
│  │  File I/O   │ │  Search  │ │    Settings   │ │
│  │  (storage)  │ │ (scan)   │ │   (config)    │ │
│  └──────┬──────┘ └────┬─────┘ └───────┬───────┘ │
│         │             │               │          │
│         └─────────────┴───────────────┘          │
│                       │                          │
│              Local Filesystem                    │
│         ~/.local/share/promptnotes/              │
│   ~/Library/Application Support/promptnotes/     │
└──────────────────────────────────────────────────┘
```

**フロントエンド（WebView SPA）:** OS ネイティブ WebView（Linux: GTK WebView、macOS: WKWebView）上で動作する SPA。UIフレームワークは React または Svelte のいずれかを採用する（ADR-002 により技術検証後に最終決定）。エディタ画面・グリッドビュー・設定画面の3画面間をクライアントサイドルーティングで遷移する。

**Rust バックエンド（`module:shell`）:** Tauri のバックエンドプロセスとして動作する Rust コード。ファイル I/O（ノートの読み書き・ディレクトリ作成）、全文検索（ファイル全走査）、設定管理（保存ディレクトリパスの永続化）を担当する。フロントエンドとの通信は Tauri IPC（`invoke` コマンド）を介して行う。

**ローカルファイルシステム:** 全データの永続化先。`.md` ファイル（ノート）および設定ファイルをローカルファイルシステム上に保存する。ネットワーク通信は一切行わない。

### 2.2 Tauri IPC コマンド設計

フロントエンドから Rust バックエンドへの全ての呼び出しは Tauri IPC の `invoke` コマンドを経由する。以下に主要コマンドを定義する。

| コマンド名 | 方向 | 引数 | 戻り値 | 説明 |
|-----------|------|------|--------|------|
| `create_note` | Frontend → Backend | なし | `{ filename: string, path: string }` | 新規ノートを作成。ファイル名 `YYYY-MM-DDTHHMMSS.md` を生成し、空の frontmatter テンプレートを書き込む。 |
| `save_note` | Frontend → Backend | `{ filename: string, content: string }` | `{ success: bool }` | ノート内容を上書き保存。自動保存トリガーから呼び出される。 |
| `read_note` | Frontend → Backend | `{ filename: string }` | `{ content: string, tags: string[] }` | 指定ノートの内容を読み取り。frontmatter パースを含む。 |
| `list_notes` | Frontend → Backend | `{ from_date: string, to_date: string, tag?: string }` | `{ notes: NoteEntry[] }` | 日付範囲・タグでフィルタしたノート一覧を返す。ファイル名タイムスタンプに基づく。 |
| `search_notes` | Frontend → Backend | `{ query: string, from_date?: string, to_date?: string }` | `{ results: NoteEntry[] }` | 全文検索。ファイル全走査で本文中のテキストを検索する。 |
| `get_all_tags` | Frontend → Backend | なし | `{ tags: string[] }` | 全ノートの frontmatter からタグ一覧を集約して返す。 |
| `get_settings` | Frontend → Backend | なし | `{ notes_dir: string }` | 現在の設定を返す。 |
| `update_settings` | Frontend → Backend | `{ notes_dir: string }` | `{ success: bool }` | 保存ディレクトリを変更する。 |

**NoteEntry の構造:**

```typescript
interface NoteEntry {
  filename: string;       // "2026-04-04T143205.md"
  created_at: string;     // ファイル名から導出 "2026-04-04T14:32:05"
  tags: string[];         // frontmatter の tags フィールド
  preview: string;        // 本文先頭の抜粋（グリッドビューカード表示用）
}
```

### 2.3 エディタ画面（`module:editor`）

#### 2.3.1 CodeMirror 6 統合

エディタエンジンとして CodeMirror 6 を採用する（変更不可）。以下のパッケージ構成で統合する。

| パッケージ | 用途 |
|-----------|------|
| `@codemirror/state` | エディタ状態管理 |
| `@codemirror/view` | エディタビュー・DOM 統合 |
| `@codemirror/lang-markdown` | Markdown シンタックスハイライト |
| `@codemirror/commands` | 基本編集コマンド |
| `@codemirror/language` | 言語サポート基盤 |

**タイトル入力欄の排除:** エディタ画面にタイトル専用のテキストフィールド・ヘッダ入力エリアは設けない。画面構成は frontmatter 領域と本文領域のみとする。タイトル入力欄が存在する場合はリリース不可（FAIL-04）。

**Markdown プレビューの排除:** Markdown を HTML に変換して表示するプレビュー・レンダリング機能は実装しない。エディタはプレーンテキスト編集モードとし、`@codemirror/lang-markdown` によるシンタックスハイライト（色分け表示）のみを提供する。プレビュー機能が存在する場合はリリース不可（FAIL-05）。

**frontmatter 領域の視覚的区別:** CodeMirror 6 のカスタムデコレーション（`ViewPlugin` + `Decoration`）を用いて、`---` で囲まれた frontmatter ブロックの背景色を本文領域と異なる色に変更する。これにより、ユーザーが frontmatter と本文を視覚的に即座に区別できるようにする。

**キーバインド登録:** CodeMirror 6 のキーマップ（`keymap` エクステンション）に以下を登録する。

- macOS: `Cmd+N` → 新規ノート作成（`create_note` IPC コマンド呼び出し）
- Linux: `Ctrl+N` → 新規ノート作成（`create_note` IPC コマンド呼び出し）

新規ノート作成後、エディタの本文領域（frontmatter 直後）にフォーカスを自動移動する。キー押下からフォーカス移動完了まで体感上の遅延がないこと。

#### 2.3.2 1クリックコピーボタン

エディタ画面上にコピーボタンを1つ配置する。ボタンクリック時の処理フロー:

1. CodeMirror 6 のドキュメント内容を取得する。
2. frontmatter ブロック（`---` で囲まれた YAML 部分）を除外し、本文テキストのみを抽出する。
3. `navigator.clipboard.writeText()` でシステムクリップボードに本文を書き込む。

コピー対象は frontmatter を除く本文テキスト全体とする。

#### 2.3.3 自動保存フロー

手動保存操作は不要とし、編集内容を自動的にファイルへ永続化する。

1. CodeMirror 6 の `updateListener` エクステンションでドキュメント変更を検知する。
2. 変更検知後、デバウンス処理（一定時間変更がなくなるまで待機）を行う。
3. デバウンス完了後、Tauri IPC の `save_note` コマンドを呼び出す。
4. Rust バックエンドが `std::fs::write` でファイルに書き込む。

ファイル名はノート作成時のタイムスタンプで確定し、以降変更されない。

### 2.4 ストレージ層（`module:storage`）

#### 2.4.1 ファイル命名規則

新規ノート作成時、Rust バックエンドがシステム時刻を取得し、`YYYY-MM-DDTHHMMSS.md` 形式のファイル名を生成する。

- 形式: `YYYY-MM-DDTHHMMSS.md`
- 例: `2026-04-04T143205.md`
- タイムスタンプはノート作成時刻（ローカル時刻）に基づく。
- ファイル名にタイトル文字列やその他の付加情報を含めない。
- 作成日時はファイル名から一意に導出する（ファイルシステムのタイムスタンプには依存しない）。

#### 2.4.2 ファイル形式

保存されるファイルは `.md`（Markdown）形式とし、以下の構造に準拠する。

```markdown
---
tags: [gpt, coding]
---

本文をここに書く...
```

- ファイル先頭に YAML frontmatter（`---` で囲まれたブロック）を配置する。
- frontmatter 内のメタデータは `tags` フィールドのみとする。
- frontmatter の後に空行を挟み、本文が続く。
- この形式は Obsidian および VSCode でそのまま開ける互換性を保証する。

#### 2.4.3 デフォルト保存ディレクトリ

プラットフォーム固有のデフォルト保存ディレクトリを以下のとおり定義する。

| プラットフォーム | デフォルト保存先 |
|-----------------|-----------------|
| Linux | `~/.local/share/promptnotes/notes/` |
| macOS | `~/Library/Application Support/promptnotes/notes/` |

Rust バックエンドは初回起動時にデフォルト保存ディレクトリの存在を確認し、存在しない場合は自動的に作成する（`std::fs::create_dir_all`）。

設定画面から保存ディレクトリを任意のパスに変更できる。変更後、新規ノートは新しいディレクトリに保存される。

#### 2.4.4 設定ファイル

アプリケーション設定（保存ディレクトリパス等）は Tauri の標準設定ディレクトリに保存する。

| プラットフォーム | 設定ファイルパス |
|-----------------|-----------------|
| Linux | `~/.config/promptnotes/config.json` |
| macOS | `~/Library/Application Support/promptnotes/config.json` |

設定ファイル形式は JSON とし、以下の構造を持つ。

```json
{
  "notes_dir": "/home/user/.local/share/promptnotes/notes/"
}
```

#### 2.4.5 Obsidian 互換性

保存された `.md` ファイルは以下の相互運用性を保証する。

- Obsidian vault 内のサブディレクトリを保存先に指定した場合、Obsidian 側でノートが正常に認識される。
- VSCode でそのまま `.md` ファイルとして開ける。
- Git リポジトリ内に配置した場合、`git add` / `git commit` で通常どおりバージョン管理できる。

データのバックアップ・復元はファイルシステムレベル（`cp`、`rsync`、Git）でユーザーが行う。アプリ内バックアップ機能は提供しない。

### 2.5 グリッドビュー（`module:grid`）

#### 2.5.1 カードレイアウト

グリッドビューは Pinterest スタイルの可変高カードレイアウトで構成する。各カードには以下の情報を表示する。

- ノート本文のプレビュー（先頭からの抜粋テキスト）
- タグ一覧（frontmatter の `tags` フィールド）
- 作成日時（ファイル名のタイムスタンプから導出）

カードクリック時は該当ノートのエディタ画面に遷移する。

#### 2.5.2 デフォルトフィルタ（直近7日間）

グリッドビューを開いた時点で、直近7日間に作成されたノートのみをデフォルト表示する。7日間の判定はファイル名のタイムスタンプ（`YYYY-MM-DDTHHMMSS`）に基づく。

データ取得フロー:

1. フロントエンドがグリッドビュー表示時に `list_notes` IPC コマンドを呼び出す（`from_date` = 7日前、`to_date` = 現在）。
2. Rust バックエンドが保存ディレクトリ内の `.md` ファイル名を走査し、タイムスタンプが範囲内のファイルを抽出する。
3. 各ファイルの frontmatter をパースしてタグを取得し、本文先頭からプレビューテキストを生成する。
4. `NoteEntry` のリストをフロントエンドに返す。

#### 2.5.3 フィルタリング機能

**タグフィルタ:** ユーザーが特定のタグを選択すると、当該タグを frontmatter に持つノートのみを表示する。タグ一覧は `get_all_tags` IPC コマンドで全ノートから集約して取得する。

**日付フィルタ:** ユーザーが任意の日付範囲を指定してノートを絞り込む。デフォルトの直近7日間以外の期間での絞り込みが可能である。

タグフィルタと日付フィルタは組み合わせて使用できる。

#### 2.5.4 全文検索

全文検索はファイル全走査方式で実装する。インデックスエンジン（Tantivy、SQLite FTS 等）は導入しない。

検索フロー:

1. フロントエンドが検索クエリを `search_notes` IPC コマンドで送信する。
2. Rust バックエンドが保存ディレクトリ内の全 `.md` ファイルを `std::fs::read_to_string` で読み込む。
3. 各ファイルの本文に対して `str::contains`（大文字小文字の扱いは実装時に決定）で検索クエリとのマッチを判定する。
4. マッチしたファイルの `NoteEntry` リストをフロントエンドに返す。

想定ノート件数は1週間で数十件程度であり、蓄積が進んでも数百〜数千件規模に留まる。この規模ではファイル全走査で実用的な応答速度が得られる。ノート件数が 5,000 件を超過した場合は Tantivy 等のインデックスエンジン導入を検討する（ADR-005 FU-002）。

### 2.6 プラットフォーム対応

#### 2.6.1 Linux

- WebView: GTK WebView（WebKitGTK）
- デフォルト保存先: `~/.local/share/promptnotes/notes/`
- 設定ファイル: `~/.config/promptnotes/config.json`
- キーバインド: `Ctrl+N` で新規ノート作成
- 配布形式: バイナリ直接ダウンロード（`.AppImage` または `.deb`）、Flatpak（Flathub）、NixOS パッケージ

#### 2.6.2 macOS

- WebView: WKWebView
- デフォルト保存先: `~/Library/Application Support/promptnotes/notes/`
- 設定ファイル: `~/Library/Application Support/promptnotes/config.json`
- キーバインド: `Cmd+N` で新規ノート作成
- 配布形式: バイナリ直接ダウンロード（`.dmg`）、Homebrew Cask

#### 2.6.3 Windows（スコープ外）

Windows は将来対応としスコープ外とする。ビルド・配布パイプラインを現時点では構築しない。Tauri は Windows ビルドを公式サポートしているため、将来対応時の技術的障壁は低い（ADR-006 FU-003）。

### 2.7 配布パイプライン

CI/CD パイプラインで `tauri build` を実行し、以下のアーティファクトを自動生成する。

| プラットフォーム | 配布形式 | アーティファクト |
|-----------------|---------|----------------|
| Linux | バイナリ直接ダウンロード | `.AppImage` または `.deb` |
| Linux | Flatpak | Flathub 公開パッケージ |
| Linux | NixOS | Nix パッケージ |
| macOS | バイナリ直接ダウンロード | `.dmg` |
| macOS | Homebrew Cask | Cask formula |

Flatpak マニフェストおよび Homebrew Cask formula はリポジトリ内で管理する。

### 2.8 スコープ外機能の排除

以下の機能はアーキテクチャ上明示的に排除する。いずれかが実装に含まれている場合、リリース不可とする。

| 排除対象 | 排除理由 |
|---------|---------|
| AI 呼び出し機能（LLM API コール、チャット UI、プロンプト送信） | スコープ外。PromptNotes はプロンプトを「書き溜める」アプリであり、AI との対話機能を持たない。 |
| クラウド同期（リモートサーバーへのデータ送信・同期） | `module:storage` 制約によりローカル `.md` ファイルのみ。ネットワーク通信によるデータ送信は禁止。 |
| データベース（SQLite、IndexedDB、PostgreSQL 等） | `module:storage` 制約により禁止。 |
| タイトル入力欄 | `module:editor` 制約により禁止。ノートにタイトル概念はなく、ファイル名はタイムスタンプで自動生成する。 |
| Markdown プレビュー（レンダリング） | `module:editor` 制約により禁止。シンタックスハイライトのみ提供。 |
| モバイル対応（iOS / Android） | スコープ外。デスクトップ（Linux / macOS）専用。 |

### 2.9 技術スタック要約

| レイヤー | 技術 | ステータス |
|---------|------|-----------|
| アプリケーションシェル | Tauri（Rust + WebView） | 確定（変更不可） |
| バックエンド言語 | Rust | 確定 |
| フロントエンドUIフレームワーク | React または Svelte | 技術検証後に最終決定（ADR-002） |
| エディタエンジン | CodeMirror 6 | 確定（変更不可） |
| Markdown ハイライト | `@codemirror/lang-markdown` | 確定 |
| ストレージ | ローカル `.md` ファイル | 確定（変更不可） |
| 検索方式 | ファイル全走査（`std::fs` + `str::contains`） | 確定（5,000 件超過時に再検討） |
| IPC | Tauri `invoke` コマンド | 確定 |

---

## 3. Open Questions

| ID | 対象 | 質問 | 影響範囲 | 優先度 | 解決条件 |
|----|------|------|---------|--------|---------|
| OQ-001 | ADR-002 | フロントエンド UI フレームワークとして React と Svelte のどちらを採用するか。検証項目: CodeMirror 6 統合安定性（`@uiw/react-codemirror` 等のラッパー有無・品質）、frontmatter 背景色カスタムデコレーション実装容易性、ビルドサイズ比較、Tauri IPC との統合パターン。 | フロントエンド全体の実装方式・依存パッケージ構成 | 高（開発開始前に解決必須） | 技術検証プロトタイプの実装と比較評価を完了する。 |
| OQ-002 | `module:editor` | 自動保存のデバウンス間隔をどの程度に設定するか。短すぎるとディスク I/O 頻度が高くなり、長すぎるとデータ消失リスクが増加する。 | 自動保存の応答性とリソース消費のバランス | 中 | ユーザーテストで体感遅延と保存信頼性を検証し、具体的な値（例: 500ms〜2000ms）を決定する。 |
| OQ-003 | `module:grid` | 全文検索の大文字小文字区別をどうするか（case-insensitive が一般的だが、Markdown コードブロック内の検索精度との兼ね合い）。 | 検索結果の網羅性・精度 | 中 | ユーザビリティの観点から case-insensitive をデフォルトとし、必要に応じてオプションを追加するか決定する。 |
| OQ-004 | `module:grid` | グリッドビューのカードに表示する本文プレビューの文字数上限をどう設定するか。カードの可変高レイアウトとのバランスが必要。 | UI 表示品質・パフォーマンス | 低 | デザインモックアップとプロトタイプで視覚的に検証する。 |
| OQ-005 | ADR-004 / FU-002 | ノート件数が 5,000 件を超過した場合のファイル全走査パフォーマンス。Tantivy 等のインデックスエンジン導入の閾値と移行計画。 | 検索アーキテクチャの将来拡張 | 低（5,000 件超過時に検討） | 5,000 件規模でのベンチマークを実施し、応答時間が許容範囲を超える場合にインデックスエンジン導入 ADR を起票する。 |
| OQ-006 | ADR-001 / FU-004 | Tauri v2 安定版リリース時の IPC モデル・セキュリティモデルの変更への対応方針。 | アプリケーション全体のアーキテクチャ | 中（Tauri メジャーバージョンアップ時） | Tauri v2 リリースノートを評価し、マイグレーション計画を策定する。 |
