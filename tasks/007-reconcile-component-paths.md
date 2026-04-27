# タスク: NoteCard / CopyButton / DeleteButton / NoteEditor のパス不整合解消

## 背景

設計書は **`module:editor` 帰属**として `src/editor/NoteCard.svelte` 等を指しているが、実アプリで使われているのは [`src/feed/`](src/feed/) 配下の同名ファイル群。`src/editor/` には `codd assemble` 再編（commit `4161039`）で `src/feed/` に移された後の旧ファイルが orphan として残存している。

このまま放置すると：

- `codd implement` 系を再走させると設計書通り `src/editor/` に再生成され、orphan を再び増やす
- 仕様変更が下流に伝播する際、どちらのファイルを直すべきか曖昧になる
- 新規参画者が orphan のほうを編集してしまうリスクがある

## 検出ドリフトの実態

### live コード側の事実

- **`src/feed/Feed.svelte`** の import 元はすべて `./` 相対（つまり `src/feed/` 配下）：
  - `import NoteCard from "./NoteCard.svelte";`
  - 他コンポーネントも同様
- 実アプリで使われている UI コンポーネント:
  - [`src/feed/NoteCard.svelte`](src/feed/NoteCard.svelte)
  - [`src/feed/CopyButton.svelte`](src/feed/CopyButton.svelte)
  - [`src/feed/DeleteButton.svelte`](src/feed/DeleteButton.svelte)
  - [`src/feed/NoteEditor.svelte`](src/feed/NoteEditor.svelte)
  - 加えて [`src/feed/Feed.svelte`](src/feed/Feed.svelte) / [`src/feed/Header.svelte`](src/feed/Header.svelte) / フィルタ系・ストア系
- `src/editor/` で **alive（ドリフトなし）**:
  - [`src/editor/frontmatter.ts`](src/editor/frontmatter.ts) ← `src/feed/CopyButton.svelte` と unit tests から参照中
  - [`src/editor/frontmatter-decoration.ts`](src/editor/frontmatter-decoration.ts) ← `src/feed/NoteEditor.svelte` から参照中
- `src/editor/` で **orphan（dead code）**:
  - [`src/editor/NoteCard.svelte`](src/editor/NoteCard.svelte)
  - [`src/editor/CopyButton.svelte`](src/editor/CopyButton.svelte)
  - [`src/editor/DeleteButton.svelte`](src/editor/DeleteButton.svelte)
  - [`src/editor/NoteEditor.svelte`](src/editor/NoteEditor.svelte)

### 設計書側の事実

設計書は 4 ファイルすべてを `src/editor/` 配下と記述：

- `docs/detailed_design/component_architecture.md:403` — `src/editor/NoteCard.svelte` を `module:editor` の所有物として明記
- `docs/detailed_design/editor_clipboard_design.md:40` — 同上
- `docs/plan/implementation_plan.md:386` — Sprint 1 の成果物パスとして `src/editor/NoteCard.svelte`
- `docs/plan/implementation_plan.md:485` — Sprint 5 で `src/editor/NoteCard.svelte` に検索表示対応を追加
- 他、`component_architecture.md` 内の Mermaid 図 / シーケンス図にも `src/editor/` を含む記述あり

## 修正方向の選択（着手時にユーザーと確認）

本タスクは 2 つの方向のどちらかを選ぶ意思決定を含む。実装者は仕様を独断で動かさず、ユーザーに確認すること（spec is source of truth）。

### A) 仕様 → 実装方向（推奨候補）

**設計書の `module:editor` 帰属を維持し、実装ファイルを `src/editor/` に戻す。**

手順:

1. `src/editor/{NoteCard,CopyButton,DeleteButton,NoteEditor}.svelte` の orphan を削除（実体は古い）
2. `src/feed/{NoteCard,CopyButton,DeleteButton,NoteEditor}.svelte` を `src/editor/` 配下に `git mv`
3. `src/feed/Feed.svelte` の import パスを `./NoteCard.svelte` → `../editor/NoteCard.svelte` 等に更新
4. `src/feed/CopyButton.svelte` / `src/feed/NoteEditor.svelte` 内の相対参照（`../editor/frontmatter` 等）を新しい配置に合わせて修正
5. テストヘルパーや E2E 内のセレクタにファイルパスが含まれていないことを確認（基本含まれないはず）

利点:
- 設計書の module ownership と物理配置が一致する
- `codd implement` を将来再走させても整合する
- 設計書側の修正は不要

欠点:
- 物理ファイル移動が 4 件発生し、相対 import 修正と E2E 非リグレッション確認が必要

### B) 実装 → 仕様方向

**設計書のパス記述を `src/feed/...` に書き換え、`src/editor/` 配下の orphan を削除する。**

手順:

1. `src/editor/{NoteCard,CopyButton,DeleteButton,NoteEditor}.svelte` の orphan を削除
2. 設計書 4 箇所のファイルパス文字列を `src/editor/...` → `src/feed/...` に置換：
   - `docs/detailed_design/component_architecture.md`（L403、図中の記述）
   - `docs/detailed_design/editor_clipboard_design.md`（L40、図中の記述）
   - `docs/plan/implementation_plan.md`（L386、L485、その他）
3. `module:editor` の物理配置として `src/feed/` 配下を許容する旨を `system_design.md` または `component_architecture.md` の冒頭に注記する（モジュール帰属は意味的、物理ディレクトリは別軸という解釈）。

利点:
- 物理ファイル移動が不要、import 文の変更も不要
- E2E への影響なし

欠点:
- module ownership の意味的所有（`module:editor`）と物理配置（`src/feed/`）が乖離した状態が固定化する
- `codd implement` を将来走らせる場合、`source_dirs` 等の設定で「`module:editor` の実装は `src/feed/` に出力する」マッピングを追加する必要がある可能性

### 推奨

**A）が筋が通る**: module ownership と物理配置が一致するため、新規参画者の混乱を減らせる。`codd implement` が `src/editor/` を期待している現状とも整合する。実装作業は git mv + import パス更新のみで、変更内容は機械的（リファクタリングのみ、ロジック変更なし）。

ただし最終判断はユーザーに委ねる。着手時に上記を提示してから A / B を確定すること。

## 検証

- ビルド: `pnpm tauri build --no-bundle` で起動確認
- ユニット/E2E: 既存スイートが全件通過すること（`pnpm test` / `pnpm wdio` 等プロジェクトのコマンドで）
- `codd validate`: pre-commit hook が通ること
- A) を選んだ場合は `codd propagate` でコード変更が設計書のパス記述と一致することを確認できる

## CoDD ハンドリング

- A) の場合: 設計書の本文（`source_dirs` や `node_id`）には触らないこと。ファイル移動は git mv のみ
- B) の場合: 設計書本文のパス文字列のみを書き換える。frontmatter の `node_id` / `depends_on` には触らない

## コミットメッセージ

```
refactor: NoteCard 系コンポーネントを src/editor/ に集約しパス整合 (タスク 007)

- src/feed/{NoteCard,CopyButton,DeleteButton,NoteEditor}.svelte を src/editor/ に git mv
- src/editor/ 配下の orphan 4 ファイル（codd assemble 再編残骸）を削除
- src/feed/Feed.svelte 等の import パスを ../editor/ 相対に更新
- 設計書 (component_architecture / editor_clipboard / implementation_plan) との module:editor 帰属を一致
```

（B) を選んだ場合のメッセージ例:

```
docs: NoteCard 系のパス記述を src/feed/ に整合 + orphan 削除 (タスク 007)

- 設計書のファイルパス記述を src/editor/ → src/feed/ に更新
- src/editor/ 配下の orphan 4 ファイルを削除
- module:editor の物理配置として src/feed/ を許容する旨を注記
```

## 制約

- このタスクは `tasks/008-implement-card-max-height.md`（カード max-height の実装）の前提となる。008 着手前に本タスクを完了させること
- 設計書の方針判断（A vs B）は必ずユーザーに確認する。独断で進めない
- E2E テストは多数の DOM セレクタを `data-testid` で参照しているはず。ファイル移動だけで `data-testid` 値が変わらない限り破壊しないが、念のため `pnpm wdio` で全件パスを確認する
