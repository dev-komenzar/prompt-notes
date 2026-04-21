# PromptNotes

> AI へ渡すプロンプトを素早く書き溜めるためのノートアプリ。タイトル不要、本文だけ。書いたらすぐ次へ。

<!-- R-ABOUT-07 -->
<!-- TODO: screenshot pending -->
<img src="docs/images/main-view.png" width="720" alt="PromptNotes メイン画面 — 最近のノートのトップフィード">

## About

<!-- R-ABOUT-01 -->
PromptNotes は、AI ツールに渡すプロンプトを素早く書き溜めるためのデスクトップ向けノートアプリです。タイトル欄はなく、本文だけを書きます。書いたらすぐ次へ。必要なときだけ過去のプロンプトを引き出せばよい、という割り切りです。

<!-- R-ABOUT-02 -->
ターミナル・IDE・チャット UI にプロンプトをペーストして使う開発者が主な対象です。プロンプトを下書きし、使い回し、振り返る場所として設計しています。PromptNotes は意図して AI を呼び出す機能を持ちません。あくまで「プロンプトを置く場所」であり、プロンプトを実行するクライアントではありません。

<!-- R-ABOUT-03 -->
コア UX:

- **`Cmd+N` / `Ctrl+N`** で即座に新規ノートを作成し、エディタにフォーカスが移ります。
- **ワンクリックコピー** で本文全体をクリップボードに取り、好きなツールに貼り付けられます。
- **トップフィード** で最近のノートを一覧し、絞り込み・再オープンできます。

<!-- R-ABOUT-04 -->
**Markdown ファイルで、どこにでも置けます。** ノートはすべて標準 YAML frontmatter 付きの `.md` ファイルとしてローカルに保存されます。保存先を Obsidian vault 内のサブディレクトリに指定すれば、同じノートを両方のアプリから開けます。Obsidian でタグを整理し、PromptNotes でプロンプトを書き、両方をそのまま Git 管理する、といった使い方ができます。独自ストアにロックインされません。

<!-- R-ABOUT-05 -->
Tauri (Rust + WebView) + Svelte + CodeMirror 6 で実装しています。Electron 系の代替に比べてバイナリサイズとメモリフットプリントが軽量です。

<!-- R-ABOUT-06 -->
**スコープ外（意図的に含めていません）:** AI 呼び出し機能、クラウド同期、タイトル欄、Markdown のレンダリング/プレビュー、モバイル対応。

## Install

<!-- R-INSTALL-01 -->
### ビルド済みバイナリのインストール

🚧 **未公開です。** 下記ロードマップで管理しています。GitHub Releases が公開され次第、このセクションは `.AppImage`（Linux）と `.dmg`（macOS）のダウンロードリンクに置き換わります。

<!-- R-INSTALL-02 -->
### Flatpak (Flathub)

Planned（計画中）。[`docs/requirements/requirements.md`](docs/requirements/requirements.md) §配布方式 を参照してください。

<!-- R-INSTALL-03 -->
### Homebrew Cask

Planned（計画中）。

<!-- R-INSTALL-04 -->
### Nix (NixOS / flake)

Planned（計画中）。

<!-- R-INSTALL-05 -->
### ソースからビルドする

**前提**

- Rust stable ツールチェーン（[rustup](https://rustup.rs/) 経由）
- Node.js 20 以降
- npm
- Tauri v2 に必要なシステムライブラリは、プラットフォームごとに [Tauri v2 Prerequisites](https://v2.tauri.app/start/prerequisites/) を参照してください（Linux なら `webkit2gtk`、`libsoup` など。macOS なら Xcode Command Line Tools）。

**ビルド**

```sh
git clone https://github.com/dev-komenzar/promptnotes.git
cd promptnotes
npm install
npm run tauri build
```

成果物は `src-tauri/target/release/bundle/` 配下に生成されます:

- Linux: `bundle/appimage/PromptNotes_<version>_amd64.AppImage`, `bundle/deb/...`
- macOS: `bundle/macos/PromptNotes.app`, `bundle/dmg/...`

バンドルを経由せずリリースバイナリを直接実行する場合は `./src-tauri/target/release/promptnotes` を叩きます。

<!-- R-INSTALL-06 -->
### 開発環境で動かす

```sh
npm run tauri dev
```

フロントエンドは Vite のホットリロード、Rust 側は `cargo run` で起動します。

## Usage

<!-- R-USAGE-01 -->
### クイックスタート

1. PromptNotes を起動する。
2. **`Cmd+N`**（macOS）または **`Ctrl+N`**（Linux）で新規ノートを作成。ファイル名もタイトルも不要で、そのまま書き始められます。
3. 書いた内容は自動的に保存されます。
4. **コピー**ボタンで本文全体をクリップボードに取り、AI ツールへ貼り付けます。
5. もう一度 `Cmd+N` / `Ctrl+N` で次のノートへ。

<!-- R-USAGE-02 -->
### キーボードショートカット

**新規作成**

| ショートカット | 動作 |
| --- | --- |
| `Cmd+N`（macOS） / `Ctrl+N`（Linux） | 新規ノートを作成 |

**フィード内カード操作** — カードフォーカス状態またはフォーカスなし状態で有効

| ショートカット | 動作 |
| --- | --- |
| `↑` / `↓` | 隣のカードへフォーカス移動。フォーカスなし状態から押下するとフィード先頭（最新カード）にフォーカス。最下部で `↓` はより古いノートを追加ロード（古いノートがなければ何もしない） |
| `Enter` | フォーカス中のカードを編集モードに遷移 |
| `Esc`（カードフォーカス状態） | フォーカスを外す（どこにもフォーカスがない状態） |
| `c` | フォーカス中のカード本文をクリップボードへコピー（Copy ボタンと同じ動作） |
| `d` または `Delete` | フォーカス中のノートを即時削除（確認ダイアログなし）。削除後は下のカードへフォーカス、なければ上、全削除ならフォーカスなし |

**編集モードから抜ける**

| ショートカット | 動作 |
| --- | --- |
| `Esc`（編集モード中） | 自動保存して表示モードに戻る。フォーカスはそのカードに残る |

矢印キーによるカード移動はカードフォーカス状態／フォーカスなし状態でのみ有効です。編集モード中は CodeMirror 内のカーソル移動、検索バーにフォーカスがある時はテキスト入力／フィルタ操作に使われます。

それ以外のショートカットは `docs/requirements/requirements.md` に追記されたタイミングで本セクションにも反映します。

<!-- R-USAGE-03 -->
### トップフィード

トップフィードは最近のノートを時系列順（新しい順）に並べます。デフォルトでは直近 7 日分を表示します。フィード上では以下の操作ができます:

- **タグ**で絞り込み。
- **日付**で絞り込み。
- すべてのノートを対象にした**全文検索**（PromptNotes は検索のたびにディレクトリを走査します。想定するプロンプト量なら十分高速です）。
- ノートをクリックするとエディタに戻ります。

<!-- R-USAGE-04 -->
### ノートのファイル形式と Obsidian 連携

各ノートは 1 ファイル 1 `.md` で保存されます:

```
~/.local/share/com.promptnotes/notes/
└── 2026-04-19T143205.md
```

ファイル名の形式は `YYYY-MM-DDTHHMMSS.md`。作成時のタイムスタンプがそのまま識別子で、別途タイトル欄は持ちません。

ファイルの中身:

```markdown
---
tags: [gpt, coding]
---

ここに本文を書きます...
```

frontmatter は標準的な YAML 形式で、メタデータとして保存するのは `tags` のみです（作成日時はファイル名から取得します）。

**Obsidian 連携の典型例。** 保存先を Obsidian vault 内のサブディレクトリ（例: `~/ObsidianVault/PromptNotes/`）に指定すれば、両方のアプリが同じ `.md` ファイルを読み書きします。Obsidian 側でタグ編集、PromptNotes 側でプロンプト執筆、そして両方をまとめて Git 管理、といった運用が可能です。

<!-- R-USAGE-05 -->
<!-- TODO: screenshot pending -->
<img src="docs/images/editor.png" width="720" alt="PromptNotes エディタ — 本文上部に frontmatter 領域が色分けされている">

## Configuration

<!-- R-CONFIG-01 -->
### 保存ディレクトリの変更

アプリ内の設定画面を開き、新しい保存先を選択します。変更は即時反映され、以後のノートは新しい場所に書き込まれます。

<!-- R-CONFIG-02 -->
### OS 別のデフォルト保存パス

| OS | デフォルトディレクトリ |
| --- | --- |
| Linux | `~/.local/share/com.promptnotes/notes/` |
| macOS | `~/Library/Application Support/com.promptnotes/notes/` |

これらのパスは Tauri の `app_data_dir()` API と、ADR-010 で固定した bundle identifier `com.promptnotes` から導出しています。

<!-- R-CONFIG-03 -->
### Obsidian vault を保存ディレクトリとして使う

既存の Obsidian vault 内のサブディレクトリを保存先に指定するのが実用的な構成です:

```
~/ObsidianVault/PromptNotes/
```

こうすると、PromptNotes でプロンプトを書き、Obsidian のグラフ/タグビューで眺め、vault ごと Git に載せる、という一連の流れをそのまま続けられます。

<!-- R-CONFIG-04 -->
### アプリが使うデータディレクトリ

PromptNotes は Tauri のプラットフォーム別アプリケーションデータディレクトリ配下にデータを置きます:

| OS | アプリケーションデータディレクトリ |
| --- | --- |
| Linux | `~/.local/share/com.promptnotes/` |
| macOS | `~/Library/Application Support/com.promptnotes/` |

このディレクトリ直下の `notes/` サブフォルダが前述のデフォルト保存先で、その他アプリが生成するファイルもこの配下に置かれます。

<!-- R-CONFIG-05 -->
> **備考。** このセクションには仕様書に記載のある設定項目のみを掲載しています。グローバルショートカットの割り当て、エディタテーマ、フォント、エディタ個別の設定などは、実装側に存在していても仕様書に載らないかぎり意図的に省略しています。必要な設定があれば、まず仕様書を更新してください。本セクションはそれに追随します。

---

🇺🇸 English: [README.md](README.md)
