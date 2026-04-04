---
codd:
  node_id: test:acceptance_criteria
  type: test
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
    - module:editor
    reason: Cmd+N / Ctrl+N 即時新規ノート作成および1クリックコピーボタンはコアUXであり、未実装ならリリース不可。
  - targets:
    - module:editor
    reason: CodeMirror 6 必須。タイトル入力欄禁止・Markdownプレビュー（レンダリング）禁止はスコープ外として明示されており、実装した場合リリース不可。
  - targets:
    - module:storage
    reason: ファイル名規則 YYYY-MM-DDTHHMMSS.md および自動保存は確定済み。違反時リリース不可。
  - targets:
    - module:grid
    reason: デフォルト直近7日間フィルタ・タグ/日付フィルタ・全文検索は必須機能。未実装ならリリース不可。
  modules:
  - editor
  - grid
  - storage
  - settings
---

# Acceptance Criteria

## 1. Overview

本ドキュメントは PromptNotes の受け入れ基準を定義する。PromptNotes は AI へ渡すプロンプトを素早く書き溜めるローカルノートアプリであり、Tauri（Rust + WebView）上で動作する。エディタ画面・グリッドビュー・設定画面の3画面で構成され、ローカル `.md` ファイルへの保存を基本とする。

対象プラットフォームは Linux および macOS。Windows は将来対応でありスコープ外である。

本ドキュメントはリリース判定の合否基準として機能し、以下の release-blocking constraints を反映している。

| 制約ID | 対象モジュール | 制約内容 |
|--------|---------------|----------|
| RBC-1 | `module:editor` | Cmd+N / Ctrl+N 即時新規ノート作成および1クリックコピーボタンはコアUXであり、未実装ならリリース不可 |
| RBC-2 | `module:editor` | CodeMirror 6 必須。タイトル入力欄およびMarkdownプレビュー（レンダリング）はスコープ外であり、実装した場合リリース不可 |
| RBC-3 | `module:storage` | ファイル名規則 `YYYY-MM-DDTHHMMSS.md` および自動保存は確定済み。違反時リリース不可 |
| RBC-4 | `module:grid` | デフォルト直近7日間フィルタ・タグ/日付フィルタ・全文検索は必須機能。未実装ならリリース不可 |

---

## 2. Acceptance Criteria

### 2.1 エディタ画面 (`module:editor`)

#### AC-ED-01: CodeMirror 6 エディタの採用（RBC-2）

- エディタエンジンとして CodeMirror 6 が使用されていること。
- CodeMirror 6 公式の Markdown シンタックスハイライトパッケージが適用され、Markdown 構文（見出し・リスト・コードブロック・強調など）が色分け表示されること。
- エディタはプレーンテキスト編集モードであること。Markdown をレンダリング（HTML 変換表示）する機能が存在しないこと。

#### AC-ED-02: タイトル入力欄の不在（RBC-2）

- エディタ画面にタイトル入力欄（テキストフィールド、ヘッダ入力エリア等）が存在しないこと。
- 画面構成は frontmatter 領域と本文領域のみであること。

#### AC-ED-03: frontmatter 領域

- エディタ画面上部に frontmatter（YAML 形式）の編集領域が表示されること。
- frontmatter 領域は背景色により本文領域と視覚的に区別されること。
- frontmatter にはタグ（`tags` フィールド）を入力できること。
- frontmatter の形式は以下に準拠すること:
  ```
  ---
  tags: [gpt, coding]
  ---
  ```
- メタデータは `tags` のみを保持し、作成日はファイル名から取得すること。

#### AC-ED-04: Cmd+N / Ctrl+N 新規ノート作成（RBC-1）

- macOS で Cmd+N、Linux で Ctrl+N を押下すると、即座に新規ノートが作成されること。
- 新規ノート作成後、エディタの本文領域にフォーカスが自動的に移動すること。
- キー押下からフォーカス移動完了まで体感上の遅延がないこと（ユーザーが「即座」と認識できる応答速度）。

#### AC-ED-05: 1クリックコピーボタン（RBC-1）

- エディタ画面上に、ノート本文全体をクリップボードにコピーするボタンが1つ配置されていること。
- ボタンを1回クリックするだけで、本文全体（frontmatter を除く本文テキスト）がシステムクリップボードにコピーされること。
- コピー後、ターミナルや IDE にペーストして正しく本文が貼り付けられること。

#### AC-ED-06: 自動保存（RBC-3）

- ユーザーが明示的に「保存」操作を行わなくても、編集内容が自動的にファイルへ保存されること。
- ファイル名はノート作成時のタイムスタンプで確定し、以降変更されないこと。

### 2.2 ストレージ (`module:storage`)

#### AC-ST-01: ファイル名規則（RBC-3）

- 新規ノート作成時、ファイル名が `YYYY-MM-DDTHHMMSS.md` 形式で生成されること。
- 例: `2026-04-04T143205.md`
- タイムスタンプはノート作成時刻に基づくこと。
- ファイル名にタイトル文字列やその他の付加情報が含まれないこと。

#### AC-ST-02: ファイル形式

- 保存されるファイルは `.md`（Markdown）形式であること。
- ファイル先頭に YAML frontmatter（`---` で囲まれたブロック）を含み、その後に本文が続くこと。
- frontmatter 内のメタデータは `tags` フィールドのみであること。

#### AC-ST-03: デフォルト保存ディレクトリ

- Linux でのデフォルト保存先: `~/.local/share/promptnotes/notes/`
- macOS でのデフォルト保存先: `~/Library/Application Support/promptnotes/notes/`
- 初回起動時、デフォルト保存ディレクトリが自動的に作成されること（存在しない場合）。

#### AC-ST-04: Obsidian 互換性

- 保存された `.md` ファイルが Obsidian および VSCode でそのまま開けること。
- Obsidian vault 内のサブディレクトリを保存先に指定した場合、Obsidian 側でノートが正常に認識されること。
- Git リポジトリ内に配置した場合、通常の `git add` / `git commit` でバージョン管理できること。

### 2.3 グリッドビュー (`module:grid`)

#### AC-GR-01: Pinterest スタイルカード表示

- グリッドビューが Pinterest スタイルの可変高カードレイアウトで表示されること。
- 各カードにノートの本文プレビューが表示されること。

#### AC-GR-02: デフォルト直近7日間フィルタ（RBC-4）

- グリッドビューを開いた時点で、直近7日間に作成されたノートのみがデフォルトで表示されること。
- 7日間の起点はファイル名のタイムスタンプに基づくこと。

#### AC-GR-03: タグフィルタ（RBC-4）

- タグによるフィルタリング機能が存在すること。
- 特定のタグを選択すると、当該タグを持つノートのみが表示されること。

#### AC-GR-04: 日付フィルタ（RBC-4）

- 日付範囲を指定してノートを絞り込む機能が存在すること。
- デフォルトの直近7日間以外の期間でも絞り込みが可能であること。

#### AC-GR-05: 全文検索（RBC-4）

- 全文検索機能が存在し、ノート本文中のテキストを検索できること。
- 検索方式はファイル全走査であること（外部検索エンジン不要）。
- 想定件数（1週間あたり数十件程度）で実用的な速度で検索結果が返ること。

#### AC-GR-06: カードクリックによるエディタ遷移

- グリッドビュー上のカードをクリックすると、該当ノートのエディタ画面に遷移すること。

### 2.4 設定画面

#### AC-SE-01: 保存ディレクトリ変更

- 設定画面から保存ディレクトリを任意のパスに変更できること。
- 変更後、新規ノートは新しいディレクトリに保存されること。

### 2.5 技術基盤

#### AC-TF-01: Tauri アプリケーション

- アプリケーションが Tauri（Rust + WebView）で構築されていること。
- Linux および macOS で動作すること。

#### AC-TF-02: 配布形式

- Linux 向け: バイナリ直接ダウンロード、Flatpak（Flathub）、NixOS パッケージのいずれかで配布可能であること。
- macOS 向け: バイナリ直接ダウンロード、Homebrew Cask のいずれかで配布可能であること。

### 2.6 スコープ外の不在確認

#### AC-EX-01: スコープ外機能が実装されていないこと

以下の機能がアプリケーション内に存在しないことを確認する。いずれか1つでも実装されている場合、受け入れ不可とする。

| 項目 | 確認内容 |
|------|----------|
| AI 呼び出し機能 | LLM API コール、チャット UI、プロンプト送信機能が存在しないこと |
| クラウド同期 | リモートサーバーへのデータ送信・同期機能が存在しないこと |
| タイトル入力欄 | エディタ画面にタイトル専用フィールドが存在しないこと（RBC-2） |
| Markdown プレビュー（レンダリング） | Markdown を HTML に変換して表示する機能が存在しないこと（RBC-2） |
| モバイル対応 | iOS / Android 向けビルドやレスポンシブモバイルレイアウトが含まれないこと |

### 2.7 Release-Blocking Constraints の充足確認

本ドキュメントにおける各 release-blocking constraint の反映箇所を以下に示す。

| 制約ID | 対象 | 準拠する受け入れ基準 |
|--------|------|---------------------|
| RBC-1 (`module:editor`) | Cmd+N / Ctrl+N、1クリックコピーボタン | AC-ED-04, AC-ED-05 |
| RBC-2 (`module:editor`) | CodeMirror 6 必須、タイトル入力欄禁止、Markdown プレビュー禁止 | AC-ED-01, AC-ED-02, AC-EX-01 |
| RBC-3 (`module:storage`) | ファイル名規則 `YYYY-MM-DDTHHMMSS.md`、自動保存 | AC-ST-01, AC-ED-06 |
| RBC-4 (`module:grid`) | デフォルト直近7日間フィルタ、タグ/日付フィルタ、全文検索 | AC-GR-02, AC-GR-03, AC-GR-04, AC-GR-05 |

---

## 3. Failure Criteria

以下のいずれかに該当する場合、リリースを不可とする。

### 3.1 Release-Blocking 違反（即時リリース不可）

| 判定ID | 条件 | 対象モジュール |
|--------|------|---------------|
| FAIL-01 | Cmd+N（macOS）または Ctrl+N（Linux）で新規ノートが即座に作成されない | `module:editor` |
| FAIL-02 | 1クリックコピーボタンが存在しない、または1回のクリックで本文全体がクリップボードにコピーされない | `module:editor` |
| FAIL-03 | エディタエンジンが CodeMirror 6 でない | `module:editor` |
| FAIL-04 | タイトル入力欄がエディタ画面に存在する | `module:editor` |
| FAIL-05 | Markdown プレビュー（レンダリング）機能が実装されている | `module:editor` |
| FAIL-06 | ファイル名が `YYYY-MM-DDTHHMMSS.md` 形式に準拠していない | `module:storage` |
| FAIL-07 | 自動保存が機能せず、ユーザーの手動操作なしに編集内容がファイルに反映されない | `module:storage` |
| FAIL-08 | グリッドビューのデフォルト表示が直近7日間のノートに絞り込まれていない | `module:grid` |
| FAIL-09 | タグによるフィルタリング機能が存在しない | `module:grid` |
| FAIL-10 | 日付によるフィルタリング機能が存在しない | `module:grid` |
| FAIL-11 | 全文検索機能が存在しない | `module:grid` |

### 3.2 機能不全（リリース不可）

| 判定ID | 条件 |
|--------|------|
| FAIL-20 | Markdown シンタックスハイライトが適用されず、プレーンテキストと区別がつかない |
| FAIL-21 | frontmatter 領域が背景色で本文と視覚的に区別されていない |
| FAIL-22 | グリッドビューのカードをクリックしてもエディタ画面に遷移しない |
| FAIL-23 | 設定画面から保存ディレクトリを変更できない |
| FAIL-24 | Linux のデフォルト保存先が `~/.local/share/promptnotes/notes/` でない |
| FAIL-25 | macOS のデフォルト保存先が `~/Library/Application Support/promptnotes/notes/` でない |
| FAIL-26 | 保存された `.md` ファイルが Obsidian または VSCode で開けない |

### 3.3 スコープ外機能の混入（リリース不可）

| 判定ID | 条件 |
|--------|------|
| FAIL-30 | AI 呼び出し機能（LLM API コール等）が含まれている |
| FAIL-31 | クラウド同期機能が含まれている |
| FAIL-32 | モバイル向けビルドまたは専用 UI が含まれている |

### 3.4 プラットフォーム要件不達

| 判定ID | 条件 |
|--------|------|
| FAIL-40 | Linux 上でアプリケーションが起動しない、または正常動作しない |
| FAIL-41 | macOS 上でアプリケーションが起動しない、または正常動作しない |
| FAIL-42 | アプリケーションが Tauri フレームワーク上で構築されていない |
