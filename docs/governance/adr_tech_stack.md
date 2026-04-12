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

本ドキュメントは PromptNotes の技術スタック選定に関するアーキテクチャ決定記録（ADR）である。PromptNotes は「AI へ渡すプロンプトを素早く書き溜めるノートアプリ」であり、タイトル不要・本文即記・グリッド振り返りを設計思想とする。ターミナルや IDE へプロンプトをペーストする用途に特化し、AI 呼び出し機能・クラウド同期・Markdown プレビュー（レンダリング）・モバイル対応はスコープ外とする。

以下の 3 項目はリリースブロッキング制約であり、変更はリリース不可である。

| 制約 ID | 対象 | 決定事項 | 違反時の影響 |
|---|---|---|---|
| RBC-1 | `framework:tauri` | Tauri（Rust + WebView）を唯一のアプリケーションフレームワークとする。Electron・Wails 等への変更は禁止。 | リリース不可 |
| RBC-2 | `module:editor` | CodeMirror 6 を唯一のエディタエンジンとする。Monaco・ProseMirror 等への変更は禁止。 | リリース不可 |
| RBC-3 | `module:storage` | ローカル `.md` ファイル保存を唯一のデータ永続化方式とする。SQLite・IndexedDB・クラウドストレージ等の導入は禁止。 | リリース不可 |

ターゲットプラットフォームは Linux および macOS とし、Windows は将来対応とする。

---

## 2. Decision Log

### ADR-001: アプリケーションフレームワーク — Tauri（Rust + WebView）

- **ステータス**: 確定（リリースブロッキング制約 RBC-1）
- **コンテキスト**: プロンプトノートアプリはテキスト入力が主機能であり、IME・カーソル操作・コピー操作など入力周りの複雑さを WebView に委譲する必要がある。
- **選択肢と比較**:

| 選択肢 | バイナリサイズ | メモリフットプリント | IME 対応 | 配布容易性 |
|---|---|---|---|---|
| **Tauri（採用）** | 小（数 MB） | 低（OS の WebView 利用） | WebView 任せで安定 | Flatpak / Homebrew と相性良好 |
| Electron | 大（100 MB 超） | 高（Chromium 同梱） | WebView 任せで安定 | 広く普及 |
| Zig + Native UI（Ghostty 方式） | 最小 | 最低 | 二重 UI 実装が必要 | プラットフォーム別対応が煩雑 |

- **決定理由**:
  1. テキストエディタの入力周りは WebView に任せることで罠を回避できる
  2. Electron 比でバイナリサイズとメモリフットプリントが大幅に小さい
  3. Ghostty 方式の二重 UI 実装よりも現実的な開発コスト
  4. Flatpak（Flathub）・Homebrew Cask との配布相性が良好
  5. Rust バックエンドによりファイル I/O・ファイルシステム監視が高性能
- **配布方式への影響**:
  - Linux: バイナリ直接ダウンロード、Flatpak（Flathub）、NixOS
  - macOS: バイナリ直接ダウンロード、Homebrew Cask
  - Windows: 将来対応（Tauri は Windows もサポートするため技術的障壁は低い）

### ADR-002: フロントエンドフレームワーク — Svelte

- **ステータス**: 確定
- **コンテキスト**: Tauri の WebView 上で動作する SPA フレームワークの選定。
- **選択肢と比較**:

| 選択肢 | バンドルサイズ | ランタイムオーバーヘッド | 学習コスト |
|---|---|---|---|
| **Svelte（採用）** | 極小（コンパイル済み） | なし（仮想 DOM 不使用） | 中 |
| React | 中（ランタイム同梱） | あり（仮想 DOM） | 低（エコシステム大） |

- **決定理由**:
  1. コンパイル時に最適化されるためランタイムオーバーヘッドがゼロ
  2. バンドルサイズが React より小さく、Tauri の軽量思想と合致
  3. リアクティブな状態管理が宣言的に書ける

### ADR-003: エディタエンジン — CodeMirror 6

- **ステータス**: 確定（リリースブロッキング制約 RBC-2）
- **コンテキスト**: Markdown シンタックスハイライト付きのプレーンテキストエディタが必要。レンダリング（プレビュー）は不要。frontmatter 領域の視覚的区別、1 クリックコピーボタン、Cmd+N / Ctrl+N による即座の新規ノート作成といった UX 要件を満たす必要がある。
- **選択肢と比較**:

| 選択肢 | バンドルサイズ | カスタマイズ性 | Markdown 対応 |
|---|---|---|---|
| **CodeMirror 6（採用）** | 軽量（Monaco 比 1/10 以下） | 高（拡張ベース） | 公式パッケージあり |
| Monaco Editor | 大（数 MB） | 中（VS Code 由来） | プラグイン依存 |
| ProseMirror | 中 | 高 | リッチテキスト寄り |

- **決定理由**:
  1. バンドルサイズが Monaco 比で 1/10 以下と軽量
  2. Obsidian と同じエディタエンジンであり、ユーザーの指の慣れと操作感が一致
  3. frontmatter 領域だけ背景色を変えるなどのデコレーションカスタマイズが容易
  4. 公式の `@codemirror/lang-markdown` パッケージによるシンタックスハイライト
  5. プレーンテキスト寄りの表示が要件と合致（Markdown レンダリングはスコープ外）
- **実装への影響**:
  - エディタ画面: 本文のみ（タイトル入力欄なし）、Markdown シンタックスハイライト
  - frontmatter 領域: 画面上部に配置、背景色による視覚的区別、tags のみ管理
  - 自動保存: 編集内容はファイル名（作成時タイムスタンプ `YYYY-MM-DDTHHMMSS.md`）で自動保存
  - コピー機能: 1 クリックコピーボタンで本文全体をクリップボードにコピー（核心 UX）

### ADR-004: データ永続化 — ローカル .md ファイル

- **ステータス**: 確定（リリースブロッキング制約 RBC-3）
- **コンテキスト**: ノートデータの保存方式の選定。クラウド同期はスコープ外。
- **選択肢と比較**:

| 選択肢 | 互換性 | バージョン管理 | 検索性能 | 外部ツール連携 |
|---|---|---|---|---|
| **ローカル .md（採用）** | 最高 | Git で自然に管理可能 | 十分（数十件/週） | Obsidian / VS Code でそのまま開ける |
| SQLite | 低 | DB ダンプが必要 | 高 | 専用ツールが必要 |
| IndexedDB | 低 | 不可 | 中 | ブラウザ内のみ |

- **決定理由**:
  1. Obsidian や VS Code など他ツールでそのまま開ける高い互換性
  2. Obsidian vault 内の 1 ディレクトリを PromptNotes に割り当てる運用が可能
  3. Git で自然にバージョン管理できる
  4. 想定利用量（1 週間分 = 数十件程度）では検索速度は問題にならない
- **ファイル仕様**:
  - ファイル名規則: `YYYY-MM-DDTHHMMSS.md`（例: `2026-04-04T143205.md`）
  - ファイル構造: YAML frontmatter（tags のみ）+ 本文
  - 作成日時はファイル名から取得（メタデータに重複保持しない）
- **デフォルト保存ディレクトリ**:
  - Linux: `~/.local/share/promptnotes/notes/`
  - macOS: `~/Library/Application Support/promptnotes/notes/`
  - 設定画面から任意のディレクトリに変更可能
- **データアクセス制御**: アプリケーションは設定で指定されたディレクトリのみを読み書きする。DB やクラウドストレージへの保存パスは一切存在しない。

### ADR-005: 検索方式 — ファイル全走査

- **ステータス**: 確定
- **コンテキスト**: グリッドビューでの全文検索およびタグ・日付フィルタの実装方式。
- **決定理由**:
  1. 想定データ量が 1 週間あたり数十件と少量であり、インデックス構築のオーバーヘッドが不要
  2. Rust バックエンド（Tauri）によるファイル I/O は十分高速
  3. 追加の検索エンジン依存（tantivy 等）を排除しバイナリサイズを抑制
- **グリッドビュー要件との対応**:
  - デフォルトフィルタ: 直近 7 日間のノートのみ表示
  - フィルタ: タグ・日付による絞り込み
  - 全文検索: ファイル全走査で本文を検索

---

## 3. Follow-ups

| ID | 項目 | 内容 | トリガー条件 |
|---|---|---|---|
| FU-001 | Windows 対応 | Tauri は Windows をサポートしているため技術的障壁は低い。Windows 版の配布方式（MSI / NSIS インストーラ、winget、Scoop）を決定する必要がある。 | Windows 対応を開始する時点 |
| FU-002 | 検索方式の再評価 | ノート数が数千件を超えた場合、ファイル全走査の応答時間を計測し、必要に応じて tantivy 等のインデックス検索の導入を検討する。 | ノート数が 1,000 件を超えた時点 |
| FU-003 | Svelte バージョン追従 | Svelte のメジャーバージョンアップ時に破壊的変更への対応方針を決定する。 | Svelte のメジャーリリース時 |
| FU-004 | Tauri v2 以降の機能活用 | Tauri のバージョンアップに伴う新 API（マルチウィンドウ、プラグインエコシステム等）の採用可否を評価する。 | Tauri の安定リリース時 |
| FU-005 | CodeMirror 6 拡張の拡充 | ユーザーフィードバックに基づき、キーバインドカスタマイズ・テーマ切替等の CodeMirror 拡張を追加検討する。 | ユーザーからの機能要望時 |

### リリースブロッキング制約の遵守確認

本ドキュメントは以下のリリースブロッキング制約に準拠している。

- **RBC-1 (`framework:tauri`)**: ADR-001 にて Tauri（Rust + WebView）を唯一のアプリケーションフレームワークとして確定。Electron 等への変更はリリース不可と明記。全配布方式（Flatpak、Homebrew Cask、バイナリ直接ダウンロード、NixOS）は Tauri ビルドを前提とする。
- **RBC-2 (`module:editor`)**: ADR-003 にて CodeMirror 6 を唯一のエディタエンジンとして確定。Monaco 等への変更はリリース不可と明記。Markdown シンタックスハイライト、frontmatter 背景色変更、1 クリックコピー、Cmd+N / Ctrl+N 新規作成の全 UX 要件を CodeMirror 6 の拡張機構で実現する。
- **RBC-3 (`module:storage`)**: ADR-004 にてローカル `.md` ファイル保存を唯一のデータ永続化方式として確定。DB・クラウド保存は禁止と明記。ファイル名規則 `YYYY-MM-DDTHHMMSS.md`、YAML frontmatter（tags のみ）、デフォルト保存ディレクトリの仕様を規定。
