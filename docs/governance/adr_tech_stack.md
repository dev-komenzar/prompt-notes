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

本ドキュメントは PromptNotes の技術スタック選定に関するアーキテクチャ決定記録（ADR）である。PromptNotes は、AIへ渡すプロンプトを素早く書き溜めるローカルファーストのノートアプリであり、タイトル不要・本文即記・グリッド振り返りをコアUXとする。ターミナルやIDEへプロンプトをペーストする用途に特化し、AI呼び出し機能・クラウド同期・Markdownプレビュー（レンダリング）・モバイル対応はスコープ外とする。

ターゲットプラットフォームは Linux および macOS とし、Windows は将来対応とする。配布方式は Linux がバイナリ直接ダウンロード・Flatpak（Flathub）・NixOS、macOS がバイナリ直接ダウンロード・Homebrew Cask である。

以下のリリース不可制約（Non-negotiable conventions）が本ドキュメント全体を拘束する。

| 制約ID | 対象 | 内容 | 違反時の影響 |
|---|---|---|---|
| CONV-1 | `framework:tauri` | Tauri（Rust + WebView）は確定済みフレームワークである。Electron・Wails・Neutralinoなど他フレームワークへの変更はリリース不可。 | リリースブロック |
| CONV-2 | `module:editor` | CodeMirror 6 は確定済みエディタエンジンである。Monaco Editor・Ace・ProseMirrorなど他エディタへの変更はリリース不可。 | リリースブロック |
| CONV-3 | `module:storage` | ローカル `.md` ファイル保存は確定済みストレージ方式である。SQLite・IndexedDB・PostgreSQL・クラウドストレージなどDB・クラウド保存は禁止。 | リリースブロック |

本ADRに記載される全ての決定は、上記3つのリリース不可制約に準拠している。各決定エントリにおいて、関連する制約IDを明示的に参照する。

---

## 2. Decision Log

### ADR-001: アプリケーションフレームワーク — Tauri（Rust + WebView）

- **ステータス:** 承認済み（変更不可）
- **制約準拠:** CONV-1（`framework:tauri`）— Tauri は確定済みフレームワークであり、Electron 等への変更はリリース不可。
- **決定:** アプリケーションシェルとして Tauri を採用する。バックエンドロジックは Rust で記述し、UIレイヤーは OS ネイティブの WebView 上で動作させる。
- **コンテキスト:** PromptNotes はテキストエディタを中核とするアプリケーションであり、IME・カーソル制御・コピー操作など入力周りの複雑性が高い。ネイティブUIツールキットで入力系を自前実装するとバグの温床になるため、WebView に入力処理を委譲する設計が合理的である。
- **選定理由:**
  - テキスト入力周りの複雑な処理（IME、カーソル、コピー操作）を WebView に任せることで罠を回避できる。
  - Electron と比較してバイナリサイズおよびメモリフットプリントが大幅に小さい。
  - Ghostty 方式（Zig + Native UI）のような二重UI実装と比較して現実的な開発コストである。
  - Flatpak（Flathub）および Homebrew Cask との配布パイプライン相性が良い。
- **却下した代替案:**
  - **Electron:** バイナリサイズが 150MB 超、メモリ消費が大きい。軽量ノートアプリとして不適。
  - **Zig + Native UI（Ghostty方式）:** 二重UI実装のコストが高く、入力処理の罠が多い。
  - **Wails / Neutralino:** エコシステムの成熟度が Tauri に劣る。
- **影響:**
  - バックエンド（ファイルI/O、ディレクトリ監視、設定管理）は Rust で実装する。
  - フロントエンドは WebView 上の SPA として構築する。Tauri の IPC（`invoke`）を介してバックエンドと通信する。
  - ターゲットプラットフォームは Linux（GTK WebView）および macOS（WKWebView）。Windows は将来対応。

### ADR-002: フロントエンドUIフレームワーク — React または Svelte（未決定）

- **ステータス:** 未決定（ADR-006 で最終決定予定）
- **制約準拠:** CONV-1 に間接的に関連。いずれのフレームワークを選択しても Tauri の WebView 上で動作するため、CONV-1 に違反しない。
- **決定:** フロントエンドUIフレームワークとして React または Svelte のいずれかを採用する。最終選定は技術検証（ADR-006）完了後に行う。
- **コンテキスト:** PromptNotes のUI構成はエディタ画面・グリッドビュー・設定画面の3画面であり、状態管理の複雑度は低い。
- **評価軸:**
  - **React:** エコシステムが広大。CodeMirror 6 との統合ライブラリ（`@uiw/react-codemirror` 等）が豊富。開発者採用プールが大きい。
  - **Svelte:** バンドルサイズが小さい。ボイラープレートが少なく、3画面規模のアプリに適する。Tauri 公式テンプレートでサポート済み。
- **判定基準:** CodeMirror 6 統合の安定性、frontmatter 領域のカスタムスタイリング（背景色変更）の実装容易性、ビルドサイズ、開発速度を技術検証で比較する。

### ADR-003: エディタエンジン — CodeMirror 6

- **ステータス:** 承認済み（変更不可）
- **制約準拠:** CONV-2（`module:editor`）— CodeMirror 6 は確定済みエディタエンジンであり、Monaco 等への変更はリリース不可。
- **決定:** テキスト編集コンポーネントとして CodeMirror 6 を採用する。Markdown シンタックスハイライトは公式パッケージ `@codemirror/lang-markdown` を使用する。レンダリング（プレビュー）は行わず、プレーンテキスト寄りの表示とする。
- **コンテキスト:** PromptNotes のコアUXは「本文を書いてすぐコピー」であり、エディタの軽量性・起動速度・カスタマイズ性が最重要である。
- **選定理由:**
  - バンドルサイズが軽量である（Monaco Editor 比で 1/10 以下）。
  - Obsidian と同一のエディタエンジンであり、ユーザーのキーバインド・操作感の慣れと一致する。
  - frontmatter 領域だけ背景色を変えるなどのカスタムデコレーションが容易に実装できる。
  - 公式の Markdown シンタックスハイライトパッケージ（`@codemirror/lang-markdown`）が提供されている。
- **却下した代替案:**
  - **Monaco Editor:** バンドルサイズが大きい（数MB）。IDE向けの機能過剰。Tauri WebView でのロード時間が長い。
  - **Ace Editor:** メンテナンス頻度が低下傾向。CodeMirror 6 のエクステンションモデルの方が柔軟。
  - **ProseMirror:** リッチテキスト向けであり、プレーンテキスト寄りの Markdown 編集には過剰。
- **影響:**
  - エディタ画面ではタイトル入力欄を設けず、本文のみを CodeMirror 6 インスタンスで表示する。
  - 画面上部に frontmatter（タグ入力）領域を配置し、カスタムデコレーション（`ViewPlugin` / `Decoration`）で背景色を変えて視覚的に区別する。
  - `Cmd+N` / `Ctrl+N` キーバインドを CodeMirror のキーマップに登録し、即座に新規ノートを作成してフォーカスを移動する。
  - 1クリックコピーボタンは CodeMirror のドキュメント内容（frontmatter を除く本文）を `navigator.clipboard.writeText()` でクリップボードに転写する。
  - 保存は自動保存とし、CodeMirror の `updateListener` で変更検知後にデバウンスして Tauri バックエンドの Rust ファイルI/Oで書き込む。

### ADR-004: データストレージ — ローカル `.md` ファイル

- **ステータス:** 承認済み（変更不可）
- **制約準拠:** CONV-3（`module:storage`）— ローカル `.md` ファイル保存は確定済み。DB・クラウド保存は禁止。
- **決定:** 全ノートデータをローカルファイルシステム上の `.md` ファイルとして保存する。データベース（SQLite、IndexedDB 等）およびクラウドストレージ（S3、Google Drive 等）は使用しない。
- **コンテキスト:** PromptNotes はローカルファーストのアプリケーションであり、Obsidian vault 内の1ディレクトリをこのアプリに割り当てる使い方を想定している。
- **選定理由:**
  - Obsidian や VSCode など他ツールでそのまま `.md` ファイルとして開ける相互運用性。
  - Obsidian vault 内のサブディレクトリを指定して共存できる。
  - Git で自然にバージョン管理できる。
  - ノート件数が少ない（1週間分で数十件程度）ため、ファイル全走査による検索速度の遅さは問題にならない。
- **ファイル名規則:** `YYYY-MM-DDTHHMMSS.md`（例: `2026-04-04T143205.md`）。タイムスタンプのみでタイトルは含めない。作成日時はファイル名から一意に導出する。
- **ファイル構造:**
  ```
  ---
  tags: [gpt, coding]
  ---

  本文をここに書く...
  ```
  frontmatter は YAML 形式とし、メタデータは `tags` フィールドのみとする。
- **デフォルト保存ディレクトリ:**
  - Linux: `~/.local/share/promptnotes/notes/`
  - macOS: `~/Library/Application Support/promptnotes/notes/`
  - 設定画面から任意のディレクトリに変更可能。
- **却下した代替案:**
  - **SQLite:** ファイル単位の相互運用性が失われる。Git 管理が困難。
  - **IndexedDB:** ブラウザサンドボックス内に閉じ、外部ツールからアクセスできない。
  - **クラウドストレージ:** スコープ外（クラウド同期は明示的に含まない）。
- **影響:**
  - 検索機能はファイル全走査で実装する。Rust バックエンドで `std::fs` を用いてディレクトリ内の全 `.md` ファイルを読み取り、全文検索を行う。
  - グリッドビューのデフォルトフィルタは直近7日間のノートのみ表示とし、ファイル名のタイムスタンプで絞り込む。
  - タグフィルタは各ファイルの frontmatter をパースして `tags` フィールドを抽出する。
  - データのバックアップ・復元はファイルシステムレベル（`cp`、`rsync`、Git）でユーザーが行う。アプリ内バックアップ機能は提供しない。

### ADR-005: 検索方式 — ファイル全走査

- **ステータス:** 承認済み
- **制約準拠:** CONV-3 に準拠。ローカル `.md` ファイルに対するファイルシステム走査であり、DB を使用しない。
- **決定:** 全文検索はファイル全走査方式で実装する。インデックスエンジン（Tantivy、SQLite FTS 等）は導入しない。
- **コンテキスト:** 想定ノート件数は1週間で数十件程度であり、蓄積が進んでも数百〜数千件規模に留まる。この規模ではファイル全走査で十分な応答速度が得られる。
- **選定理由:**
  - 件数が少ないため、インデックス構築・維持のコストに見合わない。
  - 実装が単純であり、ストレージ方式（`.md` ファイル）との整合性が高い。
  - Rust の `std::fs::read_to_string` + `str::contains` で十分な速度が出る。
- **影響:**
  - グリッドビューからの全文検索はフロントエンドから Tauri IPC 経由でバックエンドの検索関数を呼び出す。
  - 将来ノート件数が大幅に増加した場合は Tantivy 等のインデックスエンジン導入を検討する（ADR-005 の改訂として記録）。

### ADR-006: 配布パイプライン — Flatpak / Homebrew Cask / バイナリ直接ダウンロード

- **ステータス:** 承認済み
- **制約準拠:** CONV-1 に関連。Tauri のビルドシステム（`tauri build`）が各配布形式のアーティファクトを生成する。
- **決定:**
  - **Linux:** バイナリ直接ダウンロード（`.AppImage` または `.deb`）、Flatpak（Flathub 公開）、NixOS（Nix パッケージ）
  - **macOS:** バイナリ直接ダウンロード（`.dmg`）、Homebrew Cask
  - **Windows:** 将来対応（現時点ではビルド・配布パイプラインを構築しない）
- **影響:**
  - CI/CD パイプラインで `tauri build` を実行し、Linux 向け AppImage / deb / Flatpak バンドル、macOS 向け dmg を自動生成する。
  - Flatpak マニフェストおよび Homebrew Cask formula をリポジトリ内で管理する。

---

## 3. Follow-ups

| ID | 対象ADR | アクション | 条件・トリガー | 優先度 |
|---|---|---|---|---|
| FU-001 | ADR-002 | React vs Svelte の技術検証を実施し、フロントエンドUIフレームワークを最終決定する。検証項目: CodeMirror 6 統合安定性、frontmatter 背景色カスタマイズ実装容易性、ビルドサイズ比較、Tauri IPC との統合パターン。 | 開発開始前 | 高 |
| FU-002 | ADR-005 | ノート件数が 5,000 件を超過した場合、ファイル全走査の応答時間を計測し、Tantivy 等のインデックスエンジン導入を検討する。 | ノート件数 5,000 件超過時 | 低 |
| FU-003 | ADR-006 | Windows 対応のビルド・配布パイプライン（`.msi` / Microsoft Store）を構築する。Tauri は Windows ビルドを公式サポートしているため、技術的障壁は低い。 | Windows 対応着手時 | 低 |
| FU-004 | ADR-001 | Tauri v2 安定版リリース時にマイグレーション計画を策定する。IPC モデル・セキュリティモデルの変更点を評価し、必要に応じて ADR-001 を改訂する。 | Tauri メジャーバージョンアップ時 | 中 |
| FU-005 | ADR-003 | CodeMirror 6 のメジャーアップデート時に破壊的変更の有無を確認し、frontmatter カスタムデコレーションおよびキーバインド登録への影響を評価する。 | CodeMirror メジャーバージョンアップ時 | 中 |

---

**リリース不可制約の準拠確認:**

- **CONV-1（`framework:tauri`）:** ADR-001 において Tauri（Rust + WebView）を確定済みフレームワークとして記録した。Electron・Wails・Neutralino 等への変更は全 ADR を通じて禁止されている。配布パイプライン（ADR-006）も Tauri のビルドシステムに依存する設計としている。
- **CONV-2（`module:editor`）:** ADR-003 において CodeMirror 6 を確定済みエディタエンジンとして記録した。Monaco Editor・Ace・ProseMirror 等への変更は禁止されている。Markdown シンタックスハイライト・frontmatter カスタムデコレーション・キーバインド・自動保存の全てを CodeMirror 6 のエクステンションモデル上で実装する。
- **CONV-3（`module:storage`）:** ADR-004 において ローカル `.md` ファイル保存を確定済みストレージ方式として記録した。SQLite・IndexedDB・クラウドストレージ等の DB・クラウド保存は禁止されている。検索（ADR-005）もファイル全走査方式とし、DB インデックスを使用しない。
