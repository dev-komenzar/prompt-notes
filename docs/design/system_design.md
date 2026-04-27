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
- **単一意味論**: ノート本文（body）の定義および frontmatter との境界は ADR-008 で固定され、Rust / TypeScript 両実装で往復冪等性（round-trip idempotency）が成立すること。

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
| body は frontmatter 閉じフェンス `---\n` とその直後の区切り `\n` を含まない。parse→reassemble の往復は冪等であること（ADR-008）。 | module:storage, module:editor | §2 ストレージ層（body 意味論）、§2.4 自動保存フロー、§2.8 パフォーマンス/不変条件 |

## 2. Architecture

### 2.1 レイヤー構成

PromptNotes は 3 層アーキテクチャで構成する。フロントエンド（Svelte）と Rust バックエンド間の通信はすべて Tauri IPC（`invoke` コマンド）を経由し、直接のファイルシステムアクセスをフロントエンドに許可しない。

```
┌─────────────────────────────────────────────────┐
│                 Tauri Shell (OS)                 │
│  ウィンドウ管理 / メニュー / グローバルショートカット       │
├─────────────────────────────────────────────────┤
│           Frontend Layer (WebView)              │
│  Svelte + Vite + CodeMirror 6                   │
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

フロントエンドはプレーン Svelte + Vite（`@sveltejs/vite-plugin-svelte`）で構成する。ADR-007 に従い SvelteKit は採用せず、`@sveltejs/kit` および `@sveltejs/adapter-static` を `package.json` に含めない。`src/main.ts` から `App.svelte` を手動マウントし、状態遷移はコンポーネント内部と Svelte ストアで管理する。`src/routes/` ディレクトリは設置しない。

### 2.2 モジュール構成

#### module:shell — Tauri シェル層

Tauri アプリケーションのエントリポイントおよびウィンドウ管理を担当する。

- **ウィンドウ設定**: 単一ウィンドウ、リサイズ可能、初期サイズ 1280×720
- **グローバルショートカット登録**: Cmd+N (macOS) / Ctrl+N (Linux) をアプリレベルで登録し、フロントエンドへイベントとして通知する
- **Tauri プラグイン**: `fs`（ファイルシステムアクセス）、`clipboard-manager`（クリップボード操作）、`dialog`（ディレクトリ選択）を使用する
- **allowlist 設定**: `tauri.conf.json` にてファイルシステム読み書きスコープを保存ディレクトリに限定する。ネットワークアクセスは一切許可しない（AI 呼び出し禁止の強制）。CSP の `connect-src` は `'none'` に設定する。

#### module:editor — エディタモジュール（フロントエンド）

Svelte コンポーネントとして実装する。エディタエンジンは CodeMirror 6 のみを使用し、Monaco 等への変更はリリース不可とする。

**コンポーネント構成**:

| コンポーネント | 責務 |
|---|---|
| `NoteCard.svelte` | 個別ノートカードの表示モード/編集モード切替 |
| `NoteEditor.svelte` | CodeMirror 6 インスタンスの管理 |
| `CopyButton.svelte` | 1 クリックでノート本文をクリップボードにコピー（表示モード・編集モード共通） |
| `DeleteButton.svelte` | ノート削除の実行（確認ダイアログなし即時削除） |

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
[編集モード] --Escキー--> 自動保存 --> [カードフォーカス状態]
[カードフォーカス状態] --Enterキー--> [編集モード]
[カードフォーカス状態] --Escキー--> [フォーカスなし状態]
[フォーカスなし状態] --↑/↓キー--> [カードフォーカス状態(フィード先頭)]
```

- 同時に編集モードになるカードは 1 つだけとする（シングルエディタインスタンス管理）
- カード外クリックまたは別カードクリック時に `invoke("save_note")` を呼び出して自動保存する
- 新規ノート作成時は即座に編集モードで最上部に挿入し、CodeMirror 6 の `.cm-content` にフォーカスを移動する
- ショートカット押下からエディタ出現まで 200ms 以内を目標とする

**カーソル初期位置**:

編集モードへの遷移時（新規作成・カードクリック・別カードへの切替・検索/フィルタ後のカードクリック）、カーソルは常に Body 末尾に配置する（`EditorView.state.selection.main.head === EditorView.state.doc.length`）。クリック位置へのカーソル配置（click-to-position）は行わない。カーソル位置は編集モードを抜けるたびに揮発し、再遷移時は毎回 `doc.length` にリセットする。

**表示モード**:

カードには以下を表示する。Markdown レンダリングは行わない。

- 本文のプレーンテキスト
- タグ一覧（frontmatter の `tags` から取得）
- タイムスタンプ（ファイル名から取得し、人間が読みやすい形式に変換）

**コピー機能（表示モード・編集モード共通）**:

- Copy ボタン（`aria-label="本文をコピー"`）は `NoteCard.svelte` 内の表示モード・編集モードのいずれでも常時描画される。表示 → 編集、編集 → 表示のモード遷移でアンマウントされず、AC-EDIT-06 / AC-EDIT-06b の要件および FC-EDIT-03 の否定条件を満たす。
- **表示モード**でのクリック時: ファイルに保存済みの本文（frontmatter を除く body）を Tauri の `clipboard-manager` プラグイン経由でシステムクリップボードにコピーする。
- **編集モード**でのクリック時: CodeMirror 6 の `EditorState.doc` から現在表示中の未保存を含む最新テキストを取得し、`src/editor/frontmatter.ts` の `extractBody` で frontmatter を除去した body のみをクリップボードにコピーする。
  - コピー操作は `save_note` を誘発しない（ファイル `mtime` は変化しない）。
  - コピー操作は CodeMirror 6 のフォーカス・テキスト選択範囲・Undo 履歴を変更しない（`EditorView.focus()` や `dispatch` を行わず、状態を読み取るのみ）。
  - コピー操作前後で編集モードが維持される（表示モードへのフォールバックは発生しない）。
- コピー成功時にボタンのアイコン/テキストを一時的に変化させてフィードバックを提供する（チェックマーク化・色変化等）。一定時間後に元の表示に戻る。
- Copy ボタンおよび Delete ボタンは、`getBoundingClientRect()` の幅・高さが 0 でなく、親要素の `overflow` やフレックス縮小で視覚的にクリップされず、中心座標で `document.elementFromPoint()` がボタン要素または子要素を返す CSS 制約を維持する。フィード内のノート件数が増えても本条件を損なわない（カードが縦方向に圧縮されない）レイアウト設計を行う。

**削除機能**:

- Delete ボタンクリック時は確認ダイアログを表示せず即時削除する（AC-EDIT-07 / AC-NAV-07）。
- 対応する `.md` ファイルをファイルシステムから削除し、カードをフィードから除去する。

**将来複数ページ構成が必要になった場合**:

ADR-007 に従い、ルーティングが必要になった時点で `svelte-spa-router`（ハッシュベース）を採用する。CodeMirror 6 インスタンスの destroy → recreate ライフサイクルは、ルート遷移時の Svelte `onDestroy` で明示的に扱う。

#### module:keyboard-nav — キーボードナビゲーションモジュール（フロントエンド）

ノートカード間のキーボード操作を管理する。カードフォーカス状態の管理は Svelte ストア（`stores/focus.ts`）で行い、フォーカス中のカードインデックスを保持する。

**カードフォーカス状態**:

カードフォーカス状態とは、編集モードでも表示モードでもない中間状態であり、フォーカスを持つカードを outline と box-shadow による強調で視覚的に示す。

**キーバインド一覧**:

| コンテキスト | キー | 動作 |
|---|---|---|
| 編集モード中 | Esc | 自動保存し表示モードに戻り、そのカードにカードフォーカスが残る |
| カードフォーカス状態 | Esc | フォーカスが外れ、フォーカスなし状態になる |
| カードフォーカス状態 | ↑ / ↓ | 隣のカードにフォーカス移動（↑: より新しいカード、↓: より古いカード） |
| カードフォーカス状態 | Enter | フォーカス中のカードが編集モードに入る |
| カードフォーカス状態 | `c` | 本文全体（frontmatter 除く）をクリップボードにコピー。Copy ボタンと同一フィードバック表示 |
| カードフォーカス状態 | `d` / Delete | 確認ダイアログなしで即時削除。フォーカスは下のカードに移動（下がなければ上、すべて削除済みならフォーカスなし状態） |
| フォーカスなし状態 | ↑ / ↓ | フィード先頭（最新）カードにフォーカス |

**境界動作**:

- 最上部カードで ↑ キー: 何も起きない（フォーカスは留まる）
- 最下部カードで ↓ キー: より古いノートをロードする（スクロール時の追加ロードと同じ挙動）。古いノートがなければ何も起きない。

**矢印キーの有効範囲制限**:

- 編集モード中（CodeMirror 6 アクティブ）: ↑/↓ は CodeMirror 内のカーソル移動として動作し、カード間移動は発生しない
- 検索バーにフォーカスがある: ↑/↓ はテキスト入力操作に使われ、カード間移動は発生しない

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

**ファイル構造（ADR-008 body 意味論）**:

```markdown
---
tags: [gpt, coding]
---

ノート本文がここに入る
```

- frontmatter に含まれるメタデータは `tags` のみ。作成日はファイル名から取得する。
- タグが空の場合は `tags: []` とする。
- **body の定義（ADR-008）**: ファイル内容のうち、frontmatter ブロック（開きフェンス `---\n` から閉じフェンス `---\n` まで）と、閉じフェンス直後の **区切り `\n` 1 つ** を除いた残り全体を body とする。
- **ファイル上のレイアウト**: 全体は `---\n<yaml>\n---\n\n<body>` の形式に正規化する。frontmatter ブロックと body の間の空行 1 行は **frontmatter 側の責務** であり、body には含めない。
- **body が空文字列の場合**: 正規化結果は `---\n<yaml>\n---\n\n` とする（末尾に空行 1 つを残す）。
- **往復冪等性（round-trip idempotency）**: 任意のファイル内容 `C` について `parse(C)` で得られる `(tags, body)` を `reassemble(tags, body)` に適用した結果 `C'` は、`parse(C').body == parse(C).body` を満たすこと。これを Rust / TypeScript 両実装の不変条件とする。

**body 意味論を扱う実装モジュール**:

| 実装 | ファイル | 責務 |
|---|---|---|
| Rust | `src-tauri/src/storage/frontmatter.rs` | `parse` は閉じフェンス `\n---\n` の直後に `\n` が存在してもそれを body に含めない。`reassemble` は `format!("{}\n{}", fm, body)` のように frontmatter（末尾 `\n` 付き）の後に区切り `\n` を 1 つ追加して body を連結する。 |
| TypeScript 本番 | `src/editor/frontmatter.ts` | `extractBody` は閉じフェンス直後の空行を `trimStart()` 相当で除去する。`generateNoteContent` は frontmatter と body の間に空行 1 行を挿入する。 |
| TypeScript スタブ | `tests/unit/frontmatter.ts` | `splitRaw` は閉じフェンス後の空行（`\n`）を body に含めない。`serializeFrontmatter` は frontmatter と body の間に空行 1 行を挿入する。 |

**デフォルト保存ディレクトリ**:

| OS | パス |
|---|---|
| Linux | `~/.local/share/com.promptnotes/notes/` |
| macOS | `~/Library/Application Support/com.promptnotes/notes/` |

デフォルトパスは ADR-010 で固定した Tauri bundle identifier `com.promptnotes` と `app_data_dir()` API から導出される。パス解決は `config/mod.rs` が `app_data_dir()` を唯一のエントリポイントとして使用し、`dirs::data_dir()` 等を用いた OS 別パスのハードコードは禁止する。初回起動時にディレクトリが存在しない場合は自動作成する。設定モーダルから任意のディレクトリに変更可能とし、変更フローは 2 段階確定（pick → apply）に従う（requirements §保存ディレクトリの変更 / `detail:storage_fileformat` §4.5 参照）。

**設定ファイル**:

アプリケーション設定（保存ディレクトリパス等）は Tauri の `app_data_dir` 配下に JSON ファイルとして保存する。

| OS | 設定ファイルパス |
|---|---|
| Linux | `~/.local/share/com.promptnotes/config.json` |
| macOS | `~/Library/Application Support/com.promptnotes/config.json` |

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
- 保存ディレクトリの変更フォームを 2 段階確定（pick → apply）で提供する
- ディレクトリ選択には Tauri の `dialog` プラグインを使用し、`pick_notes_directory` コマンド経由で OS ダイアログを起動する
- 参照で選んだパスは pending 状態として UI 内部で保持し、Apply ボタン押下時に `set_config` を呼ぶまで `config.json` は書き換わらない
- 既存ノート移動チェックボックス `[ ] 既存ノートを新ディレクトリへ移動する`（既定: オフ）を提供する。チェック時は Apply 押下前に二次確認ダイアログ「元のディレクトリから削除されます。元に戻せません。実行しますか？」を挟み、明示同意を得る
- `set_config` レスポンスの `remaining_in_old` が `>0` の場合は「古いディレクトリに N 件残りました」トーストを表示する
- 起動時にディレクトリが不在の場合、エラー種別（`ENOENT` / `EACCES` / `EIO`系 / `ENOTDIR`）に応じたメッセージと `[再試行] / [別のディレクトリを選ぶ] / [デフォルトに戻す]` の 3 択を表示する。デフォルトへの自動フォールバックは行わない（requirements 不可侵条項 4 参照）
- ディレクトリ変更後は新ディレクトリ内の `.md` ファイルをスキャンしフィードに反映する
- テーマ手動切り替え UI は設けない（AC-UI-07）

#### module:ui — UI レイアウト・テーマ（フロントエンド）

アプリ全体のレイアウト規約とテーマ対応を定義する。

**カードレイアウト**:

- カードの高さは本文量に応じて伸びる。カード内にスクロールバーを表示しない（`overflow: hidden` または `overflow: visible`）。表示モード・編集モードの両方で同じ挙動とする（AC-UI-04）。
- ノートカード間の区切りは空きマージンで表現する。デフォルトテーマでは `border`、`<hr>`、divider 等の罫線を使用しない（AC-UI-05）。

**テーマ対応**:

- OS の `prefers-color-scheme` メディアクエリに追従してライト・ダーク両テーマを自動切替する（AC-UI-06）。
- テーマを手動で切り替える UI 要素（トグルスイッチ、ドロップダウン等）は設けない（AC-UI-07）。
- シンタックスハイライト要素（見出し・太字・斜体・リスト・コードブロック・取り消し線等）はライト・ダーク両テーマで背景色と十分なコントラストを確保する。カーソルも両テーマで背景色と区別できること（AC-UI-08）。

**ヘッダー**: アプリ名テキストは表示しない。画面領域をノートに最大限使う（AC-UI-02）。

**アニメーション**:

- ノート作成時はフェードインアニメーションで新規カードを登場させる（AC-UI-09）。
- ノート削除時はフェードアウトアニメーションで対象カードを退場させる（AC-UI-09）。
- ノートの追加・削除後、残存カードは FLIP アニメーションで滑らかに位置移動する（AC-UI-09）。
- アニメーション実行中も操作をブロックしない。連続削除等の操作は即座に受け付け、クラッシュやレイアウト崩れを発生させない（AC-UI-10）。

### 2.3 Tauri IPC コマンド設計

フロントエンド↔Rust バックエンド間の通信はすべて Tauri IPC の `invoke` コマンドを経由する。フロントエンドからの直接的なファイルシステムアクセスは行わない。

| コマンド名 | 引数 | 戻り値 | 責務 |
|---|---|---|---|
| `create_note` | なし | `{ filename: string, path: string }` | 新規 `.md` ファイルを作成し、ファイル名とパスを返す |
| `save_note` | `{ filename: string, content: string }` | `NoteMetadata` | ノート内容をファイルに書き込み、更新後のメタデータ（`body_preview`, `tags` 含む）を返す（自動保存時にフロントエンドの一覧表示を即時更新するため） |
| `delete_note` | `{ filename: string }` | `{ success: boolean }` | ファイルをファイルシステムから削除する |
| `list_notes` | `{ from_date?: string, to_date?: string, tags?: string[] }` | `NoteMetadata[]` | フィルタ条件に合致するノートメタデータ一覧を返す |
| `read_note` | `{ filename: string }` | `{ content: string, tags: string[] }` | ファイルを読み込み、body（ADR-008 定義）と frontmatter を返す |
| `search_notes` | `{ query: string }` | `NoteMetadata[]` | 全文検索（ファイル全走査）の結果を返す |
| `get_config` | なし | `{ notes_dir: string }` | 現在の設定を返す |
| `pick_notes_directory` | なし | `{ path: string \| null }` | OS ネイティブダイアログを起動してディレクトリを選ばせ、canonical 化した絶対パスを返す。キャンセル時は `null`。検証失敗時は `ConfigError` を投げる。このコマンドは `config.json` を書き換えない（pending 候補の取得のみ） |
| `set_config` | `{ notes_dir: string, move_existing: boolean }` | `SetConfigResult` | 設定を 3 フェーズ（コピー → config atomic write → 旧削除）で更新する。`move_existing: false` の場合は既存ノートを一切触らない。`move_existing: true` の場合は `.md` のみ旧→新に移動（非 `.md` は対象外）。UI 側で移動前に二次確認ダイアログを挟むこと |
| `copy_to_clipboard` | `{ text: string }` | `{ success: boolean }` | テキストをシステムクリップボードにコピーする |

**`NoteMetadata` 型**:

```typescript
interface NoteMetadata {
  filename: string;   // "2026-04-13T143205.md"
  tags: string[];     // ["gpt", "coding"]
  preview: string;    // body 先頭の切り詰めテキスト（ADR-008 body 定義に準拠）
  timestamp: string;  // ファイル名から抽出した ISO 形式タイムスタンプ
}
```

**`SetConfigResult` 型**:

```typescript
interface SetConfigResult {
  notes_dir: string;         // 確定した新 notes_dir の絶対パス
  moved: number;             // Phase 3 で削除に成功したファイル数（move_existing: false なら 0）
  remaining_in_old: number;  // Phase 3 で削除失敗したファイル数（0 が正常、>0 なら UI で通知）
  old_dir: string | null;    // 旧ディレクトリに残骸があるときに UI 誘導用に返す
}
```

**`ConfigError` 種別（Tauri invoke の失敗時に返る）**:

| 種別 | 発生タイミング | UI 推奨対応 |
|---|---|---|
| `InvalidPath` | パスが絶対パス化/canonicalize できない | エラーメッセージ表示、`[別のディレクトリを選ぶ]` 誘導 |
| `NotADirectory` | 指定パスがディレクトリでない | エラーメッセージ表示、再選択促し |
| `NotWritable` | 書き込みプローブ失敗（権限・RO マウント・SELinux 等） | 権限確認を促すメッセージ |
| `ReservedDirectory` | config.json を保持するディレクトリと同一選択 | 「設定ファイルと同一ディレクトリは選べません」表示 |
| `SameDirectory` | 旧 == 新 | 無害として無視（UI は閉じる） |
| `MoveConflict(filenames)` | `move_existing: true` で新側にファイル名衝突 | 衝突ファイル名リストを表示、手動解消を促す |
| `CopyFailed(path, err)` | Phase 1 コピー失敗 | エラーメッセージ、新側ロールバック済み通知 |
| `ConfigWriteFailed(err)` | Phase 2 config.json 書き込み失敗 | エラーメッセージ、新側ロールバック済み通知 |

### 2.4 データフロー

#### 新規ノート作成フロー

```
1. ユーザー: Cmd+N / Ctrl+N または New ボタン押下
2. Frontend: invoke("create_note")
3. Backend:  ローカル時刻から YYYY-MM-DDTHHMMSS.md を生成
             空の frontmatter (tags: []) + 空本文でファイル作成
             （レイアウトは `---\ntags: []\n---\n\n`、ADR-008 準拠）
             { filename, path } を返却
4. Frontend: フィード最上部に編集モードの NoteCard を挿入
             CodeMirror 6 インスタンスを生成しフォーカス移動
```

#### 自動保存フロー

```
1. ユーザー: カード外クリック / 別カードクリック / Escキー押下
2. Frontend: CodeMirror 6 から現在の内容を取得
             invoke("save_note", { filename, content })
3. Backend:  content を storage/frontmatter.rs の parse で
             (tags, body) に分離（ADR-008 body 意味論）
             reassemble で `---\n<yaml>\n---\n\n<body>` に正規化し
             ファイルに書き込み
             更新後の NoteMetadata を返却
4. Frontend: 返却された NoteMetadata で `notes` store のエントリを更新
             カードを表示モードに切替（Escの場合はカードフォーカス状態へ）
             更新後の `preview` / `tags` が表示モードに反映される
```

#### コピーフロー（編集モード）

```
1. ユーザー: 編集モードのカードで Copy ボタン押下
2. Frontend: CodeMirror 6 の EditorState.doc から最新テキストを取得
             src/editor/frontmatter.ts の extractBody で body のみ抽出
             invoke("copy_to_clipboard", { text: body })
3. Backend:  clipboard-manager プラグイン経由でクリップボードに書き込む
4. Frontend: ボタンのフィードバック表示
             （フォーカス・選択範囲・Undo 履歴・mtime は不変）
```

#### コピーフロー（カードフォーカス状態 `c` キー）

```
1. ユーザー: カードフォーカス状態で `c` キー押下
2. Frontend: フォーカス中のノートの保存済み本文（frontmatter 除く body）を取得
             invoke("copy_to_clipboard", { text: body })
3. Backend:  clipboard-manager プラグイン経由でクリップボードに書き込む
4. Frontend: Copy ボタンと同一のフィードバック表示
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

- **ネットワークアクセス禁止**: `tauri.conf.json` の `allowlist` でネットワーク関連 API（`http`, `shell:open` 等）を無効化する。CSP の `connect-src` は `'none'` とし、AI API エンドポイントへの通信を構造的に不可能にする。
- **ファイルシステムスコープ**: Tauri の `fs` プラグインのスコープを保存ディレクトリと設定ファイルパスに限定する。
- **入力検証**: Rust バックエンド側でファイル名のバリデーション（正規表現 `^\d{4}-\d{2}-\d{2}T\d{6}\.md$`）を実施し、パストラバーサル攻撃を防止する。
- **クリップボード**: Tauri の `clipboard-manager` プラグイン経由でのみアクセスし、フロントエンドの Clipboard API は使用しない。
- **データローカリティ**: すべてのノートデータはユーザーのローカルディスク上に保持される。クラウド同期・外部送信・テレメトリは実装しない（AI 呼び出し禁止と合わせてプライバシーを担保する）。

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
│       │   ├── frontmatter.rs   # YAML frontmatter パース/シリアライズ（ADR-008 body 意味論）
│       │   └── search.rs        # 全文検索（ファイル全走査）
│       └── config/
│           └── mod.rs           # 設定ファイル読み書き
├── src/
│   ├── App.svelte               # ルートコンポーネント（main.ts から手動マウント）
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
│   │   │   ├── focus.ts         # カードフォーカス状態の store
│   │   │   └── config.ts        # 設定の store
│   │   ├── frontmatter.ts       # body 抽出/シリアライズ（ADR-008 TS 本番実装）
│   │   └── utils/
│   │       ├── tauri-commands.ts # invoke ラッパー（型安全）
│   │       └── timestamp.ts     # ファイル名↔日時変換
│   └── styles/
│       └── global.css
├── tests/
│   ├── unit/
│   │   ├── frontmatter.ts       # ADR-008 TS スタブ（splitRaw / serializeFrontmatter）
│   │   └── frontmatter.test.ts  # parse → serialize → parse の往復冪等性テスト
│   └── e2e/                     # E2E テスト（Playwright）
│       └── helpers/
│           ├── app-launch.ts
│           ├── note-factory.ts
│           ├── fs-assertions.ts
│           ├── editor-actions.ts
│           ├── clipboard.ts
│           ├── selectors.ts
│           └── keyboard-nav.ts
├── knip.json                    # 未使用コード検出設定（ADR-009）
├── package.json                 # @sveltejs/kit, @sveltejs/adapter-static は含めない。knip を devDependencies に含む
├── svelte.config.js             # vitePreprocess() のみ。SvelteKit アダプタ不使用
├── vite.config.ts               # @sveltejs/vite-plugin-svelte の svelte() のみ使用
└── tsconfig.json
```

`src/routes/` ディレクトリは設置しない（SvelteKit 規約との混同を避けるため、ADR-007 準拠）。

### 2.7 ビルドとテスト

**開発ビルド**:

```bash
cargo tauri dev    # Rust バックエンド + Svelte フロントエンドの同時起動
```

**プロダクションビルド**:

```bash
cargo tauri build  # プラットフォーム固有のインストーラを生成
```

**未使用コード検出（ADR-009）**:

```bash
npm run lint:unused  # knip による未使用変数・import・エクスポート・ファイル検出
```

- `knip.json` で `src/generated/**` を除外する（CoDD の `codd implement` が生成する中間成果物であり、`codd assemble` 前は本番コードから参照されないため）。
- Svelte / Vite / Vitest プラグインを有効化する。
- `src/routes/` は除外せず、knip が未使用として正しく検出する対象とする（ADR-007 で設置禁止が決定済み）。
- CI への組み込みは CI パイプライン整備時点で対応する（ADR-009 FU-007）。

**ユニットテスト（ADR-008 往復冪等性）**:

- Rust: `src-tauri/src/storage/frontmatter.rs` 末尾の `#[cfg(test)] mod tests` に `parse → reassemble → parse` の往復で `(tags, body)` が一致することを表明するテストを配置する。
- TypeScript（スタブ）: `tests/unit/frontmatter.test.ts` に `parseFrontmatter → serializeFrontmatter → parseFrontmatter` の往復冪等性テストを配置する。
- TypeScript（本番）: `src/editor/frontmatter.ts` の `generateNoteContent → extractBody → generateNoteContent` の擬似往復冪等性を同テストファイルで検証する。

**E2E テスト**:

- フレームワーク: Playwright（Tauri WebView 接続、Electron 統合モードまたは WebDriver 経由）
- CI 環境: Linux では `xvfb-run` で仮想ディスプレイ上で実行
- テストヘルスチェック: WebView が ready 状態になるまで最大 30 秒待機
- ドメイン分割: `editor` / `keyboard-nav` / `storage` / `feed` / `scope-guard` / `settings` / `ui-layout`
- テスト階層: API 統合テスト（Tauri IPC レベル、`tests/e2e/<domain>.spec.ts`）と ブラウザテスト（WebView DOM レベル、`tests/e2e/<domain>.browser.spec.ts`）
- 共有ヘルパー: `tests/e2e/helpers/` に `app-launch.ts`, `note-factory.ts`, `fs-assertions.ts`, `editor-actions.ts`, `clipboard.ts`, `selectors.ts`, `keyboard-nav.ts` を配置
- 品質ゲート: 全テスト PASS 100%、SKIP 0 件、全 AC-*/FC-* 項目カバー、Convention 1〜4 に該当するリリースブロッキング項目 PASS

### 2.8 パフォーマンス目標と不変条件

| 指標 | 閾値 |
|---|---|
| ショートカット押下からエディタ出現まで | 200ms 以内 |
| 全文検索レスポンスタイム（数十件規模） | 200ms 以内 |
| 自動保存完了（ファイル書き込み） | 100ms 以内 |
| アプリ起動からフィード表示まで | 2 秒以内 |

**不変条件**:

- 任意のファイル内容 `C` について、`parse(C) → reassemble → parse` を **N 回繰り返しても** `body` の先頭に改行 `\n` が累積しない（ADR-008 / AC-STOR-06）。
- Copy ボタンは `NoteCard.svelte` のマウントライフサイクル全体にわたり DOM 上に存在し、モード遷移時の一時的なアンマウントを含め描画されない瞬間が存在しない（FC-EDIT-03）。
- 編集モード中の Copy 操作はファイル `mtime` を変化させない（AC-EDIT-06b）。

## 3. Open Questions

| ID | 質問 | 影響範囲 | 暫定方針 |
|---|---|---|---|
| OQ-001 | タグフィルタで複数タグ選択時の結合条件を OR にするか AND にするか | module:feed | 本設計では OR 条件を採用。ユーザーフィードバックにより AND 条件への切替または両方のサポートを検討する |
| OQ-003 | 保存ディレクトリ変更時の既存ファイルの移動/コピー挙動 | module:settings, module:storage | 受入基準 AC-STOR-05 では「新しいディレクトリ内の既存 `.md` ファイルがフィードに表示される」とのみ規定。旧ディレクトリのファイルを自動移動するかは未定義のため、移動せず新ディレクトリの既存ファイルを読み込む方針とする |
| OQ-004 | ノート件数が 1,000 件を超えた場合の検索方式移行タイミング | module:feed | ADR-005 FU-002 に従い、レスポンスタイムが 200ms を超えた時点で tantivy ベースのインデックス検索への移行を検討する |
| OQ-005 | Tauri v2 安定版リリース時の `fs` プラグインおよび `clipboard-manager` プラグインの API 互換性 | framework:tauri | ADR-001 FU-004 に従い、API 変更の影響を評価して対応する |
| OQ-006 | 複数ページ構成が必要になった場合のルーティングライブラリ選定 | module:shell, module:editor | ADR-007 FU-006 に従い、原則として `svelte-spa-router`（ハッシュベース）を採用する。SvelteKit 採用は「ファイルベースルーティングの DX が本質的に必要」または「Web 版併売で SSR/プリレンダリングが必要」と判断された場合のみ、新規 ADR として起草する |
