# タスク: ノートカードの高さ挙動をモード別仕様に実装

## 背景

仕様（requirements / 受入基準 / 詳細設計）を以下の方針に確定しました。実装側はまだ追従していません。本タスクで実装を仕様に揃えてください。

- **表示モード**: カードに `max-height = 300px` を適用し、本文がそれを超える場合は **`overflow: hidden`** で**冒頭プレビュー**を表示する（カード内スクロールは設けない）。本文全量の確認は編集モードへの遷移を介して行う UX
- **編集モード**: `max-height` を**適用しない**。本文量に応じてカード自体の高さが伸び、内部スクロールバーは表示しない（`overflow: visible`）
- **両モード共通の禁止事項**: `.note-card` 自身に `overflow-y: auto` / `overflow-y: scroll` を付与しない（フィードのスクロールと二重化するため）。表示モードでは `overflow: hidden` のみ許容
- **`max-height` は当面アプリケーション内の定数（300px）として保持**する。設定モーダル UI / `config.json` への永続化は本リリースのスコープ外。将来 config に昇格させる余地は残すため、CSS カスタムプロパティ等で 1 箇所定義することを推奨
- 「カード外形高さ」を以下で定義し、これがモード切替アニメーション（200ms / ease-in-out）の対象：
  - 表示モード = `min(本文全展開高さ + パディング, max-height)`
  - 編集モード = `本文全展開高さ + パディング`
- 本文が短く高さ差 0 のケースは正常動作（`transition` は設定されていてよいが、視覚的な高さ変化なし。コンテンツ切替は他ケースと同様に即時）
- データ層では本文全量を保持する（`body_preview` のみで持つ・恒久的切り詰めは禁止）。表示モードのクリップはあくまで CSS 視覚クリップ

## 仕様の参照先（読み込んでから着手）

- `docs/requirements/requirements.md` §機能要件 > ノート（高さ挙動 + モード切替アニメーション）
- `docs/test/acceptance_criteria.md` AC-UI-04 / AC-UI-11 / FC-UI-01
- `docs/design/system_design.md` §module:ui — UI レイアウト・テーマ「カードレイアウト」
- `docs/detailed_design/component_architecture.md` §4.13 モード切替時の高さアニメーション、§4.3b FBD-03
- `docs/detailed_design/feed_search_design.md` §4.4c ノートカードのレイアウト制約「本文の表示ポリシー（モード別）」

## 前提タスク

**`tasks/007-reconcile-component-paths.md` を先に完了してから着手すること。** タスク 007 はコンポーネントの物理配置と設計書のパス記述の整合を取る作業で、本タスクの「修正対象ファイルがどこにあるか」を確定させる。タスク 007 が未完了の段階で本タスクに着手すると、修正対象ファイルが移動・削除される可能性があり手戻りになる。

## 修正対象ファイル

### 主対象

- 現行 live NoteCard コンポーネント（タスク 007 完了後の確定パスを使用）
  - タスク 007 着手前の現状: [`src/feed/NoteCard.svelte`](src/feed/NoteCard.svelte)（`Feed.svelte` から import）
  - `.card-preview` に `max-height: 200px; overflow: hidden;` が存在（タスク 007 着手前の L142–L143）
  - 必要な修正:
    - 値を **300px** に変更（仕様準拠）
    - **表示モード**では `max-height` + `overflow: hidden` を継続
    - **編集モード**ではこれらを解除（`max-height: none; overflow: visible;`）
    - `max-height` の値は CSS カスタムプロパティ（例: `--card-max-height-display: 300px;`）で 1 箇所定義し、後で config に昇格しやすくする

### 副対象

- live Feed コンポーネント（タスク 007 後のパスに従う。現状は [`src/feed/Feed.svelte`](src/feed/Feed.svelte)） — `.feed-list` が単一スクロールであることを確認。子カードに二重スクロール領域を作らない（feed_search_design.md §4.4c）

## 実装の指針

1. CSS で表示モード / 編集モードを分岐（既に `.note-card.editing` クラスがあるはず）：
   ```css
   :root { --card-max-height-display: 300px; }

   .note-card .card-preview {
     max-height: var(--card-max-height-display);
     overflow: hidden;
   }
   .note-card.editing .card-preview {
     max-height: none;
     overflow: visible;
   }

   /* 二重スクロール禁止: .note-card 自身は overflow-y: auto を持たない */
   .note-card { overflow-y: visible; /* または既存の overflow: hidden を維持 */ }
   ```
   セレクタ名は実コードに合わせて選ぶこと（`.card-preview` か `.card-body` か実装次第）。
2. モード切替時のアニメーション（AC-UI-11）は `component_architecture.md §4.13` に従い、JS で前後の **カード外形高さ** を計測してから `height` を px で補間。完了後は `height: auto` に戻し、表示モード復帰時は `max-height` 制約と `overflow: hidden` を再適用する。
3. `prefers-reduced-motion: reduce` 環境では即時切替にフォールバック（既存 AC-UI-12 ロジックの再利用）。

## 検証

- ユニット/コンポーネントテスト: 既存の inline-editing 系テスト（`tests/e2e/inline-editing-invariant.spec.ts`）が通ることを確認
- E2E (`tests/e2e/`): 既存スイートに高さ系の検証は薄い。本タスクの範囲では既存テストの非リグレッション確認で OK。AC-UI-04 / AC-UI-11 の Case 1/2 と FC-UI-01（カード内スクロール禁止）を E2E に書き起こす作業は別タスクに切り出してよい
- 手動確認:
  - 長文ノート（300px 超）を作成 → 表示モードで冒頭がクリップされて見える / カードが画面を埋め尽くさない / カード内にスクロールバーが出ない
  - 同じノートをクリックして編集モードへ → カードが伸びて全文がスクロールなしで見える
  - Esc で表示モードに戻る → 200ms のなめらかな縮みアニメーション、表示モードでは再度冒頭クリップ
  - 短文ノート → モード切替で見た目の高さ変化なし、コンテンツのみ即時切替
  - `prefers-reduced-motion: reduce` を OS で有効化 → アニメーション無効、即時切替
  - フィードのスクロール（外側）が滑らかに効き、カード内に二重のスクロール領域が現れない

## CoDD ハンドリング

- 実装後、`codd propagate` でコード変更が設計書と整合しているか確認できる（`feed_search_design` / `component_architecture`）
- `codd validate` も pre-commit hook で走るので、frontmatter には触らないこと

## コミットメッセージ

CLAUDE.md のテンプレート「Sprintでコードを生成した場合」**には該当しない**（手動実装のため）。`fix:` または `feat:` プレフィックスで簡潔に。例：

```
feat: NoteCard に表示モード max-height (300px) + モード別オーバーフロー挙動を実装

- src/feed/NoteCard.svelte の .card-preview を max-height 200px → 300px、表示モードは overflow: hidden で冒頭プレビュー
- 編集モード時は max-height: none / overflow: visible に解除し本文量に応じて伸ばす
- カード内スクロール (overflow-y: auto) は両モードで禁止 (フィードと二重化するため)
- AC-UI-11 のモード切替アニメーションをカード外形高さに対して適用 (JS 補間 + 完了後 height: auto)
- 仕様: docs/requirements + AC-UI-04 / AC-UI-11 / FC-UI-01
```

## 制約

- 仕様（docs/）は今回コミットで確定済み。**実装を仕様に合わせる**方向のみ。仕様変更が必要に思えた場合はユーザーに相談すること（spec is the source of truth）
- `pnpm tauri build --no-bundle` で動作確認する場合のみリリースビルドを使う（`cargo build --release` 単体は使わない — devUrl が埋め込まれて起動失敗する）
- テストハンドル用の `window.__x` グローバルはプロダクトコードに追加しない方針
