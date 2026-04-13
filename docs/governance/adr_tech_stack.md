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

本 ADR は PromptNotes の技術スタック選定に関する意思決定を記録する。PromptNotes は「AI へ渡すプロンプトを素早く書き溜めるノートアプリ」であり、タイトル不要・本文のみ・1 画面完結をコンセプトとする。ターミナルや IDE へのペーストを主用途とし、AI 呼び出し機能は持たない。

本ドキュメントは以下のリリース不可制約（Non-negotiable conventions）に準拠する。

| 制約 ID | 対象 | 内容 | 本ドキュメントでの準拠箇所 |
|---|---|---|---|
| framework:tauri | フレームワーク | Tauri（Rust + WebView）は確定済み。Electron 等への変更はリリース不可。 | Decision Log ADR-001 |
| module:editor | エディタエンジン | CodeMirror 6 は確定済み。Monaco 等への変更はリリース不可。 | Decision Log ADR-002 |
| module:storage | データ保存方式 | ローカル `.md` ファイル保存は確定済み。DB・クラウド保存は禁止。 | Decision Log ADR-003 |

これらの制約に違反する変更提案はすべてリリースブロッカーとして却下される。

## 2. Decision Log

### ADR-001: アプリケーションフレームワーク — Tauri（Rust + WebView）

- **ステータス**: 確定（変更不可・リリース不可制約）
- **決定日**: 2026-04-04
- **コンテキスト**: PromptNotes はデスクトップ向けノートアプリであり、IME・カーソル操作・コピー操作など入力周りの複雑さを Web 技術に委譲する必要がある。候補として Electron、Tauri、Ghostty 方式（Zig + Native UI）を評価した。
- **決定**: Tauri（Rust バックエンド + OS ネイティブ WebView）を採用する。
- **根拠**:
  - テキストエディタの入力処理（IME・カーソル・コピー）は WebView に任せた方が罠が少ない
  - Electron と比較してバイナリサイズとメモリフットプリントが大幅に小さい
  - Ghostty 方式（Zig + Native UI）の二重 UI 実装よりも現実的な開発コスト
  - Flatpak（Flathub）および Homebrew Cask との配布相性が良い
- **ターゲットプラットフォーム**: Linux（バイナリ直接ダウンロード / Flatpak / NixOS）、macOS（バイナリ直接ダウンロード / Homebrew Cask）。Windows は将来対応。
- **却下した選択肢**:
  - **Electron** — バイナリサイズ（約 150 MB 以上）とメモリ消費が過大。PromptNotes のような軽量アプリには不釣り合い。
  - **Ghostty 方式（Zig + Native UI）** — プラットフォームごとの UI 実装が二重になり、開発工数が現実的でない。

### ADR-002: フロントエンドフレームワーク — Svelte

- **ステータス**: 確定
- **決定日**: 2026-04-04
- **コンテキスト**: Tauri の WebView 上で動作するフロントエンドフレームワークとして React と Svelte を比較した。
- **決定**: Svelte を採用する。
- **根拠**:
  - コンパイル型フレームワークであり、ランタイムオーバーヘッドが実質ゼロ
  - バンドルサイズが React と比較して小さく、Tauri のバイナリサイズ優位性を活かせる
  - 記述量が少なく、PromptNotes の単画面構成に適している

### ADR-003: エディタエンジン — CodeMirror 6

- **ステータス**: 確定（変更不可・リリース不可制約）
- **決定日**: 2026-04-04
- **コンテキスト**: ノートカードの編集モードで使用するエディタエンジンとして CodeMirror 6 と Monaco Editor を比較した。
- **決定**: CodeMirror 6 を採用する。
- **根拠**:
  - バンドルサイズが軽量（Monaco 比で 1/10 以下）
  - Obsidian と同じエンジンであり、ユーザーの操作感と一致する
  - frontmatter 領域だけ背景色を変えるなどのカスタマイズが容易
  - 公式の Markdown シンタックスハイライトパッケージ（`@codemirror/lang-markdown`）が存在する
- **却下した選択肢**:
  - **Monaco Editor** — VS Code 由来で高機能だが、バンドルサイズが約 4 MB 超と過大。PromptNotes のユースケース（短いプロンプトテキストの編集）には過剰。
- **実装上の要件**:
  - Markdown シンタックスハイライト（レンダリングなし、ハイライトのみ）
  - frontmatter（YAML）領域の背景色による視覚的区別
  - 同時に編集モードになるカードは 1 つだけ（シングルエディタインスタンス管理）

### ADR-004: データ保存方式 — ローカル `.md` ファイル

- **ステータス**: 確定（変更不可・リリース不可制約）
- **決定日**: 2026-04-04
- **コンテキスト**: ノートの永続化方式として、SQLite、クラウドストレージ、ローカルファイルシステムを検討した。
- **決定**: ローカルファイルシステム上の `.md` ファイルとして保存する。DB およびクラウド保存は禁止する。
- **根拠**:
  - Obsidian や VS Code など他ツールでそのまま開ける相互運用性
  - Obsidian vault 内の 1 ディレクトリをこのアプリに割り当てる使い方が可能
  - Git で自然にバージョン管理できる
  - 想定データ量（1 週間分 = 数十件程度）では検索速度の遅さは問題にならない
- **ファイル名規則**: `YYYY-MM-DDTHHMMSS.md`（例: `2026-04-04T143205.md`）。タイトルは不要でタイムスタンプのみ。
- **ファイル構造**: YAML frontmatter（`tags` のみ）+ 本文。作成日はファイル名から取得する。
- **デフォルト保存ディレクトリ**:
  - Linux: `~/.local/share/promptnotes/notes/`
  - macOS: `~/Library/Application Support/promptnotes/notes/`
- **設定による変更**: 設定モーダルから任意のディレクトリに変更可能。
- **却下した選択肢**:
  - **SQLite** — 他ツールとの相互運用性が損なわれる。Git でのバージョン管理が困難。
  - **クラウドストレージ** — スコープ外（クラウド同期は明示的に含まない）。リリース不可制約により禁止。

### ADR-005: 検索方式 — ファイル全走査

- **ステータス**: 確定
- **決定日**: 2026-04-04
- **コンテキスト**: ノートの全文検索方式として、全文検索インデックス（tantivy 等）とファイル全走査を比較した。
- **決定**: ファイル全走査による検索を採用する。
- **根拠**:
  - 想定データ量が 1 週間分 = 数十件と少量であり、インデックス構築のオーバーヘッドが正当化されない
  - 外部依存が不要でアーキテクチャがシンプル
  - `.md` ファイルの直接読み取りで完結する

### ADR-006: 配布方式

- **ステータス**: 確定
- **決定日**: 2026-04-04
- **決定**:

| プラットフォーム | 配布チャネル |
|---|---|
| Linux | バイナリ直接ダウンロード、Flatpak（Flathub）、NixOS |
| macOS | バイナリ直接ダウンロード、Homebrew Cask |
| Windows | 将来対応（現時点ではスコープ外） |

- **根拠**: Tauri は各プラットフォーム向けのネイティブインストーラ生成をサポートしており、Flatpak および Homebrew Cask との統合が容易である。

## 3. Follow-ups

| ID | 項目 | トリガー条件 | 対応方針 |
|---|---|---|---|
| FU-001 | Windows 対応 | ユーザー需要が一定数に達した場合 | Tauri の Windows ビルド設定を追加し、MSI / NSIS インストーラで配布する。技術スタック自体の変更は不要。 |
| FU-002 | 検索方式の再評価 | ノート件数が 1,000 件を超えた場合 | ファイル全走査のレスポンスタイムを計測し、200 ms を超える場合は tantivy ベースのインデックス検索への移行を検討する。 |
| FU-003 | Svelte メジャーバージョンアップ | Svelte 次期メジャーバージョンリリース時 | 破壊的変更の影響を評価し、移行計画を策定する。CodeMirror 6 との統合部分を重点確認する。 |
| FU-004 | Tauri v2 以降の安定化 | Tauri 新メジャーバージョン安定版リリース時 | API 変更の影響を評価し、ファイルシステムアクセス（`fs` プラグイン）およびクリップボード操作（`clipboard-manager` プラグイン）の互換性を確認する。 |
| FU-005 | CodeMirror 6 プラグインエコシステム監視 | 半年ごとの定期レビュー | Markdown ハイライトパッケージおよび frontmatter カスタマイズ関連の更新を確認し、必要に応じてアップデートする。 |
