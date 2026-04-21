# 004: `tests/e2e/navigation.spec.ts` の新規作成 (AC-NAV-01〜10 の E2E カバレッジ)

## 背景

フィード画面のキーボードナビゲーションは requirements / 設計 / 受入基準の各層で
詳細に規定されているが、E2E テストで**全く検証されていない**。

| 層 | 参照 | 状態 |
|---|---|---|
| SSOT (requirements) | [docs/requirements/requirements.md:147-171](../docs/requirements/requirements.md#L147-L171) — 「キーボードナビゲーション」節 | ✓ 規定済み |
| 設計 | [docs/design/system_design.md:188-216](../docs/design/system_design.md#L188-L216) — `module:keyboard-nav` | ✓ 規定済み |
| 受入基準 | [docs/test/acceptance_criteria.md:271-348](../docs/test/acceptance_criteria.md#L271-L348) — AC-NAV-01〜10 (10 項目) | ✓ 規定済み |
| E2E 戦略 | [docs/test/e2e_strategy.md:104](../docs/test/e2e_strategy.md#L104) — `navigation.spec.ts` で AC-NAV-* を検証すると宣言 | **ファイル不在** |
| E2E 実装 | `tests/e2e/navigation.spec.ts` | **未作成** |
| E2E ヘルパー | `tests/e2e/helpers/keyboard-nav.ts` ([acceptance_criteria.md:726](../docs/test/acceptance_criteria.md#L726) で宣言) | **未作成** |

`tasks/002-vitest-scope-and-failing-tests.md` の区分 B テーブルでは
`tests/e2e/navigation.spec.ts` が存在する前提で除外設定が書かれているが、
実地には ls 済みで**実体は存在しない** (002 執筆時点の想定 or 将来への予約)。
本タスクでその想定を具現化する。

## 対象受入基準

[docs/test/acceptance_criteria.md:271-348](../docs/test/acceptance_criteria.md#L271-L348) の 10 項目を
合計 **19 個のテストケース**に分岐展開して検証する。

| AC ID | テストケース | 概要 |
|---|---|---|
| AC-NAV-01 | 1 | Esc で編集モード終了 → 自動保存 + カードフォーカス残存 |
| AC-NAV-02 | 1 | カードフォーカス状態の背景色視覚表示 (罫線・アウトライン不可) |
| AC-NAV-03 | 1 | カードフォーカス状態で Esc → フォーカスなし状態 |
| AC-NAV-04 | **2** (a/b) | ↓ / ↑ それぞれで隣カードへ移動 |
| AC-NAV-05 | 1 | Enter でフォーカス中カードが編集モードに入る |
| AC-NAV-06 | 1 | `c` キーで本文全体クリップボードコピー + Copy ボタン同等 UX |
| AC-NAV-07 | **4** (a/b/c/d) | 削除連鎖 3 分岐 (下あり / 下なし上あり / 全削除) + Delete キー等価性 |
| AC-NAV-08 | 1 | フォーカスなし → ↑/↓ でフィード先頭にフォーカス |
| AC-NAV-09 | **4** (a/b/c/d) | 矢印キー無効 4 パターン (編集↑ / 編集↓ / 検索↑ / 検索↓) |
| AC-NAV-10 | **3** (a/b/c) | 最上部 ↑ / 最下部 ↓ (古いノートあり) / 最下部 ↓ (古いノートなし) |
| **計** | **19** | (1+1+1+2+1+1+4+1+4+3) |

## 現状調査で判明した実装ギャップ

RED → GREEN の工程を切り分けるため、E2E が通るために必要な実装の有無を事前確認した。

| 領域 | 実装ファイル | 現状 | 必要作業 |
|---|---|---|---|
| カードフォーカス状態 store | `src/lib/stores/focus.ts` ([system_design.md:505](../docs/design/system_design.md#L505) で宣言) | **未作成** | 派生タスクで新規作成 |
| ↑/↓ キーハンドラ | — | **未実装** (grep: `ArrowUp`/`ArrowDown` 一切なし) | 派生タスクで実装 |
| `c` / `d` キーハンドラ | — | **未実装** | 派生タスクで実装 |
| Enter で編集モード遷移 | [src/lib/components/NoteCard.svelte:33](../src/lib/components/NoteCard.svelte#L33) | 部分実装 (クリックと同等の `onClick`、ただしカードフォーカス状態前提は未整備) | 要確認 |
| Esc で編集モード終了 | [src/lib/components/Feed.svelte:44](../src/lib/components/Feed.svelte#L44) | 最低限 (`editingFilename = null` のみ、フォーカス残しなし) | 要補強 |
| 背景色による視覚表示 | — | **未実装** | 派生タスクで実装 |
| `data-focused` 属性 | — | **未導入** | 派生タスクで実装 (本タスクで検出方法を決定・制約として逆流) |

よって本タスクは **E2E テストを書けば大半が RED** になる構造を前提とする。

## スコープ

### スコープ内

1. **`tests/e2e/navigation.spec.ts` の新規作成**
   - 既存 [tests/e2e/keyboard-shortcut.spec.ts](../tests/e2e/keyboard-shortcut.spec.ts) の describe/it スタイルを踏襲
   - `tests/helpers/webview-client.ts` / `tests/helpers/test-fixtures.ts` の API を再利用
   - AC-NAV-01〜10 に対応する **19 個の `it` ブロック** (分岐展開は「対象受入基準」表の通り)
   - 冒頭に AC 対応の hand-written reference コメント (文面は「対処案 § 手順 3」参照)
2. **`tests/e2e/helpers/keyboard-nav.ts` の新規作成**
   - キー送信ラッパー: `pressEsc`, `pressEnter`, `pressArrowUp`, `pressArrowDown`, `pressDelete`, `pressC`, `pressD`
   - フォーカス操作: `focusSearchBar()`, `blurAll()`, `focusCardAt(index)` (必要に応じて)
   - 状態検出: `assertFocusedCard(index)`, `assertNoFocus()`, `assertFocusUnchanged(prevIndex)`
   - 副検証: `getCodeMirrorCursor()`, `assertSearchBarFocused()`
   - クリップボード: `readClipboard()`, `writeClipboardSentinel(value)`
3. **`tests/helpers/test-fixtures.ts` の拡張**
   - `seedNavigationFixture(tempDir) → string[]` (4 件、A-D、today〜today-3day)
   - `seedOldNote(tempDir, daysAgo, body) → string` (7 日超の単体ノート投入)
4. `docs/test/e2e_strategy.md:104` の宣言との整合を維持 (ファイル名・モジュール名不変)

### スコープ外 (別タスクに切り出す)

- **実装本体**: `stores/focus.ts` および keyboard-nav モジュールの実装、↑/↓/`c`/`d`/Delete キーハンドラ、カードフォーカス背景色スタイル、Esc の二段階動作補強 → 派生タスクで対処 (本タスク完了後、RED の実地内容を踏まえて起票)
- **knowledge/ への運用ナレッジ抽出**: 否定形検証プロトコル / RED pin 運用 / クリップボード検証プロトコル等は、実装後の他 spec での流用実績が出た段階で別途抽出する。本タスクで先行文書化しない
- **[system_design.md:573](../docs/design/system_design.md#L573) の `tests/e2e/helpers/note-factory.ts` 記述の修正** (関連節参照)
- **DeleteButton の 2 段階クリック仕様逸脱疑い** (関連節参照)

## 対処案

### 手順

1. **前提確認**
   - tauri-driver が Linux / macOS で起動可能なこと (既存 keyboard-shortcut.spec.ts と同条件)
   - `tests/helpers/` の既存ユーティリティを再確認
2. **ヘルパー作成 — `tests/e2e/helpers/keyboard-nav.ts`**
   - スコープ内 2. のユーティリティ群を実装
   - DOM 属性判定は `data-focused="true"` を主、`getComputedStyle(...).backgroundColor` は AC-NAV-02 のみ使用
3. **fixture 拡張 — `tests/helpers/test-fixtures.ts`**
   - `seedNavigationFixture(tempDir)`: `Navigation fixture note A/B/C/D`, タグ `[nav-test]`, 日付 today〜today-3day
   - `seedOldNote(tempDir, daysAgo, body)`: 7 日超の単体ノート
4. **spec 作成 — `tests/e2e/navigation.spec.ts`**
   - 冒頭 JSDoc コメント:
     ```ts
     /**
      * Covers AC-NAV-01〜10 — フィード画面キーボードナビゲーション
      * SSOT:
      *   docs/requirements/requirements.md:147-171
      *   docs/design/system_design.md:188-216
      *   docs/test/acceptance_criteria.md:271-348
      *
      * RED pin: 全 it は派生タスク (keyboard-nav 実装) 完了まで fail する前提で書かれている。
      */
     ```
   - 2 層 describe 構造 + 19 `it` (「設計上の注意 § iv. スイート構造」参照)
   - 各 it の期待値は requirements.md / acceptance_criteria.md からの直接引用のみ
5. **RED 実行**
   - `direnv exec . npm run e2e` で 19 ケース実行
   - `N passed / M failed` の内訳を記録 (派生タスク起票時の fixture とする)
   - **`it.skip` / `it.todo` / `it.only` は使用しない** (全て `it(...)` で fail 許容)

### 設計上の注意

#### i. RED pin 運用 (Q2 案 X)

- 全 19 it は `it(...)` 形式で記述し、実装未完の AC は fail する
- `it.skip` / `it.todo` / `it.only` は**一切使わない** (Red-Green-Refactor の正統 Red フェーズ)
- `npm run e2e` の結果が `X passed / Y failed` の 2 値で判定される
- 派生実装タスク完了時には 19/19 passed になる

#### ii. カードフォーカス状態の検出方法 (Q3 案 α+β)

- **主**: `data-focused="true"` 属性で状態を直接判定 (`assertFocusedCard(index)`)
- **AC-NAV-02 のみ**: `getComputedStyle(card).backgroundColor` で「フォーカスカード ≠ 非フォーカスカード」の差異を assert (色値は固定しない、テーマ差異を吸収)
- `document.activeElement` (ネイティブ focus) とは分離。カードフォーカス状態は「編集モードでも表示モードでもない中間状態」であり、検索バー focus と共存する (AC-NAV-09) ため

#### iii. fixture ヘルパー配置方針 (Q4)

- **新規 `tests/e2e/helpers/note-factory.ts` は作らない**。既存 `tests/helpers/test-fixtures.ts` を拡張
- 既存 e2e spec が全て `tests/helpers/test-fixtures.ts` を使っており、分断を避ける
- fixture は 4 件 (A-D、今日から 1 日ずつ遡る、全て 7 日以内)、本文一意、タグ `[nav-test]` 統一

#### iv. スイート構造 (Q9)

- トップレベル `describe('module:keyboard-nav — フィード画面のキーボード操作 (AC-NAV-01〜10)')`
- 2 層 describe (トップ + AC-NAV-04 / 07 / 09 / 10 サブグループ)
- 2 層 beforeEach:
  - 第 1 層: `createTempNotesDir` + `writeTestConfig` (全 it 共通)
  - 第 2 層: `seedNavigationFixture` + `setNotesDirectoryAndReload` + `writeClipboardSentinel` (AC グループ別)
- **記述順は仕様順** (AC-NAV-01 → 02 → … → 10)
- AC-NAV-10 は fixture 分岐のため sub-describe 必須 (古いノートあり / なしで `seedOldNote` の呼び出し差)

#### v. キー送信プロトコル (Q8)

- `browser.keys()` は配列渡しで統一 (`browser.keys(['Escape'])`)、W3C Key Name を使用
- 単一 literal char は直接渡し (`browser.keys('c')`)
- 本タスクは全て非 modifier キー。`getModKey()` / `getNewNoteShortcut()` は不使用
- **キー送信前にイベント宛先のフォーカス状態を明示的に確立**:
  - AC-NAV-01: `.cm-content` にネイティブ focus
  - AC-NAV-09c/d: SearchBar の `<input>` にネイティブ focus
  - AC-NAV-08: `document.activeElement === body` (フォーカスなし状態)
- 高次ヘルパー (`pressArrowDownAndAssertFocusAt(i)` 等) は作らない (spec が意図を失う)

#### vi. 否定形検証プロトコル (Q7)

「何も起きない」系 AC (NAV-09、NAV-10a、NAV-10c) の検証:

| AC | Primary (肯定的代替シグナル) | Secondary (不変性) |
|---|---|---|
| AC-NAV-09a/b (編集中↑↓) | CodeMirror `editorView.state.selection.main.head` が変化 | `data-focused` index が不変 |
| AC-NAV-09c/d (検索中↑↓) | `document.activeElement` が検索バーのまま | `data-focused` index が不変 |
| AC-NAV-10a (最上部↑) | — | 300ms 待機後も `data-focused === 0` 不変 |
| AC-NAV-10c (最下部↓なし) | — | カード件数 / `listNotesOnDisk` / `data-focused` index 全て不変 |

- 待機は **300ms 固定** ([system_design.md:154](../docs/design/system_design.md#L154) の 200ms 目標 + 100ms バッファ)
- 代替シグナルがある場合は `waitUntil(代替シグナル変化, timeout=300ms)` でも可
- 固定 pause を AC-NAV-09/10 以外の検証で使わない (flaky 回避)

#### vii. AC-NAV-06 クリップボード検証プロトコル (Q5)

- **実測**: `invoke('read_from_clipboard')` の戻り値 = 期待値 (`Navigation fixture note A` など本文のみ、frontmatter 除外)
- **UI**: `CopyButton` のテキストが `'Copied!'` に変化 (2 秒後に戻る)
- **残滓分離**: beforeEach で `writeClipboardSentinel('__PRE_TEST_SENTINEL__')` を実行 → キー押下後に sentinel から変わっていることで実コピーを検証
- **期待値の仕様定義**: 「本文全体 (frontmatter 除く)」= `note.body_preview` と同等の文字列。具体抽出ロジックは派生実装タスクの責務

#### viii. AC-NAV-07 削除検証方針 (Q6)

- **it 分割**: 連鎖 1 it ではなく独立 4 it (07a/b/c/d) で各分岐を個別 assert
- **FS 検証**: `listNotesOnDisk` で件数減少 + 削除対象 filename の消失確認 (別ファイル誤削除の検知)
- **DOM 待機**: 固定 pause 禁止、`browser.waitUntil(cards.length === expected, timeout=2000)` で収束待機 ([requirements.md:179-183](../docs/requirements/requirements.md#L179-L183) の FLIP アニメ対策)
- **Trash vs Permanent**: DeleteButton は `trashNote` → 失敗時 `forceDeleteNote` にフォールバック。E2E は「notes ディレクトリから消えていること」で検証 (trash 先は問わない)

### 派生タスクへの制約 (逆流事項)

本タスクで決定した検証方法により、派生実装タスクは以下の実装制約を受ける:

1. **(Q3 由来)** `NoteCard.svelte` に `data-focused={isFocused}` バインディングを追加。CSS セレクタは `.note-card[data-focused="true"]` を使用 (class ではなく属性)
2. **(Q5 由来)** `c` キー押下時のフィードバックは `CopyButton` コンポーネントと同じ UI 表現 (`'Copied!'` テキスト) を使う。別個のトースト等を導入する場合は本タスクの spec も改修要
3. **(Q6 由来)** `d` / Delete キーハンドラは `trashNote` / `forceDeleteNote` を直接呼ぶ。DeleteButton の 2 段階 `confirming` 経路を**流用しない** (キー押下から IPC 発行までは 1 イベントループ内で完結)
4. **(Q8 由来)** カードフォーカス状態時のキー listener 宛先は `document` でも Feed root でも実装の自由。ただしテスト側で `blurAll()` 等により不要フォーカスがないことを担保する前提

## 検証

- `direnv exec . npm run e2e -- --spec tests/e2e/navigation.spec.ts` (または同等) で 19 ケースが実行される
- 実装未完の it は fail、実装済み部分の it は pass (部分 pass あり得る)
- 既存 e2e テスト (keyboard-shortcut / storage / settings / scope-exclusion / inline-editing-invariant / platform) は影響を受けない
- 否定形テスト (AC-NAV-09/10a/10c) の timing は 300ms 固定、`browser.pause()` を他検証で乱用しない

## CoDD 文脈との整合

- **tasks/ は CoDD scan 対象外** (`codd/codd.yaml` の `scan.source_dirs=[src/]`, `test_dirs=[tests/]`, `doc_dirs=[docs/]` に tasks/ は含まれない)
- 本タスク自身に frontmatter / `depends_on` は**不要** (001-003 の慣習準拠)
- `tests/e2e/navigation.spec.ts` も `@generated-from` 等の CoDD 規約コメントは**不要** (既存 e2e spec の慣習準拠、tests/unit/ のみが持つ)
- 本タスクは docs/ を**変更しない** → `codd impact` / `codd propagate` は不要
- spec 新設は `codd scan` graph 更新のみ発生 (Edit/Write hook で自動実行される前提)
- spec 冒頭の hand-written reference コメントで SSOT 参照を明示 (Write 可能な形でトレーサビリティを確保)

## 関連

- 親要件: [docs/requirements/requirements.md:147-171](../docs/requirements/requirements.md#L147-L171)
- 設計: [docs/design/system_design.md:188-216](../docs/design/system_design.md#L188-L216)
- 受入基準: [docs/test/acceptance_criteria.md:271-348](../docs/test/acceptance_criteria.md#L271-L348)
- E2E 戦略: [docs/test/e2e_strategy.md:104](../docs/test/e2e_strategy.md#L104)
- 先行タスク: `tasks/002-vitest-scope-and-failing-tests.md` 区分 B (`tests/e2e/**` の vitest 除外)

### 別件として要起票

以下は本タスクのスコープ外だが、調査過程で判明した要対応事項:

- **`tests/e2e/helpers/note-factory.ts` 記述の修正** ([system_design.md:573](../docs/design/system_design.md#L573)): 本タスクで決定した「`test-fixtures.ts` に統合」方針と不整合。派生実装タスク内か別途タスクで system_design.md を update 要
- **DeleteButton の 2 段階クリック仕様逸脱疑い** ([DeleteButton.svelte:13-18](../src/lib/components/DeleteButton.svelte#L13-L18)): [requirements.md:133](../docs/requirements/requirements.md#L133) の「確認ダイアログなし即時削除」に反する疑い。`confirm()` dialog ではないので解釈次第だが、別途調査・起票検討を推奨

### 派生予定

- 派生実装タスク (keyboard-nav モジュール実装): 本タスクの RED 実行結果を踏まえて起票する (ユーザー判断)

## 優先度

**中**。AC-NAV は受入基準全体の約 14% (10/71 見積) を占める主要モジュールで、
現在 CoDD の V-Model (Unit→Integration→E2E) の E2E 層が丸ごと空洞。
ただし実装本体が未着手なので**本タスク単独では機能向上なし**。派生実装タスクを駆動するためのアンカー (RED pin) として機能させる位置づけ。

## ゴール定義

1. `tests/e2e/navigation.spec.ts` が存在し、AC-NAV-01〜10 に対応する **19 個の `it` ブロック**を持つ。describe 階層は 2 層 (module トップ + AC-NAV-04/07/09/10 サブグループ)、記述順は仕様順
2. `tests/e2e/helpers/keyboard-nav.ts` が存在し、以下を提供して spec から再利用される:
   - キー送信ラッパー 7 個 (pressEsc/Enter/ArrowUp/ArrowDown/Delete/C/D)
   - フォーカス操作: focusSearchBar, blurAll
   - 状態検出: assertFocusedCard, assertNoFocus, assertFocusUnchanged
   - 副検証: getCodeMirrorCursor, assertSearchBarFocused
   - クリップボード: readClipboard, writeClipboardSentinel
3. `tests/helpers/test-fixtures.ts` に `seedNavigationFixture` と `seedOldNote` が追加されている
4. 各 `it` ブロックの期待値は requirements.md / acceptance_criteria.md からの直接引用で、テスト独自の解釈を含まない
5. **19 個の `it` は全て `it(...)` 形式で記述され、`it.skip` / `it.todo` / `it.only` を使用しない**。派生実装タスク完了時に 19/19 passed (0 failed) になる
6. `docs/test/e2e_strategy.md:104` の宣言とファイル名・モジュール名が一致
