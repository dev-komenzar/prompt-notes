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

本 ADR は PromptNotes の技術スタック選定における意思決定を記録する。PromptNotes は「AI へ渡すプロンプトを素早く書き溜める」ローカルファースト・ノートアプリであり、1 画面フィード UI 上でノートの作成・編集・コピーを完結させる。ターミナルや IDE へのペーストを主用途とし、AI 呼び出し機能・クラウド同期・モバイル対応はスコープ外とする。

本ドキュメントは以下のリリース不可制約（Non-negotiable conventions）に準拠する。

| 制約 ID | 対象 | 内容 | 本ドキュメントでの準拠箇所 |
|---|---|---|---|
| framework:tauri | フレームワーク | Tauri（Rust + WebView）は確定済み。Electron 等への変更はリリース不可。 | Decision Log ADR-001 |
| module:editor | エディタエンジン | CodeMirror 6 は確定済み。Monaco 等への変更はリリース不可。 | Decision Log ADR-002 |
| module:storage | データ保存方式 | ローカル `.md` ファイル保存は確定済み。DB・クラウド保存は禁止。 | Decision Log ADR-003 |
| module:storage / module:editor | body 意味論と往復冪等性 | body は frontmatter 閉じフェンスおよびその直後の区切り `\n` を含まない。parse→reassemble は冪等であること。 | Decision Log ADR-008 |

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
  - Linux: `~/.local/share/com.promptnotes/notes/`
  - macOS: `~/Library/Application Support/com.promptnotes/notes/`
  - デフォルトパスは ADR-010 で固定する Tauri bundle identifier `com.promptnotes` と `app_data_dir()` から一意に導出される。`app_data_dir()` の返す `<DATA>/<identifier>/` に `notes/` を結合した結果が上記リテラルパスと一致することを不変条件とする。アプリケーションコードはこのデフォルト解決ロジックを `src-tauri/src/config/mod.rs` に集約し、他モジュールはこのデフォルト値を受け取るだけで自前で OS 別パスを組み立ててはならない。
- **設定による変更**: 設定モーダルから任意のディレクトリに変更可能。ただし以下の不可侵条項を満たす:
  1. **2 段階確定** — 保存ディレクトリの変更は「参照で候補を選ぶ（pending）」と「Apply で確定」の 2 ステップに分離する。参照した瞬間に `config.json` を書き換えてはならない。
  2. **既存ノート移動は明示同意必須** — 旧ディレクトリから新ディレクトリへのノート移動は、ユーザーが明示的にチェックボックスで選択し、かつ二次確認ダイアログ「元のディレクトリから削除されます。元に戻せません。実行しますか？」に同意した場合に限り実行する。既定は「移動しない」であり、非 `.md` ファイルは常に対象外とする。
  3. **移動は 3 フェーズで実行** — コピー（全件成功まで `config.json` を書き換えない）→ `config.json` を atomic write（tmp → fsync → rename）→ 旧 `.md` 削除。`config.json` 書き換えを唯一の不可逆境界（point of no return）とし、それ以前の失敗は旧ディレクトリを無傷のまま status quo に復元する。
  4. **起動時にディレクトリが不在でも自動フォールバックしない** — errno を `ENOENT` / `EACCES` / `EIO`/`ENODEV`/`ESTALE` / `ENOTDIR` の 4 分類に分け、UI でそれぞれに応じたメッセージを表示した上で、ユーザーに `[再試行] / [別のディレクトリを選ぶ] / [デフォルトに戻す]` の 3 択を提示する。自動でデフォルトに戻す挙動は禁止する（一時的不在の外付けディスク/NFS のケースで設定が勝手に失われるため）。
  5. **既存ノートの非改変原則** — 上記明示同意による移動オプション以外では、設定変更に伴ってユーザーのノートファイルを自動で移動・削除・改変してはならない。
- **却下した選択肢**:
  - **SQLite** — 他ツールとの相互運用性が損なわれる。Git でのバージョン管理が困難。
  - **クラウドストレージ** — スコープ外（クラウド同期は明示的に含まない）。リリース不可制約により禁止。
  - **コピー方式（旧を残す）を既定または唯一の選択肢にする** — ノートが 2 箇所に散在し、ユーザーが「どちらが正か」を判断する認知負荷が発生する。移動を選べることで「完全に引っ越す」ユースケースに対応しつつ、既定を「移動しない」にすることで誤操作事故を防ぐ。

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

### ADR-007: メタフレームワーク — SvelteKit を採用しない

- **ステータス**: 確定
- **決定日**: 2026-04-15
- **コンテキスト**: ADR-002 で Svelte を採用した際、メタフレームワーク SvelteKit の採否を明文化していなかった。現状の実装はプレーン Svelte + Vite（`@sveltejs/vite-plugin-svelte`）で構成されているが、`src/routes/` 配下に SvelteKit 規約ファイル（`+page.svelte` 等）がスキャフォールディング残骸として残存し、依存関係（`@sveltejs/kit`, `@sveltejs/adapter-static`）も未使用のまま混入する状態が発生していた。将来複数ページ構成への拡張可能性を見据え、採否と理由を明確化する。
- **決定**: SvelteKit を採用せず、プレーン Svelte + Vite 構成を維持する。`src/main.ts` から `App.svelte` を手動マウントし、状態遷移はコンポーネント内部とストアで管理する。
- **根拠**:
  - **サーバ機能が構造的に使用不能** — ADR-004（ローカル `.md` ファイル保存）およびネットワーク禁止方針により CSP `connect-src 'none'` を設定する。SvelteKit の主要価値である SSR・`+page.server.ts` エンドポイント・`load` 関数によるデータフェッチは全て不可能。
  - **永続化は Tauri IPC に統一済み** — フロントエンドからのファイルシステム直接アクセスは禁止され、全操作は `tauri-commands.ts` 経由の IPC で実行する。SvelteKit サーバ側の代替機能はアーキテクチャ上 Rust バックエンドが担っており、二重化のメリットがない。
  - **ルーティング要件が現時点で存在しない** — requirements の「1 画面完結」コンセプトにより URL ベース遷移・複数ページモデルを要求する要件はない。現状の ViewMode/EditMode 切替は状態ベースで完結している。
  - **バイナリサイズ優位性の維持** — ADR-002 採用根拠の「Tauri のバイナリサイズ優位性を活かす」に逆行するランタイム追加を避ける。
- **却下した選択肢**:
  - **SvelteKit + adapter-static（SPA モード）** — ファイルベースルーティングの DX は魅力だが、サーバ機能を使えない以上ルーティングライブラリ以上の価値を持たず、依存増加とビルド複雑化に見合わない。
- **将来複数ページ構成が必要になった場合の代替手段**:
  - **ルーティングが必要になった時点で `svelte-spa-router` を採用する。** ハッシュベースルーティングにより Tauri のカスタムスキーム（`tauri://localhost`）と整合し、History API 由来のディープリンク/リロード落とし穴を回避できる。reactive store + `{#if}` ブロックによる手書きルーターはルート数が増えた際の保守コストが高いため採用しない。
  - **独立ウィンドウが必要な画面**: Tauri Multi-Window（`tauri.conf.json` の `windows` 配列）で別ウィンドウとして扱う。`svelte-spa-router` による URL ルーティングとは直交する選択肢であり、両者は併用可能。
  - いずれの場合も CodeMirror 6 インスタンスの destroy → recreate ライフサイクル（Component Architecture §4 準拠）をルート遷移時の `onDestroy` で明示的に扱う必要がある。
- **実装上の要件**:
  - `package.json` に `@sveltejs/kit` および `@sveltejs/adapter-static` を含めない。
  - `svelte.config.js` は `vitePreprocess()` のみを使用し、SvelteKit アダプタを設定しない。
  - `vite.config.ts` は `@sveltejs/vite-plugin-svelte` の `svelte()` プラグインを使用し、`sveltekit()` プラグインは使用しない。
  - `src/routes/` ディレクトリは設置しない（SvelteKit 規約との混同を避けるため）。

### ADR-008: ノートファイル本文（body）の意味論と往復冪等性

- **ステータス**: 確定（変更不可・リリース不可制約）
- **決定日**: 2026-04-15
- **コンテキスト**: ADR-004 で確定した `.md` ファイル構造（YAML frontmatter + 本文）における、frontmatter と body の境界定義を ADR レベルで明文化していなかった。結果として Rust (`src-tauri/src/storage/frontmatter.rs`) と TypeScript (`src/lib/frontmatter.ts`, `tests/unit/frontmatter.ts`) の 3 つの実装で body の解釈が非対称となり、ノートを開閉するたびに本文先頭に `\n` が累積するバグが発生した（保存側の `reassemble` が `\n` を追加する一方、パース側は閉じフェンス直後の `\n` を body に含める状態）。本 ADR は body 意味論を単一の仕様として固定し、実装間の非対称性を再発させないためのリリースブロッキング制約として定める。
- **決定**:
  1. **body の定義**: ファイル内容のうち、frontmatter ブロック（開きフェンス `---\n` から閉じフェンス `---\n` まで）と、閉じフェンス直後の **区切り `\n` 1 つ** を除いた残り全体を body とする。
  2. **ファイル上のレイアウト**: ファイル全体は次の形式で正規化される — `---\n<yaml>\n---\n\n<body>`。frontmatter ブロックと body の間に空行 1 行が必ず入る。この空行は frontmatter 側の責務であり、body には含まれない。
  3. **冪等性**: 任意のファイル内容 `C` について、`parse(C)` で得られる `(tags, body)` を `reassemble(tags, body)` に適用した結果 `C'` は、往復前後で本文先頭に改行が追加されない（`parse(C').body == parse(C).body` が成立する）。これを **往復冪等性（round-trip idempotency）** と呼び、Rust および TypeScript 両実装の不変条件とする。
- **根拠**:
  - body の意味論を「区切り `\n` を含まない」方針に統一することで、コピー・プレビュー・検索など body を消費する下流処理で追加の `trim` やガードが不要になる
  - 空行 1 行は frontmatter 側の正規化責務として固定することで、シリアライズ時の改行数を単一の実装で決定できる
  - 冪等性を不変条件として宣言することで、今後の新規実装（例: 別言語バインディング、プラグインエコシステム）でも同一検証ハーネス（round-trip test）で適合性を確認できる
- **実装上の要件**:
  - **Rust** (`src-tauri/src/storage/frontmatter.rs`): `parse` は閉じフェンス `\n---\n` の直後にさらに `\n` が存在する場合、それを body に含めない。`reassemble` は `format!("{}\n{}", fm, body)` のように frontmatter（末尾 `\n` 付き）の後に区切り `\n` を 1 つ追加して body を連結する。
  - **TypeScript スタブ** (`tests/unit/frontmatter.ts`): `splitRaw` は閉じフェンス後の空行（`\n`）を body に含めない。`serializeFrontmatter` は frontmatter と body の間に空行 1 行を挿入する。
  - **TypeScript 本番** (`src/lib/frontmatter.ts`): `extractBody` は現状の `trimStart()` 相当の挙動を維持（閉じフェンス直後の空行を除去）し、`generateNoteContent` は frontmatter と body の間に空行 1 行を挿入する。
  - body が空文字列である場合の正規化結果は `---\n<yaml>\n---\n\n` とする（末尾に空行 1 つを残す）。
- **検証**:
  - **Rust ユニットテスト**: `parse → reassemble → parse` の往復で `(tags, body)` が一致することを表明するテストを `frontmatter.rs` 末尾の `#[cfg(test)] mod tests` に追加する。
  - **TypeScript ユニットテスト**: `parseFrontmatter → serializeFrontmatter → parseFrontmatter` の往復冪等性を `tests/unit/frontmatter.test.ts` に追加する。本番 `src/lib/frontmatter.ts` 側は `generateNoteContent → extractBody → generateNoteContent` の擬似往復冪等性を検証する。
  - **受入基準**: `docs/test/acceptance_criteria.md` の AC-STOR-06（本文往復冪等性）に対応。
- **却下した選択肢**:
  - **body に区切り `\n` を含める方針** — 下流処理で `trimStart()` が必要になり、かつ実装によって `trim` する場所が分散する（本番 TS の `extractBody` のみで吸収するなど）ため、意味論の単一源泉化という本 ADR の目的を達成できない。
  - **空行 1 行を廃止し `---\n<body>` レイアウトに変更する方針** — Obsidian/VS Code など他ツールで開いたときの視認性が低下し、ADR-004 の相互運用性根拠に反する。また既存ファイルのマイグレーションが発生するため、リリース不可制約違反となる。

### ADR-009: フロントエンド未使用コード検出 — knip

- **ステータス**: 確定
- **決定日**: 2026-04-17
- **コンテキスト**: フロントエンド（Svelte / TypeScript）のコードベースにおいて、未使用の変数・import、未使用エクスポート、未使用ファイル／コンポーネントが蓄積するリスクがある。ADR-007 で設置しないと決定した `src/routes/` が残存している事例もあり、継続的に未使用コードを検出する仕組みが必要と判断した。
- **決定**: knip を採用し、ローカル開発時の lint として `npm run lint:unused` で実行可能にする。CI への組み込みは現時点では対象外とする。
- **根拠**:
  - 未使用の変数・import、未使用エクスポート、未使用ファイル／コンポーネントを 1 ツールで包括的に検出できる
  - Svelte / Vite / Vitest のプラグインが公式サポートされており、本プロジェクトの技術スタック（ADR-001〜003）と合致する
  - ESLint を別途導入せずとも未使用コード検出を賄える
- **却下した選択肢**:
  - **ts-prune** — 未使用エクスポートの検出に特化しており、未使用ファイル単位の検出ができない。2023 年以降メンテナンスが停滞している。
  - **unimported** — Svelte コンポーネント（`.svelte` ファイル）のサポートが弱く、誤検出のリスクが高い。
- **実装上の要件**:
  - `package.json` の `devDependencies` に `knip` を追加する。
  - `package.json` の `scripts` に `"lint:unused": "knip"` を追加する。
  - `knip.json`（または `knip.config.ts`）で以下を設定する:
    - `ignore`: `src/generated/**` を除外する（CoDD の `codd implement` が生成する中間成果物であり、`codd assemble` 前は本番コードから参照されないため）。
    - Svelte / Vite / Vitest プラグインを有効化する。
  - `src/routes/` は除外せず、knip が未使用として正しく検出する対象とする（ADR-007 で設置禁止が決定済み）。

### ADR-010: Tauri bundle identifier の固定

- **ステータス**: 確定（変更不可・リリース不可制約）
- **決定日**: 2026-04-19
- **コンテキスト**: Tauri の bundle identifier は `app_data_dir()` / `app_config_dir()` / `app_cache_dir()` の解決先ディレクトリ名を決定する中心的パラメータである。過去に `tauri.conf.json` の `identifier` が `com.promptnotes.app` / `com.promptnotes.desktop` の間で揺れ、加えて実装側が `app_data_dir()` を回避して `dirs::data_dir().join("promptnotes")` をハードコードする事象が発生した結果、`~/.local/share/` 配下に 3 つのデータディレクトリ（`com.promptnotes.app/` / `com.promptnotes.desktop/` / `promptnotes/`）が並立し、ノート資産が分散した。ADR-004 は「Linux: `~/.local/share/promptnotes/notes/`」というリテラルパスを要求しているが、identifier を固定せずに `app_data_dir()` を使用すると identifier 次第で解決先が変わり、リテラル要件と矛盾する。本 ADR は identifier を単一の上流決定として固定し、下流のパス解決・コード実装・インストーラ生成の全てがこの 1 点から導出されることを保証する。
- **決定**: Tauri bundle identifier を `com.promptnotes` に固定する。
  - `src-tauri/tauri.conf.json` の `identifier` フィールドの値は `com.promptnotes` とする。
  - アプリケーションコードからのパス解決は Tauri の `app_data_dir()` / `app_config_dir()` / `app_cache_dir()` を唯一のエントリポイントとし、`dirs::data_dir()` 等の外部クレートで identifier を迂回してはならない。
- **根拠**:
  - `app_data_dir()` の返す `<DATA>/<identifier>/` が Linux で `~/.local/share/com.promptnotes/`、macOS で `~/Library/Application Support/com.promptnotes/` となり、ADR-004 のデフォルト保存ディレクトリ記述と完全に一致する。identifier を上流決定として固定することで、下流のリテラルパス・コード・インストーラ生成物が単一の決定点から導出される構造を確立する。
  - リバース DNS 形式の 2 セグメント `com.promptnotes` はパッケージ署名・ストア登録・他プラットフォーム対応時の衝突リスクが十分低く、かつ `.app` / `.desktop` のような配布形式由来のサフィックスを含まないため、配布形態の変化で identifier が揺らぐ動機を排除できる。
  - identifier をリリース後に変更すると `app_data_dir()` の解決先が切り替わり、既存ユーザーのノート・設定・WebView 状態（Cookie/LocalStorage/IndexedDB）が全て孤児化するため、**初回リリース前に確定させ以降は変更しない**ことをリリース不可制約として宣言する。
- **却下した選択肢**:
  - **`com.promptnotes.app`** — 過去の identifier だが、`.app` サフィックスが macOS の `.app` バンドル拡張子と紛らわしく、また「app でない配布形態（CLI、デーモン）」との区別ができなくなる。既にこの identifier で生成された `~/.local/share/com.promptnotes.app/` は WebView 状態のみを含む過渡的成果物として扱い、ノートは別途 `com.promptnotes/notes/` に移行する。
  - **`com.promptnotes.desktop`** — 過去に一時的に使用されていたが、将来モバイル対応時に `.desktop` が desktop 版固有の識別子になってしまい、デバイス横断の設定共有ができなくなる。
  - **identifier を `app_data_dir()` 回避でバイパス（`dirs::data_dir().join("promptnotes")` 等）** — ADR-004 のリテラル要件とは一見一致するが、Tauri の WebView キャッシュは identifier ベースで生成され続けるため、結局 2 箇所にデータが分散する。identifier を固定しない限り根本解決にならない。
- **実装上の要件**:
  - `src-tauri/tauri.conf.json` の `identifier` は `com.promptnotes` に設定する。
  - `src-tauri/src/config/mod.rs` のデフォルト保存ディレクトリ解決は Tauri の `AppHandle::path().app_data_dir()` を唯一の呼び出し元とする。`dirs` クレート等を用いた OS 別パスのハードコードは禁止する。
  - 過渡的成果物の扱い: 本 ADR 決定以前に `com.promptnotes.app/` / `com.promptnotes.desktop/` 下に生成されたディレクトリは、開発環境のクリーンアップで削除してよい。本番ユーザーに対してはマイグレーションコードを提供しない（初回リリース前決定のため該当ユーザー不在）。
- **検証**:
  - **Rust 統合テスト**: Tauri アプリ起動時の `app_data_dir()` 戻り値が `<DATA>/com.promptnotes/` で終わることをアサートするテストを追加する。
  - **受入基準**: `docs/test/acceptance_criteria.md` の保存ディレクトリ解決セクションに「Linux 上で `~/.local/share/com.promptnotes/` が使用されること」を追加する。

---

## 3. Follow-ups

| ID | 項目 | トリガー条件 | 対応方針 |
|---|---|---|---|
| FU-001 | Windows 対応 | ユーザー需要が一定数に達した場合 | Tauri の Windows ビルド設定を追加し、MSI / NSIS インストーラで配布する。技術スタック自体の変更は不要。 |
| FU-002 | 検索方式の再評価 | ノート件数が 1,000 件を超えた場合 | ファイル全走査のレスポンスタイムを計測し、200 ms を超える場合は tantivy ベースのインデックス検索への移行を検討する。 |
| FU-003 | Svelte メジャーバージョンアップ | Svelte 次期メジャーバージョンリリース時 | 破壊的変更の影響を評価し、移行計画を策定する。CodeMirror 6 との統合部分を重点確認する。 |
| FU-004 | Tauri v2 以降の安定化 | Tauri 新メジャーバージョン安定版リリース時 | API 変更の影響を評価し、ファイルシステムアクセス（`fs` プラグイン）およびクリップボード操作（`clipboard-manager` プラグイン）の互換性を確認する。 |
| FU-005 | CodeMirror 6 プラグインエコシステム監視 | 半年ごとの定期レビュー | Markdown ハイライトパッケージおよび frontmatter カスタマイズ関連の更新を確認し、必要に応じてアップデートする。 |
| FU-006 | SvelteKit 採用の再評価 | 以下のいずれかが発生した場合: (a) 複数ページ構成への要件が追加される、(b) Web 版/ブラウザ配布が要件化される、(c) 動的パラメータを持つルートが 3 件以上発生する | 原則として `svelte-spa-router`（ADR-007 参照）を採用する。SvelteKit 採用は「ファイルベースルーティングの DX が本質的に必要」または「Web 版併売で SSR/プリレンダリングが必要」と判断された場合のみ、ADR-007 を更新する形で新規 ADR として起草する。 |
| FU-007 | `lint:unused` の CI ゲート化 | CI パイプラインを整備した時点 | ADR-009 で導入した `npm run lint:unused`（knip）を CI のチェックに追加し、未使用コードの混入を PR マージ前にブロックする。 |
