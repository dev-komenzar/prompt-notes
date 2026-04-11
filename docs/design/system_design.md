---
codd:
  node_id: design:system-design
  type: design
  modules: [lib]
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

PromptNotes は、AI へ渡すプロンプトを素早く書き溜めるためのローカルデスクトップノートアプリである。タイトル不要・本文即記録・グリッド振り返りをコンセプトとし、すべてのデータをローカル `.md` ファイルとして管理する。

### コンセプト

ユーザーはターミナルや IDE で AI を利用する際のプロンプトを PromptNotes に蓄積し、1 クリックでクリップボードにコピーして再利用する。AI 呼び出し・クラウド同期・モバイル対応は意図的にスコープ外とし、軽量性とプライバシーを最優先する。

### 対象プラットフォーム

- **Linux** — バイナリ直接ダウンロード、Flatpak（Flathub）、NixOS パッケージ
- **macOS** — バイナリ直接ダウンロード、Homebrew Cask
- **Windows** — 将来対応。現時点ではスコープ外。

### Non-negotiable conventions への適合

本設計書は以下のリリース不可制約に準拠する。すべてのアーキテクチャ決定はこれらを前提とし、違反する設計変更はリリースブロッカーとなる。

| 制約 | 対象 | 本設計書での反映箇所 |
|---|---|---|
| Tauri（Rust + WebView）アーキテクチャ必須。フロントエンド↔Rust バックエンド間は Tauri IPC 経由。 | `framework:tauri`, `module:shell` | アーキテクチャ全体が Tauri v2 を前提として設計。IPC コマンド定義を「バックエンド層」に明示。 |
| データはローカル `.md` ファイルのみ。クラウド同期・DB 利用は禁止。AI 呼び出し機能の実装も禁止。 | `module:storage` | ストレージ層でファイルシステム直接操作のみを規定。SQLite・Tantivy 等のデータベース/インデックスエンジンを排除。ネットワーク通信を行う機能を一切含まない。 |
| Linux・macOS 対応必須。Windows は将来対応としスコープ外。 | `platform:linux`, `platform:macos` | ビルド・配布パイプラインを Linux/macOS の 2 プラットフォームで設計。デフォルトパスを OS ごとに定義。 |
| Cmd+N / Ctrl+N 即時新規ノート作成および 1 クリックコピーボタンはコア UX であり、未実装ならリリース不可。新規ノート編集中でも Cmd+N / Ctrl+N で追加の新規ノートを作成できる必要がある。 | `module:editor` | エディタモジュール設計にキーバインド処理とコピーボタンコンポーネントを必須要素として含める。`Cmd+N` ハンドラは現在の画面状態に依存せずグローバルに動作する。 |
| エディタ画面は過去のノートをインラインリストとして表示し、選択した過去ノートをその場で編集できる。 | `module:editor` | エディタモジュールに「ノートフィード（scrollable list of past notes）」を必須コンポーネントとして含める。各ノートブロックが frontmatter 領域と本文領域を持ち、独立した自動保存を行う。 |
| CodeMirror 6 必須。タイトル入力欄禁止・Markdown プレビュー（レンダリング）禁止。 | `module:editor` | エディタエンジンを CodeMirror 6 に固定。タイトル入力欄およびレンダリング機能を禁止事項として明記。 |
| ファイル名規則 `YYYY-MM-DDTHHMMSS.md` および自動保存は確定済み。 | `module:storage` | ストレージ層のファイル命名ロジックとオートセーブ機構を必須として設計。 |
| デフォルト直近 7 日間フィルタ・タグ/日付フィルタ・全文検索は必須機能。 | `module:grid` | グリッドビューモジュールにフィルタリングパイプラインと全走査検索を組み込む。 |

### プライバシー・データ取り扱い

すべてのノートデータはユーザーのローカルファイルシステムにのみ保存される。PromptNotes はネットワーク通信を一切行わない。クラウド同期機能は Non-negotiable convention により禁止されており、外部サーバーへのデータ送信経路は設計上存在しない。ユーザーが Git 等の外部ツールで同期を行うことは妨げない。

---

## 2. Architecture

### 2.1 レイヤー構成

PromptNotes は Tauri v2 の標準アーキテクチャに従い、3 層で構成する。

```
┌──────────────────────────────────────────────────┐
│  フロントエンド層（Svelte + CodeMirror 6）        │
│  OS ネイティブ WebView 上でレンダリング           │
├──────────────────────────────────────────────────┤
│  Tauri IPC 層                                    │
│  invoke() / listen() によるコマンド・イベント通信  │
├──────────────────────────────────────────────────┤
│  バックエンド層（Rust）                           │
│  ファイル I/O・パス解決・検索・設定管理            │
└──────────────────────────────────────────────────┘
       │
       ▼
  ローカルファイルシステム（.md ファイル群）
```

**フロントエンド↔バックエンド間の通信はすべて Tauri IPC 経由で行う。** フロントエンドから直接ファイルシステムにアクセスすることは行わず、Rust 側の `#[tauri::command]` で定義されたコマンドを `invoke()` で呼び出す。

### 2.2 モジュール構成

#### module:shell — Tauri アプリケーションシェル

Tauri v2 アプリケーションのエントリポイント。ウィンドウ管理、IPC ハンドラ登録、アプリケーションライフサイクルを管理する。

- **配置**: `src-tauri/src/main.rs` および `src-tauri/src/lib.rs`
- **責務**:
  - Tauri `Builder` によるアプリ初期化
  - `#[tauri::command]` ハンドラの登録
  - ウィンドウ作成（単一ウィンドウ）
  - グローバルキーボードショートカット（Cmd+N / Ctrl+N）のフォワーディング

#### module:editor — エディタ画面

CodeMirror 6 ベースのノート編集画面。エディタ画面は **ノートフィード**（feed of notes）として機能し、現在編集中のノートに加えて過去のノートをスクロール可能なリストとして同時に表示する。

- **配置**: `src/lib/components/editor/` 配下の Svelte コンポーネント群
- **エディタエンジン**: CodeMirror 6（変更不可）
  - Markdown シンタックスハイライト: `@codemirror/lang-markdown` パッケージ
  - プレーンテキスト表示のみ。Markdown レンダリング（`<h1>`, `<strong>` 等の HTML 要素生成）は禁止。
- **画面構成**:
  - **ノートフィード**: エディタ画面の中心領域。複数のノートブロックを縦方向にスクロール可能なリストとして表示する。各ノートブロックは独立した frontmatter 領域（タグ入力）と本文エディタ領域（CodeMirror 6 インスタンス）を持ち、クリックまたはフォーカスでその場編集が可能。新しいノートほど先頭に表示される。初期表示件数とスクロール/ページング方針は詳細設計で定義する。
  - **frontmatter 領域**（各ノートブロック内）: タグ入力 UI。背景色を本文領域と異なる色に設定し視覚的に区別する。YAML `tags` フィールドのみを保持。
  - **本文エディタ領域**: CodeMirror 6 インスタンス。タイトル入力欄（`<input>` / `<textarea>`）は設置禁止。
  - **コピーボタン**: 各ノートブロックに 1 クリックでそのノート本文（frontmatter を除く）をクリップボード API 経由でコピーするボタンを設置。コア UX であり必須。
- **キーバインド**:
  - `Cmd+N`（macOS）/ `Ctrl+N`（Linux）: 新規ノート作成。Rust バックエンドに `create_note` コマンドを発行し、作成完了後に新規ノートをフィード先頭に挿入してフォーカスを移動する。**新規ノート編集中であっても、現在の画面状態に関係なく常に追加の新規ノートを作成できる**（再入可能）。
- **自動保存**: ユーザーの明示的な保存操作は不要。フィード内の各ノートブロックは独立したデバウンスキューを持ち、テキスト変更イベントをデバウンスして該当ノートの `save_note` コマンドを自動発行する。あるノートを編集中に別のノートへフォーカスを移しても、編集済みノートの保存は独立して完了する。

#### module:grid — グリッドビュー

ノート一覧の表示・検索・フィルタリング画面。

- **配置**: `src/lib/components/grid/` 配下の Svelte コンポーネント群
- **レイアウト**: Pinterest スタイルの可変高カード（Masonry レイアウト）
- **フィルタリングパイプライン**:
  1. **デフォルトフィルタ**: 直近 7 日間のノートのみ表示（初期状態）。7 日前のノートは含まれ、8 日前は含まれない。
  2. **タグフィルタ**: frontmatter の `tags` フィールドに基づくフィルタリング。
  3. **日付フィルタ**: ファイル名のタイムスタンプに基づく日付範囲指定。
  4. **全文検索**: ファイル全走査方式。Rust バックエンドの `search_notes` コマンドで実行。
- **性能目標**: 直近 7 日間のノート（数十件規模）に対する検索は 100ms 以内で完了。
- **カード操作**: カードクリックでエディタ画面に遷移し、該当ノートの内容を表示。

#### module:storage — ストレージ

ローカルファイルシステム上の `.md` ファイル管理。データベースおよびクラウドストレージの利用は禁止。

- **配置**: `src-tauri/src/storage/` 配下の Rust モジュール群
- **ファイル名規則**: `YYYY-MM-DDTHHMMSS.md`（例: `2026-04-04T143205.md`）。ノート作成時刻で確定し、以降変更しない。正規表現: `^\d{4}-\d{2}-\d{2}T\d{6}\.md$`
- **ファイル構造**:
  ```
  ---
  tags: [gpt, coding]
  ---

  本文をここに書く...
  ```
  - frontmatter は YAML 形式。`tags` キーのみ。`tags` 以外のメタデータフィールドの自動挿入は禁止。
  - 作成日はファイル名から取得する（frontmatter に `date` 等を持たない）。
- **デフォルト保存ディレクトリ**:
  - Linux: `~/.local/share/promptnotes/notes/`
  - macOS: `~/Library/Application Support/promptnotes/notes/`
- **ディレクトリ変更**: 設定画面から任意のパスに変更可能。Obsidian vault 内のサブディレクトリを指定する運用を想定。
- **検索方式**: ファイル全走査。インデックスエンジン（Tantivy、SQLite FTS 等）は導入しない。

#### module:settings — 設定画面

- **配置**: `src/lib/components/settings/` 配下の Svelte コンポーネント
- **設定項目**: 保存ディレクトリパスの変更
- **永続化**: 設定値は Tauri の標準設定ファイルパスに JSON 形式で保存（ノートデータとは別管理）

### 2.3 Tauri IPC コマンド設計

フロントエンドから Rust バックエンドへの呼び出しは以下の `#[tauri::command]` で定義する。コマンド定義は `src-tauri/src/` 配下に配置する。

| コマンド名 | 引数 | 戻り値 | 責務 |
|---|---|---|---|
| `create_note` | なし | `{ filename: string, path: string }` | 新規 `.md` ファイルを作成。ファイル名はコマンド実行時刻から生成。 |
| `save_note` | `{ filename: string, frontmatter: { tags: string[] }, body: string }` | `{ success: bool }` | 指定ノートの内容を上書き保存。自動保存から呼び出される。 |
| `read_note` | `{ filename: string }` | `{ frontmatter: { tags: string[] }, body: string }` | 指定ノートの内容を読み取り。 |
| `list_notes` | `{ days: number?, tags: string[]?, date_from: string?, date_to: string? }` | `{ notes: NoteMetadata[] }` | フィルタ条件に合致するノート一覧を返却。デフォルト `days=7`。 |
| `search_notes` | `{ query: string, days: number?, tags: string[]? }` | `{ notes: NoteMetadata[] }` | 全文検索。ファイル全走査で本文にクエリ文字列を含むノートを返却。 |
| `delete_note` | `{ filename: string }` | `{ success: bool }` | 指定ノートを削除。 |
| `get_settings` | なし | `{ notes_dir: string }` | 現在の設定を取得。 |
| `update_settings` | `{ notes_dir: string }` | `{ success: bool }` | 設定を更新・永続化。 |

`NoteMetadata` の構造:

```typescript
interface NoteMetadata {
  filename: string;      // e.g. "2026-04-04T143205.md"
  tags: string[];        // e.g. ["gpt", "coding"]
  body_preview: string;  // 本文の先頭N文字（カード表示用）
  created_at: string;    // ファイル名から抽出した ISO 8601 日時
}
```

### 2.4 フロントエンドルーティング

Svelte のファイルベースルーティング（`src/routes/`）で以下の画面を構成する。

| パス | 画面 | 対応モジュール |
|---|---|---|
| `/` | グリッドビュー（ノート一覧、Pinterest レイアウト） | `module:grid` |
| `/edit` | エディタ画面（ノートフィード。過去ノートのインラインリストを含む） | `module:editor` |
| `/edit?focus=:filename` | エディタ画面で指定ノートをフィード先頭付近へスクロールしフォーカス | `module:editor` |
| `/settings` | 設定画面 | `module:settings` |

エディタ画面はフィード全体を表示する単一ルートであり、個別ノートごとに異なるルートを持たない。`focus` クエリパラメータで初期フォーカス対象ノートを指定する（グリッドビューからの遷移時に使用）。

### 2.5 画面遷移フロー

```
グリッドビュー (/)
  │
  ├── カードクリック ──→ エディタ画面 (/edit?focus=:filename)
  │                         │
  │                         ├── フィード内の任意のノートを選択 ──→ その場でインライン編集
  │                         ├── Cmd+N / Ctrl+N ──→ 新規ノート作成 → フィード先頭に挿入しフォーカス
  │                         │                          （新規ノート編集中も再入可能）
  │                         └── コピーボタン ──→ 該当ノート本文をクリップボードにコピー
  │
  ├── Cmd+N / Ctrl+N ──→ 新規ノート作成 → エディタ画面 (/edit) の先頭に挿入しフォーカス
  │
  ├── フィルタ操作 ──→ グリッドビュー更新（同一画面）
  │
  └── 設定アイコン ──→ 設定画面 (/settings)
                          └── 保存ディレクトリ変更 → 永続化
```

`Cmd+N` / `Ctrl+N` ハンドラはグリッドビュー・エディタ画面（新規ノート編集中を含む）・設定画面のいずれからでも同一の動作（新規ノート作成 → エディタ画面へ遷移 → 新規ノートにフォーカス）を提供する。既存の未保存編集内容は自動保存デバウンスにより保持される。

### 2.6 自動保存シーケンス

1. ユーザーが CodeMirror 6 エディタで本文またはタグを編集する。
2. フロントエンドが変更イベントをデバウンス（待機時間の具体値はフロントエンド実装で決定、推奨 500ms〜1000ms）。
3. デバウンス完了後、`invoke('save_note', { filename, frontmatter, body })` を Tauri IPC 経由で発行。
4. Rust バックエンドがファイルをアトミックに書き込み（一時ファイル書き込み → rename）。
5. 成功/失敗をフロントエンドに返却。

### 2.7 ビルド・配布パイプライン

CI/CD パイプラインは GitHub Actions で構築し、Linux および macOS の 2 プラットフォーム向けに成果物を生成する。

| プラットフォーム | 配布形式 | ビルドターゲット |
|---|---|---|
| Linux | バイナリ直接ダウンロード（`.deb`, `.AppImage`） | `tauri build` |
| Linux | Flatpak（Flathub） | `com.promptnotes.PromptNotes.yml` マニフェスト |
| Linux | NixOS パッケージ | `flake.nix` パッケージビルド定義 |
| macOS | バイナリ直接ダウンロード（`.dmg`） | `tauri build` + notarization |
| macOS | Homebrew Cask | `homebrew-cask` フォーミュラ |

### 2.8 開発環境

- **環境構築**: `direnv` + `nix flake`。`direnv allow` 後に Rust ツールチェイン、Node.js、Tauri CLI 等がすべて利用可能になる。
- **開発サーバー**: `tauri dev`（`http://localhost:1420`）で Svelte 開発サーバーと Tauri WebView を同時起動。
- **テストフレームワーク**: Playwright による E2E テスト。API インテグレーションテストとブラウザテストの 2 レベルに分離。テストファイルは `tests/e2e/` 配下に配置。

### 2.9 スコープ外機能の排除（スコープガード）

以下の機能は設計上排除されており、実装した場合はリリースブロッカーとなる。

| 排除機能 | 理由 | 検出方法 |
|---|---|---|
| AI 呼び出し機能 | プロンプト執筆特化。AI 実行はターミナル/IDE 側の責務。 | `scope-guard.browser.spec.ts` で外部 API 呼び出しの不在を検証 |
| クラウド同期 | NC-3 制約によりローカル保存のみ。 | ネットワーク通信の不在を検証 |
| タイトル入力欄 | 即時記録コンセプト。タイトル不要。 | DOM にタイトル専用 `input` / `textarea` が存在しないことを検証 |
| Markdown プレビュー（レンダリング） | プレーンテキスト寄りの編集体験を優先。 | レンダリング済み HTML 要素が本文領域に存在しないことを検証 |
| モバイル対応 | デスクトップ（Linux / macOS）がターゲット。 | — |
| データベース利用（SQLite 等） | `.md` ファイルのみ。 | 依存クレート・パッケージのレビュー |

### 2.10 非機能要件

| 項目 | 基準 |
|---|---|
| 全文検索応答時間 | 直近 7 日間のノート（数十件規模）に対して 100ms 以内 |
| 自動保存 | ユーザーの明示的な保存操作不要。テキスト変更後のデバウンス経過後に自動実行 |
| プラットフォーム | Linux・macOS で起動・動作すること |
| バイナリサイズ | Tauri 採用により Electron 比で大幅に軽量であること |
| プライバシー | ネットワーク通信を一切行わない。すべてのデータはローカルファイルシステムにのみ存在 |

---

## 3. Open Questions

| ID | 質問 | 影響範囲 | 解決トリガー |
|---|---|---|---|
| OQ-001 | 自動保存のデバウンス時間の最適値は何 ms か？ 500ms と 1000ms のどちらがユーザー体験として適切か。 | `module:editor` | ユーザーテスト実施時 |
| OQ-002 | グリッドビューのカードに表示する本文プレビューの文字数上限をいくつにするか。 | `module:grid` | UI プロトタイプ作成時 |
| OQ-003 | ノート削除機能の UI をどこに配置するか（エディタ画面内のメニュー、グリッドビューのコンテキストメニュー、あるいは両方）。 | `module:editor`, `module:grid` | UI 設計レビュー時 |
| OQ-004 | ノート件数が数千件規模に達した場合、ファイル全走査の応答時間が 100ms を超える可能性がある。Tantivy 等の Rust ネイティブ全文検索エンジン導入をどの時点で判断するか。 | `module:storage`, `module:grid` | 全走査で体感遅延が発生した時点（ADR FU-002） |
| OQ-005 | Flatpak マニフェスト・Homebrew Cask フォーミュラ・NixOS パッケージの初回作成をどのマイルストーンで行うか。 | ビルド・配布 | Linux/macOS 配布開始時（ADR FU-004〜FU-006） |
| OQ-006 | 設定画面で保存ディレクトリを変更した場合、既存ノートの移動は行うか、新規ノートのみ新ディレクトリに作成するか。 | `module:settings`, `module:storage` | 詳細設計時 |
| OQ-007 | エディタ画面のノートフィードが最初に読み込む件数および追加読み込み方式（無限スクロール / ページング / 仮想スクロール）をどう設計するか。数十件規模を想定するが、仮想スクロールが必要となる件数閾値を定義する必要がある。 | `module:editor`, `module:storage` | エディタ詳細設計時 |
