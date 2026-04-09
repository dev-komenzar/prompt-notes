---
codd:
  node_id: governance:adr_tech_stack
  type: governance
  depends_on:
  - id: req:promptnotes-requirements
    relation: derives_from
    semantic: governance
  depended_by:
  - id: design:system-design
    relation: constrained_by
    semantic: governance
  conventions:
  - targets:
    - framework:tauri
    reason: Tauri（Rust + WebView）は確定済みフレームワーク。Electron等への変更はリリース不可。
  - targets:
    - module:editor
    reason: CodeMirror 6 は確定済みエディタエンジン。Monaco等への変更はリリース不可。
  - targets:
    - module:storage
    reason: ローカル .md ファイル保存は確定済み。DB・クラウド保存は禁止。
  modules:
  - editor
  - storage
  - shell
---

# ADR: Technology Stack Decisions

## 1. Overview

本ドキュメントは PromptNotes の技術スタック選定に関するアーキテクチャ決定記録（ADR）である。PromptNotes は AI へ渡すプロンプトを素早く書き溜めるためのローカルノートアプリであり、タイトル不要・本文即記録・グリッド振り返りをコンセプトとする。AI 呼び出し機能やクラウド同期は持たない。

技術スタックの各決定は以下の **リリース不可制約（Non-negotiable conventions）** に従う。

| 制約 ID | 対象 | 内容 |
|---|---|---|
| NC-1 | `framework:tauri` | Tauri（Rust + WebView）は確定済みフレームワーク。Electron 等への変更はリリース不可。 |
| NC-2 | `module:editor` | CodeMirror 6 は確定済みエディタエンジン。Monaco 等への変更はリリース不可。 |
| NC-3 | `module:storage` | ローカル `.md` ファイル保存は確定済み。DB・クラウド保存は禁止。 |

本 ADR のすべての決定はこれら 3 つの制約を前提とし、各決定ログにおいて準拠を明示する。

---

## 2. Decision Log

### ADR-001: アプリケーションフレームワーク — Tauri（Rust + WebView）

- **ステータス**: 確定（変更不可）
- **制約準拠**: NC-1 に準拠。Electron・Neutralino・Wails 等への変更はリリースブロッカーとなる。
- **決定内容**: デスクトップアプリケーションシェルとして Tauri v2 を採用する。バックエンドロジックは Rust で記述し、UI は OS ネイティブ WebView 上でレンダリングする。
- **採用理由**:
  - テキストエディタは IME・カーソル・コピー操作など入力周りが複雑であり、WebView に委ねることで実装リスクを低減できる。
  - Electron と比較してバイナリサイズとメモリフットプリントが大幅に小さい。
  - Ghostty 方式（Zig + Native UI）の二重 UI 実装よりも現実的である。
  - Flatpak（Flathub）および Homebrew Cask との配布パイプライン互換性が高い。
- **ターゲット OS**: Linux、macOS。Windows は将来対応とし、現時点ではスコープ外。
- **配布方式**:
  - Linux: バイナリ直接ダウンロード、Flatpak（Flathub）、NixOS
  - macOS: バイナリ直接ダウンロード、Homebrew Cask

### ADR-002: フロントエンドフレームワーク — Svelte

- **ステータス**: 確定
- **決定内容**: Tauri WebView 上の UI フレームワークとして Svelte を採用する。
- **採用理由**:
  - Svelte はコンパイル型フレームワークであり、ランタイムオーバーヘッドが React と比較して小さい。
  - バンドルサイズの削減により Tauri アプリ全体の軽量性方針と整合する。
- **却下した代替案**: React — 仮想 DOM ランタイムが不要なコンパイル型の Svelte を優先。

### ADR-003: エディタエンジン — CodeMirror 6

- **ステータス**: 確定（変更不可）
- **制約準拠**: NC-2 に準拠。Monaco Editor 等への変更はリリースブロッカーとなる。
- **決定内容**: ノート編集の中核エンジンとして CodeMirror 6 を採用する。Markdown シンタックスハイライトは公式 `@codemirror/lang-markdown` パッケージを使用する。レンダリング（プレビュー）は行わず、プレーンテキスト寄りの表示とする。
- **採用理由**:
  - バンドルサイズが軽量（Monaco 比で 1/10 以下）。
  - Obsidian と同一エンジンであり、ユーザーの操作感と一致する。
  - frontmatter 領域だけ背景色を変えるなどのカスタマイズが拡張 API で容易に実現できる。
  - 公式 Markdown シンタックスハイライトパッケージが提供されている。
- **エディタ画面の要件との対応**:
  - タイトル入力欄なし。本文のみの編集体験を提供。
  - 画面上部に frontmatter（タグ入力）領域を設置し、背景色で視覚的に区別する。
  - `Cmd+N` / `Ctrl+N` キーバインドで即座に新規ノートを作成しフォーカス移動。
  - 1 クリックコピーボタンで本文全体をクリップボードにコピー（核心 UX）。
  - 保存は自動。ファイル名はノート作成時のタイムスタンプ `YYYY-MM-DDTHHMMSS.md` で確定。

### ADR-004: データ保存 — ローカル .md ファイル

- **ステータス**: 確定（変更不可）
- **制約準拠**: NC-3 に準拠。SQLite 等のデータベース保存およびクラウド保存は禁止であり、導入はリリースブロッカーとなる。
- **決定内容**: すべてのノートデータをローカルファイルシステム上の `.md` ファイルとして保存する。
- **ファイル名規則**: `YYYY-MM-DDTHHMMSS.md`（例: `2026-04-04T143205.md`）。タイムスタンプのみでタイトルは含まない。
- **ファイル構造**:
  ```
  ---
  tags: [gpt, coding]
  ---

  本文をここに書く...
  ```
  - frontmatter は YAML 形式。メタデータは `tags` のみ。作成日はファイル名から取得する。
- **デフォルト保存ディレクトリ**:
  - Linux: `~/.local/share/promptnotes/notes/`
  - macOS: `~/Library/Application Support/promptnotes/notes/`
  - 設定画面から任意のディレクトリに変更可能。Obsidian vault 内のサブディレクトリを指定する運用を想定。
- **採用理由**:
  - Obsidian や VSCode など他ツールでそのまま開ける相互運用性。
  - Obsidian vault 内の 1 ディレクトリを本アプリに割り当てる使い方が可能。
  - Git で自然にバージョン管理できる。
  - 検索速度の遅さは問題にならない（1 週間分で数十件程度）。
- **プライバシー・データ取り扱い**: すべてのデータはユーザーのローカルファイルシステムにのみ保存される。ネットワーク送信は一切行わない。クラウド同期機能はスコープ外であり、NC-3 制約により禁止されている。

### ADR-005: 検索方式 — ファイル全走査

- **ステータス**: 確定
- **決定内容**: グリッドビューにおける全文検索はファイル全走査で実装する。専用のインデックスエンジン（Tantivy、SQLite FTS 等）は導入しない。
- **採用理由**: 想定ノート件数が週あたり数十件程度であり、全走査で十分な応答性能が得られる。
- **性能閾値**: デフォルトフィルタである直近 7 日間のノート（数十件規模）に対する検索は体感遅延なし（100ms 以内）で完了することを目標とする。
- **グリッドビューの要件との対応**:
  - Pinterest スタイルの可変高カードによるレイアウト。
  - デフォルトフィルタは直近 7 日間のノートのみ表示。
  - タグ・日付によるフィルタリング機能。
  - カードクリックでエディタ画面に遷移。

### ADR-006: 開発環境 — direnv + Nix Flake

- **ステータス**: 確定
- **決定内容**: ローカル開発環境の構築は `direnv` + `nix flake` で行う。手順は `README.md` の「Local Development」セクションに記載する。
- **採用理由**: Nix により Rust ツールチェイン、Node.js、Tauri CLI 等の依存関係を再現可能な形で管理できる。

### ADR-007: スコープ外の明示的排除

以下の機能は意図的にスコープ外とし、実装しない。

| 除外項目 | 理由 |
|---|---|
| AI 呼び出し機能 | プロンプト執筆特化アプリであり、AI 実行はターミナル/IDE 側の責務 |
| クラウド同期 | NC-3 制約によりローカル保存のみ。Git による同期をユーザーに委ねる |
| タイトル | 即時記録のコンセプトに基づきタイトル入力を排除 |
| Markdown プレビュー（レンダリング） | プレーンテキスト寄りの編集体験を優先 |
| モバイル対応 | デスクトップ（Linux / macOS）をターゲットとする |

---

## 3. Follow-ups

| ID | 項目 | 内容 | トリガー |
|---|---|---|---|
| FU-001 | Windows 対応 | Tauri は Windows をサポートしているため技術的障壁は低いが、テスト・配布パイプライン（winget / MSIX 等）の整備が必要。 | ユーザー需要の確認後 |
| FU-002 | 検索インデックス導入の評価 | ノート件数が数千件規模に達した場合、ファイル全走査の応答時間が 100ms を超える可能性がある。Tantivy 等の Rust ネイティブ全文検索エンジンの導入を評価する。 | 全走査で体感遅延が発生した時点 |
| FU-003 | README.md の整備 | Download（Nix / Homebrew）、Usage（スクリーンショット付き解説）、Local Development（direnv + nix flake 手順）の各セクションを作成する。 | 初回リリース前 |
| FU-004 | Flatpak マニフェスト作成 | Flathub 公開に必要な `com.promptnotes.PromptNotes.yml` マニフェストおよびメタデータの整備。 | Linux 配布開始時 |
| FU-005 | Homebrew Cask フォーミュラ作成 | `homebrew-cask` へのプルリクエスト準備。署名・公証（macOS notarization）対応を含む。 | macOS 配布開始時 |
| FU-006 | NixOS パッケージ化 | `nixpkgs` への追加または独自 flake による配布。開発環境用の `flake.nix` とは別にパッケージビルド定義を用意する。 | Linux 配布開始時 |
