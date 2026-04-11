---
codd:
  node_id: "req:promptnotes-requirements"
  type: requirement
  depended_by:
  - id: governance:adr_tech_stack
    relation: derives_from
    semantic: governance
  - id: test:acceptance_criteria
    relation: derives_from
    semantic: governance
---

# PromptNotes — Requirements

## コンセプト

AIへ渡すプロンプトを素早く書き溜めるためのノートアプリ。
タイトル不要、本文だけ。書いたらすぐ次へ。振り返りはグリッドで。

ターミナルやIDEにプロンプトをペーストする用途を想定しており、AI呼び出し機能は持たない。

---

## 技術スタック

| 項目 | 決定 |
|---|---|
| フレームワーク | Tauri（Rust + WebView） |
| フロントエンド | Svelte |
| エディタ | CodeMirror 6 |
| データ保存 | ローカル .md ファイル |
| 検索 | ファイル全走査（件数が少ないため十分） |
| ターゲット | Linux, macOS（Windows は将来対応） |

React vs Svelte: コンパイルされるsvelteを採用する。

### Tauriを選んだ理由

- テキストエディタはIME・カーソル・コピー操作など入力周りが複雑で、WebViewに任せた方が罠が少ない
- ElectronよりバイナリサイズとメモリフットプリントがGhostty方式（Zig + Native UI）の二重UI実装よりも現実的
- Flatpak / Homebrew との相性が良い

### CodeMirrorを選んだ理由

- バンドルサイズが軽量（Monaco比で1/10以下）
- Obsidianと同じエンジンでユーザーの指の慣れと一致
- frontmatter領域だけ背景色を変えるなどのカスタマイズがしやすい
- 公式のMarkdownシンタックスハイライトパッケージあり

### .mdファイルを選んだ理由

- ObsidianやVSCodeなど他ツールでそのまま開ける
- Obsidian vault内の1ディレクトリをこのアプリに割り当てる使い方ができる
- Gitで自然にバージョン管理できる
- 検索速度の遅さは問題にならない（1週間分＝数十件程度）

---

## データ設計

### ファイル名規則

```
YYYY-MM-DDTHHMMSS.md
例: 2026-04-04T143205.md
```

タイムスタンプのみ。タイトルは不要。

### ファイル構造

```
---
tags: [gpt, coding]
---

本文をここに書く...
```

- frontmatterはYAML形式
- メタデータはtagsのみ（作成日はファイル名から取得）

### デフォルト保存ディレクトリ

```
Linux:   ~/.local/share/promptnotes/notes/
macOS:   ~/Library/Application Support/promptnotes/notes/
```

「設定」から任意のディレクトリに変更可能。Obsidian vault内のサブディレクトリを指定する使い方を想定。

---

## 機能要件

### エディタ画面

- タイトル入力欄なし。本文のみ
- CodeMirror 6によるMarkdownシンタックスハイライト（レンダリングなし。プレーンテキスト寄り）
- 画面上部にfrontmatter（タグ入力）領域を設置。背景色で視覚的に区別
- **Cmd+N / Ctrl+N** で即座に新規ノートを作成しフォーカス移動
- **1クリックコピーボタン** — 本文全体をクリップボードにコピー（このアプリの核心UX）
- 保存は自動（ファイル名はノート作成時のタイムスタンプで確定）

│ Header            │
├───────── │
│tags:              │
│                   │
│Typing a new note  │
│                   │
│                   │
├───────── │
│tags:              │
│                   │
│Next note          │
│something great    │
│                   │
├───────── │
│                   │

このように編集画面では過去のノートがリストになって見れる。選択すればそのまま編集も可能。

#### 新規ノートの場合

- エディタ画面が新規ノートの場合でも**Cmd+N / Ctrl+N** で即座にさらに新規ノートを作成しフォーカス移動

### グリッドビュー

- Pinterestスタイルの可変高カード
- デフォルトフィルタ：**直近7日間**のノートのみ表示
- タグ・日付でフィルタ可能
- 全文検索（ファイル全走査）
- カードをクリックでエディタ画面に遷移

### 設定画面

- 保存ディレクトリの変更

---

## 配布方式

| プラットフォーム | 方式 |
|---|---|
| Linux | バイナリ直接ダウンロード、Flatpak（Flathub）、NixOS |
| macOS | バイナリ直接ダウンロード、Homebrew Cask |
| Windows | 将来対応 |

---

## スコープ外（明示的に含まない）

- AI呼び出し機能
- クラウド同期
- タイトル
- Markdownプレビュー（レンダリング）
- モバイル対応
