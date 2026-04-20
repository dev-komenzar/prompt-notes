# 003: README.md の生成 (SSOT)

## 目的

このドキュメントを `README.md` および `README_ja.md` の **唯一の真実 (Single Source of Truth)** とする。README 本体は本ドキュメントの指示に従って Claude が生成/更新する生成物であり、README を直接手編集してはならない。変更は必ず本ドキュメント側に加え、そこから再生成する。

## 生成物

- `README.md` (英語・デフォルト)
- `README_ja.md` (日本語)
- `.claude/commands/readme.md` (スラッシュコマンド定義、本タスクの付随成果物)

## 生成・更新方法

### スラッシュコマンド (推奨)

Claude Code 上で:

```
/readme
```

`.claude/commands/readme.md` に定義された固定プロンプトが本ドキュメントを読み込んで生成/更新を行う。

### フォールバック (Claude Code 以外、または slash コマンド未展開の環境)

以下のプロンプトをそのまま Claude に渡す:

```
tasks/003-make-readme.md に従って README.md と README_ja.md を生成/更新して
```

## 運用ルール (Claude への指示)

### 生成対象と言語方針

- `README.md` (英語) と `README_ja.md` (日本語) を **並列生成** する。片方の翻訳ではない。
- 各 `R-<SECTION>-<NN>` 項目の「意味内容」を両言語それぞれ自然な表現に起こす。直訳調を避ける。
- 差分適用時は **両言語の該当項目を同時に** 書き換える。片方だけ更新する運用は禁止。

### 差分適用ワークフロー (項目単位)

- 変更された `[R-SECTION-NN]` に対応する README 内の段落のみ `Edit` ツールで書き換える。
- 変更されていない項目に対応する段落は **一切触らない** (改行・語尾・句点も含めて保持)。
- 新規追加された項目は、同セクション内の記述順に対応する位置に段落を追加する。
- 削除された項目は、対応する段落を削除する。
- 初回生成 (README.md / README_ja.md のいずれか、または両方が未存在) の場合に限り、全項目から両言語 README を一括生成する。

### 採番規約

- 項目 ID は `R-<SECTION>-<NN>` 形式 (`SECTION` は大文字略称、`NN` は 2 桁ゼロパディング)。
- 出力順 = 本ドキュメント内の項目記述順 (番号の昇順ではない)。番号は identity として固定し、並び替え時に番号は変更しない。
- 削除は欠番化する。削除済み番号は再利用しない。
- 追加は該当セクション内の既存最大番号 + 1。
- 新セクション追加時は新しい `SECTION` prefix を使い `01` から開始する。

### スクリーンショット取り扱い

- 画像の置き場所: `docs/images/`
- 参照形式: 相対パス + HTML `<img>` タグで横幅を制御する (例: `<img src="docs/images/main-view.png" width="720" alt="PromptNotes main view">`)。
- 画像が未配置の場合は、該当箇所に HTML コメント `<!-- TODO: screenshot pending -->` を配置して生成を完遂する。

### 禁止事項

- `docs/requirements/requirements.md` に記載されていない機能を README に書かない。特に Configuration セクションでは requirements に未記載の設定項目を追加することは禁止。実装で観測できる機能でも、requirements に無ければ requirements 更新タスクを先に起こすこと。
- 欠番の再利用禁止。
- 変更されていない `R-XXX-NN` に対応する段落の書き換え禁止 (揺り戻しによる無意味な差分の発生を防ぐ)。
- README.md / README_ja.md の手編集禁止。変更は本ドキュメントに加えてから再生成する。

## セクション定義

### About

- **[R-ABOUT-01]** 製品定義を 1 文で示す: 「AI へ渡すプロンプトを素早く書き溜めるためのノートアプリ」。タイトル不要・本文のみ・即次へ、というキャッチを併記する。
- **[R-ABOUT-02]** 想定用途と想定ユーザを 2-3 行で述べる: ターミナルや IDE にプロンプトをペーストする用途、AI 呼び出し機能は持たないこと、プロンプトの使い回しや振り返りをしたい開発者が主ユーザ。
- **[R-ABOUT-03]** コア UX を箇条書きで示す: `Cmd+N` / `Ctrl+N` で即座に新規ノート、ワンクリックコピーで貼り付け先へ、トップフィードで過去ノートを振り返り。
- **[R-ABOUT-04]** **差別化ポイントとしての Obsidian 互換性** を強調する: ノートはローカルの Markdown ファイル (`.md`) として保存され、frontmatter は標準 YAML 形式。Obsidian vault 内のサブディレクトリを保存先に指定すれば、同じノートを PromptNotes と Obsidian の双方から編集できる。Git でのバージョン管理もそのまま使える。
- **[R-ABOUT-05]** 技術スタックを 1 文で: Tauri (Rust + WebView) + Svelte + CodeMirror 6。Electron よりも軽量なバイナリとメモリフットプリント。
- **[R-ABOUT-06]** スコープ外を明示する: AI 呼び出し機能なし、クラウド同期なし、タイトル欄なし、Markdown レンダリング (プレビュー) なし、モバイル対応なし。
- **[R-ABOUT-07]** メイン画面 (トップフィード) のスクリーンショットを 1 枚配置する。パスは `docs/images/main-view.png`。未配置時は `<!-- TODO: screenshot pending -->` で代替。

### Install

- **[R-INSTALL-01]** "Installing prebuilt binaries" を最初に置き、`🚧 Not yet published. Tracked in Roadmap below.` を明記する。GitHub Releases が公開されたらこの項目を URL + `.AppImage` / `.dmg` のダウンロード手順に置き換える。
- **[R-INSTALL-02]** Flatpak (Flathub) は `Planned. See docs/requirements/requirements.md §配布方式.` のスタブ記述のみ。
- **[R-INSTALL-03]** Homebrew Cask は `Planned.` のスタブ記述のみ。
- **[R-INSTALL-04]** Nix (NixOS / flake) は `Planned.` のスタブ記述のみ。
- **[R-INSTALL-05]** "Building from source" セクションで以下を示す:
  - 前提: Rust stable toolchain、Node.js 20 以降、npm。システム依存 (webkit2gtk、libsoup 等) は [Tauri v2 Prerequisites](https://v2.tauri.app/start/prerequisites/) へリンク。
  - 手順: `git clone` → `npm install` → `npm run tauri build`。
  - 成果物の場所 (`src-tauri/target/release/bundle/...`) と実行方法を示す。
- **[R-INSTALL-06]** 開発者向け実行として `npm run tauri dev` (ホットリロード付き) を紹介する。

### Usage

- **[R-USAGE-01]** Quick start ストーリーを 3-5 行で示す: アプリ起動 → `Cmd+N` / `Ctrl+N` で新規ノート → 本文を書く (タイトル不要、自動保存) → ワンクリックコピーで貼り付け先へ → 次のノートへ。
- **[R-USAGE-02]** キーボードショートカット:
  - 確定記載: `Cmd+N` (macOS) / `Ctrl+N` (Linux) で新規ノート作成。
  - それ以外のショートカットは現状 requirements に未記載の範囲では追加しない。実装 grep で追加ショートカットが見つかった場合のみ `docs/requirements/requirements.md` 更新を経由して追記する (実装 grep だけで README に追加することは禁止)。
- **[R-USAGE-03]** トップフィードの操作: 直近 7 日のノートが時系列で一覧表示される、タグフィルタ、日付フィルタ、全文検索 (ファイル全走査)、カード/行クリックでエディタ画面に遷移。
- **[R-USAGE-04]** ノートのファイル形式と Obsidian 連携:
  - ファイル名: `YYYY-MM-DDTHHMMSS.md` (作成時タイムスタンプのみ、タイトル不要)。
  - frontmatter: `tags: [gpt, coding]` の YAML 形式。メタデータは tags のみ (作成日時はファイル名から取得)。
  - 運用例: 保存先を Obsidian vault 内のサブディレクトリ (例: `~/ObsidianVault/PromptNotes/`) に指定することで、同じノートを Obsidian からも開いて読める。
- **[R-USAGE-05]** エディタ画面のスクリーンショットを 1 枚配置する。パスは `docs/images/editor.png`。frontmatter 領域の背景色の違いが視認できる構図。未配置時は `<!-- TODO: screenshot pending -->` で代替。

### Configuration

- **[R-CONFIG-01]** 保存ディレクトリの変更方法: アプリ内の設定画面を開き、保存先パスを選択する。変更は即時反映される。
- **[R-CONFIG-02]** OS 別のデフォルト保存パス:
  - Linux: `~/.local/share/promptnotes/notes/`
  - macOS: `~/Library/Application Support/promptnotes/notes/`
- **[R-CONFIG-03]** Obsidian 連携の具体例: 保存先を `~/ObsidianVault/PromptNotes/` のような vault 内サブディレクトリに指定する。Obsidian 側からも同じ `.md` ファイルを開けるため、閲覧・タグ編集・Git 管理が併用できる。
- **[R-CONFIG-04]** アプリ設定ファイル (保存先パス等の永続化先) の場所を示す。初回生成時は `src-tauri/` 配下の実装 (Tauri の `app_config_dir` 参照箇所) を grep して確定させること。暫定値:
  - Linux: `~/.config/promptnotes/` 配下
  - macOS: `~/Library/Application Support/promptnotes/` 配下
- **[R-CONFIG-05]** 注意書き: 本セクションに `docs/requirements/requirements.md` に存在しない設定項目 (未記載のグローバルショートカット、フォント、エディタ個別設定等) を追加してはならない。実装側に機能があっても、requirements 更新を先に行うこと。

## 本タスクの完遂条件

- 本ドキュメント (`tasks/003-make-readme.md`) の運用ルールとセクション定義が揃っている。
- `.claude/commands/readme.md` が作成され、`/readme` コマンドで本ドキュメントを駆動できる。
- `README.md` および `README_ja.md` の初回生成が完了している。
- `docs/images/` が存在する (画像が未配置でも該当参照は `<!-- TODO: screenshot pending -->` で埋まっている)。

## 関連

- 仕様: `docs/requirements/requirements.md` (上流)
- 画像: `docs/images/`
- スラッシュコマンド: `.claude/commands/readme.md`
- 既存タスク: `tasks/001-vitest-runner-setup.md`, `tasks/002-vitest-scope-and-failing-tests.md`
