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
  - feed
  - storage
  - settings
  - shell
---

# System Design

## 1. Overview

PromptNotes は AI へ渡すプロンプトを素早く書き溜めるローカルデスクトップノートアプリである。タイトル不要・本文のみ・1 画面完結をコンセプトとし、ターミナルや IDE へのペーストを主用途とする。

### 設計原則

- **ローカルファースト**: すべてのデータはローカルファイルシステム上の `.md` ファイルとして保存する。クラウド同期・データベース・AI 呼び出し機能は一切実装しない。
- **軽量・高速**: Tauri（Rust + WebView）アーキテクチャにより、バイナリサイズとメモリフットプリントを最小化する。
- **単画面完結**: フィード表示・編集・検索・フィルタをすべて 1 画面内で完結させる。

### 対象プラットフォーム

| プラットフォーム | サポート状態 | 配布チャネル |
|---|---|---|
| Linux | 必須 | バイナリ直接ダウンロード / Flatpak (Flathub) / NixOS |
| macOS | 必須 | バイナリ直接ダウンロード / Homebrew Cask |
| Windows | スコープ外（将来対応） | — |

Linux・macOS 対応は必須であり、これらのプラットフォームで動作しない場合はリリース不可とする。

### 非交渉条件への準拠

本設計書は以下のリリースブロッキング制約を全セクションにわたって反映する。

| 制約 | 対象 | 準拠箇所 |
|---|---|---|
| Tauri（Rust + WebView）アーキテクチャ必須。フロントエンド↔Rust バックエンド間は Tauri IPC 経由。 | framework:tauri, module:shell | §2 レイヤー構成、IPC コマンド設計 |
| データはローカル `.md` ファイルのみ。クラウド同期・DB 利用は禁止。AI 呼び出し機能の実装も禁止。 | module:storage | §2 ストレージ層、データフロー |
| Linux・macOS 対応必須。Windows は将来対応としスコープ外。 | platform:linux, platform:macos | §1 対象プラットフォーム、§2 OS 抽象化 |
| Cmd+N / Ctrl+N 即時新規ノート作成および 1 クリックコピーボタンはコア UX。未実装ならリリース不可。 | module:editor | §2 エディタモジュール |
| CodeMirror 6 必須。タイトル入力欄禁止・Markdown プレビュー（レンダリング）禁止。 | module:editor | §2 エディタモジュール |
| ファイル名規則 `YYYY-MM-DDTHHMMSS.md` および自動保存は確定済み。違反時リリース不可。 | module:storage | §2 ストレージ層 |
| デフォルト直近 7 日間フィルタ・タグ/日付フィルタ・全文検索は必須機能。未実装ならリリース不可。 | module:feed | §2 フィードモジュール |

## 2. Architecture

### 2.1 レイヤー構成

PromptNotes は 3 層アーキテクチャで構成する。フロントエンド（Svelte）と Rust バックエンド間の通信はすべて Tauri IPC（`invoke` コマンド）を経由し、直接のファイルシステムアクセスをフロントエンドに許可しない。

```
┌─────────────────────────────────────────────────┐
│                 Tauri Shell (OS)                 │
│  ウィンドウ管理 / メニュー / グローバルショートカット       │
├─────────────────────────────────────────────────┤
│           Frontend Layer (WebView)              │
│  Svelte + CodeMirror 6                          │
│  ┌───────────┬───────────┬──────────┬────────┐  │
│  │  editor   │   feed    │ settings │ header │  │
│  └─────┬─────┴─────┬─────┴────┬─────┴────────┘  │
│        │           │          │                  │
│        └───────────┼──────────┘                  │
│              Tauri IPC (invoke)                  │
├─────────────────────────────────────────────────┤
│           Backend Layer (Rust)                   │
│  ┌───────────┬────────────┬──────────────────┐  │
│  │  storage  │  search    │  config          │  │
│  │  commands │  commands  │  commands        │  │
│  └─────┬─────┴──────┬─────┴────────┬─────────┘  │
│        │            │              │             │
│        └────────────┼──────────────┘             │
│             Local Filesystem (.md)               │
└─────────────────────────────────────────────────┘
```

### 2.2 モジュール構成

#### module:shell — Tauri シェル層

Tauri アプリケーションのエントリポイントおよびウィンドウ管理を担当する。

- **ウィンドウ設定**: 単一ウィンドウ、リサイズ可能、初期サイズ 1280×720
- **グローバルショートカット登録**: Cmd+N (macOS) / Ctrl+N (Linux) をアプリレベルで登録し、フロントエンドへイベントとして通知する
- **Tauri プラグイン**: `fs`（ファイルシステムアクセス）、`clipboard-manager`（クリップボード操作）、`dialog`（ディレクトリ選択）を使用する
- **allowlist 設定**: `tauri.conf.json` にてファイルシステム読み書きスコープを保存ディレクトリに限定する。ネットワークアクセスは一切許可しない（AI 呼び出し禁止の強制）

#### module:editor — エディタモジュール（フロントエンド）

Svelte コンポーネントとして実装する。エディタエンジンは CodeMirror 6 のみを使用し、Monaco 等への変更はリリース不可とする。

**コンポーネント構成**:

| コンポーネント | 責務 |
|---|---|
| `NoteCard.svelte` | 個別ノートカードの表示モード/編集モード切替 |
| `NoteEditor.svelte` | CodeMirror 6 インスタンスの管理 |
| `CopyButton.svelte` | 1 クリックでノート本文をクリップボードにコピー |
| `DeleteButton.svelte` | ノート削除の実行 |

**CodeMirror 6 構成**:

- 基本パッケージ: `@codemirror/state`, `@codemirror/view`
- Markdown ハイライト: `@codemirror/lang-markdown`, `@codemirror/language-data`
- frontmatter 背景色: `ViewPlugin` + `Decoration` による YAML frontmatter 領域（`---` 〜 `---`）の背景色カスタマイズ
- シンタックスハイライトのみ実施し、Markdown の HTML レンダリング（プレビュー）は実装しない。実装した場合リリース不可。
- タイトル入力欄は実装しない。実装した場合リリース不可。

**モード遷移**:

```
[表示モード] --カードクリック--> [編集モード]
[編集モード] --カード外クリック--> 自動保存 --> [表示モード]
[編集モード] --別カードクリック--> 自動保存(現カード) --> [表示モード(現カード)] + [編集モード(別カード)]
```

- 同時に編集モードになるカードは 1 つだけとする（シングルエディタインスタンス管理）
- カード外クリックまたは別カードクリック時に `invoke("save_note")` を呼び出して自動保存する
- 新規ノート作成時は即座に編集モードで最上部に挿入し、CodeMirror 6 の `.cm-content` にフォーカスを移動する
- ショートカット押下からエディタ出現まで 200ms 以内を目標とする

**表示モード**:

カードには以下を表示する。Markdown レンダリングは行わない。

- 本文のプレーンテキスト
- タグ一覧（frontmatter の `tags` から取得）
- タイムスタンプ（ファイル名から取得し、人間が読みやすい形式に変換）

**コピー機能**:

Copy ボタン押下時、frontmatter を除いたノート本文全体を Tauri の `clipboard-manager` プラグイン経由でシステムクリップボードにコピーする。コピー成功時にボタンのアイコン/テキストを一時的に変化させてフィードバックを提供する。

#### module:feed — フィード表示・検索・フィルタモジュール（フロントエンド + バックエンド）

**フロントエンドコンポーネント**:

| コンポーネント | 責務 |
|---|---|
| `Feed.svelte` | ノートカード一覧の表示（降順ソート） |
| `SearchBar.svelte` | 全文検索キーワード入力 |
| `TagFilter.svelte` | タグによるフィルタ選択 |
| `DateFilter.svelte` | 日付範囲によるフィルタ指定 |
| `Header.svelte` | New ボタン、⚙️ ボタン、検索バー、フィルタ UI を配置（アプリ名は表示しない） |

**フィルタロジック**:

- デフォルトフィルタ: アプリ起動直後、ファイル名タイムスタンプが過去 7 日間以内のノートのみ表示する。丁度 7 日前の 00:00:00 のノートは表示対象に含む。
- ソート順: ファイル名タイムスタンプの降順（新しい順）
- タグフィルタ: frontmatter の `tags` フィールドを対象にフィルタする。複数タグ選択時は OR 条件とする。
- 日付フィルタ: 開始日・終了日を指定し、ファイル名タイムスタンプが範囲内のノートを表示する。
- 全文検索: Rust バックエンド側でファイル全走査を行い、キーワードを含むファイルのパス一覧を返す。外部インデックスエンジンは使用しない。

**バックエンド検索コマンド**:

Rust 側で保存ディレクトリ内の全 `.md` ファイルを読み込み、本文に対して文字列マッチングを実行する。想定データ量は 1 週間分（数十件）であり、全走査で十分なパフォーマンスを確保できる。ノート件数が 1,000 件を超え、レスポンスタイムが 200ms を超える場合は tantivy ベースのインデックス検索への移行を検討する（ADR-005 FU-002）。

#### module:storage — ストレージモジュール（Rust バックエンド）

すべてのデータ永続化はローカルファイルシステム上の `.md` ファイルで行う。SQLite・クラウドストレージ・その他の DB は使用しない。

**ファイル名規則**: `YYYY-MM-DDTHHMMSS.md`

- 例: `2026-04-13T143205.md`
- 正規表現: `^\d{4}-\d{2}-\d{2}T\d{6}\.md$`
- タイムスタンプはノート作成時刻（ローカル時刻）を使用する
- この規則に違反するファイルが生成された場合リリース不可

**ファイル構造**:

```markdown
---
tags: [gpt, coding]
---

ノート本文がここに入る
```

- frontmatter に含まれるメタデータは `tags` のみ。作成日はファイル名から取得する。
- タグが空の場合は `tags: []` とする。

**デフォルト保存ディレクトリ**:

| OS | パス |
|---|---|
| Linux | `~/.local/share/promptnotes/notes/` |
| macOS | `~/Library/Application Support/promptnotes/notes/` |

初回起動時にディレクトリが存在しない場合は自動作成する。設定モーダルから任意のディレクトリに変更可能とする。

**設定ファイル**:

アプリケーション設定（保存ディレクトリパス等）は Tauri の `app_data_dir` 配下に JSON ファイルとして保存する。

| OS | 設定ファイルパス |
|---|---|
| Linux | `~/.local/share/promptnotes/config.json` |
| macOS | `~/Library/Application Support/promptnotes/config.json` |

```json
{
  "notes_dir": "/path/to/custom/notes/"
}
```

#### module:settings — 設定モジュール（フロントエンド）

| コンポーネント | 責務 |
|---|---|
| `SettingsModal.svelte` | 設定モーダルダイアログ |

- ヘッダーの ⚙️ ボタンから開く
- 保存ディレクトリの変更フォームを提供する
- ディレクトリ選択には Tauri の `dialog` プラグインを使用する
- ディレクトリ変更後は即座に新ディレクトリ内の `.md` ファイルをスキャンしフィードに反映する

### 2.3 Tauri IPC コマンド設計

フロントエンド↔Rust バックエンド間の通信はすべて Tauri IPC の `invoke` コマンドを経由する。フロントエンドからの直接的なファイルシステムアクセスは行わない。

| コマンド名 | 引数 | 戻り値 | 責務 |
|---|---|---|---|
| `create_note` | なし | `{ filename: string, path: string }` | 新規 `.md` ファイルを作成し、ファイル名とパスを返す |
| `save_note` | `{ filename: string, content: string }` | `NoteMetadata` | ノート内容をファイルに書き込み、更新後のメタデータ（`body_preview`, `tags` 含む）を返す（自動保存時にフロントエンドの一覧表示を即時更新するため） |
| `delete_note` | `{ filename: string }` | `{ success: boolean }` | ファイルをファイルシステムから削除する |
| `list_notes` | `{ from_date?: string, to_date?: string, tags?: string[] }` | `NoteMetadata[]` | フィルタ条件に合致するノートメタデータ一覧を返す |
| `read_note` | `{ filename: string }` | `{ content: string, tags: string[] }` | ファイルを読み込み、本文と frontmatter を返す |
| `search_notes` | `{ query: string }` | `NoteMetadata[]` | 全文検索（ファイル全走査）の結果を返す |
| `get_config` | なし | `{ notes_dir: string }` | 現在の設定を返す |
| `set_config` | `{ notes_dir: string }` | `{ success: boolean }` | 設定を更新する |
| `copy_to_clipboard` | `{ text: string }` | `{ success: boolean }` | テキストをシステムクリップボードにコピーする |

**`NoteMetadata` 型**:

```typescript
interface NoteMetadata {
  filename: string;   // "2026-04-13T143205.md"
  tags: string[];     // ["gpt", "coding"]
  preview: string;    // 本文先頭の切り詰めテキスト
  timestamp: string;  // ファイル名から抽出した ISO 形式タイムスタンプ
}
```

### 2.4 データフロー

#### 新規ノート作成フロー

```
1. ユーザー: Cmd+N / Ctrl+N または New ボタン押下
2. Frontend: invoke("create_note")
3. Backend:  ローカル時刻から YYYY-MM-DDTHHMMSS.md を生成
             空の frontmatter (tags: []) + 空本文でファイル作成
             { filename, path } を返却
4. Frontend: フィード最上部に編集モードの NoteCard を挿入
             CodeMirror 6 インスタンスを生成しフォーカス移動
```

#### 自動保存フロー

```
1. ユーザー: カード外クリック / 別カードクリック
2. Frontend: CodeMirror 6 から現在の内容を取得
             invoke("save_note", { filename, content })
3. Backend:  content をパースし frontmatter(tags) + 本文に分離
             ファイルに書き込み
             更新後の NoteMetadata を返却
4. Frontend: 返却された NoteMetadata で `notes` store のエントリを更新
             カードを表示モードに切替
             更新後の `body_preview` / `tags` が表示モードに反映される
```

#### 検索・フィルタフロー

```
1. ユーザー: 検索キーワード入力 / タグ選択 / 日付範囲指定
2. Frontend: invoke("search_notes", { query }) または
             invoke("list_notes", { from_date, to_date, tags })
3. Backend:  保存ディレクトリ内の全 .md ファイルを走査
             条件に合致するノートのメタデータ一覧を返却
4. Frontend: フィード表示を更新（降順ソート）
```

### 2.5 セキュリティとスコープ制御

- **ネットワークアクセス禁止**: `tauri.conf.json` の `allowlist` でネットワーク関連 API（`http`, `shell:open` 等）を無効化する。AI API エンドポイントへの通信を構造的に不可能にする。
- **ファイルシステムスコープ**: Tauri の `fs` プラグインのスコープを保存ディレクトリと設定ファイルパスに限定する。
- **入力検証**: Rust バックエンド側でファイル名のバリデーション（正規表現 `^\d{4}-\d{2}-\d{2}T\d{6}\.md$`）を実施し、パストラバーサル攻撃を防止する。
- **クリップボード**: Tauri の `clipboard-manager` プラグイン経由でのみアクセスし、フロントエンドの Clipboard API は使用しない。

### 2.6 プロジェクトディレクトリ構成

```
promptnotes/
├── src-tauri/
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── src/
│       ├── main.rs              # Tauri エントリポイント
│       ├── commands/
│       │   ├── mod.rs
│       │   ├── notes.rs         # create/save/delete/read/list/search コマンド
│       │   ├── config.rs        # get_config/set_config コマンド
│       │   └── clipboard.rs     # copy_to_clipboard コマンド
│       ├── storage/
│       │   ├── mod.rs
│       │   ├── file_manager.rs  # ファイル CRUD 操作
│       │   ├── frontmatter.rs   # YAML frontmatter パース/シリアライズ
│       │   └── search.rs        # 全文検索（ファイル全走査）
│       └── config/
│           └── mod.rs           # 設定ファイル読み書き
├── src/
│   ├── App.svelte               # ルートコンポーネント
│   ├── main.ts                  # Svelte エントリポイント
│   ├── lib/
│   │   ├── components/
│   │   │   ├── Header.svelte
│   │   │   ├── Feed.svelte
│   │   │   ├── NoteCard.svelte
│   │   │   ├── NoteEditor.svelte
│   │   │   ├── CopyButton.svelte
│   │   │   ├── DeleteButton.svelte
│   │   │   ├── SearchBar.svelte
│   │   │   ├── TagFilter.svelte
│   │   │   ├── DateFilter.svelte
│   │   │   └── SettingsModal.svelte
│   │   ├── stores/
│   │   │   ├── notes.ts         # ノート一覧の Svelte store
│   │   │   ├── filters.ts       # フィルタ状態の store
│   │   │   └── config.ts        # 設定の store
│   │   └── utils/
│   │       ├── tauri-commands.ts # invoke ラッパー（型安全）
│   │       ├── timestamp.ts     # ファイル名↔日時変換
│   │       └── frontmatter.ts   # frontmatter パースユーティリティ
│   └── styles/
│       └── global.css
├── tests/
│   └── e2e/                     # E2E テスト（Playwright）
├── package.json
├── svelte.config.js
├── vite.config.ts
└── tsconfig.json
```

### 2.7 ビルドとテスト

**開発ビルド**:

```bash
cargo tauri dev    # Rust バックエンド + Svelte フロントエンドの同時起動
```

**プロダクションビルド**:

```bash
cargo tauri build  # プラットフォーム固有のインストーラを生成
```

**E2E テスト**:

- フレームワーク: Playwright（Tauri WebView 接続）
- CI 環境: Linux では `xvfb-run` で仮想ディスプレイ上で実行
- テストヘルスチェック: WebView が ready 状態になるまで最大 30 秒待機
- 品質ゲート: 全テスト PASS 100%、SKIP 0 件、全 AC/FC 項目カバー

### 2.8 パフォーマンス目標

| 指標 | 閾値 |
|---|---|
| ショートカット押下からエディタ出現まで | 200ms 以内 |
| 全文検索レスポンスタイム（数十件規模） | 200ms 以内 |
| 自動保存完了（ファイル書き込み） | 100ms 以内 |
| アプリ起動からフィード表示まで | 2 秒以内 |

## 3. Open Questions

| ID | 質問 | 影響範囲 | 暫定方針 |
|---|---|---|---|
| OQ-001 | タグフィルタで複数タグ選択時の結合条件を OR にするか AND にするか | module:feed | 本設計では OR 条件を採用。ユーザーフィードバックにより AND 条件への切替または両方のサポートを検討する |
| OQ-002 | 削除操作に確認ダイアログを表示するか | module:editor | 誤削除防止の観点から確認ダイアログの表示を推奨するが、受入基準では言及がないためユーザーと合意が必要 |
| OQ-003 | 保存ディレクトリ変更時の既存ファイルの移動/コピー挙動 | module:settings, module:storage | 受入基準 AC-STOR-05 では「新しいディレクトリ内の既存 `.md` ファイルがフィードに表示される」とのみ規定。旧ディレクトリのファイルを自動移動するかは未定義のため、移動せず新ディレクトリの既存ファイルを読み込む方針とする |
| OQ-004 | ノート件数が 1,000 件を超えた場合の検索方式移行タイミング | module:feed | ADR-005 FU-002 に従い、レスポンスタイムが 200ms を超えた時点で tantivy ベースのインデックス検索への移行を検討する |
| OQ-005 | Tauri v2 安定版リリース時の `fs` プラグインおよび `clipboard-manager` プラグインの API 互換性 | framework:tauri | ADR-001 FU-004 に従い、API 変更の影響を評価して対応する |
