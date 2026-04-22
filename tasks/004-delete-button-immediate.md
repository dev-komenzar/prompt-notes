# 004: Delete ボタンを即時削除に戻す

## 背景

`src/editor/DeleteButton.svelte` が **インライン 2 ステップ確認（3 秒タイムアウト）** で実装されているが、これは `docs/requirements/requirements.md` から逸脱している。

## 要件側の指定

- `docs/requirements/requirements.md` L133:
  > **Deleteボタン** — ノートを削除（確認ダイアログなし、即時削除）
- 同 L160（キーボードショートカット）:
  > **`d` キー または Delete キー** — ノートを即時削除（確認ダイアログなし）

キーボードと UI ボタンの両方で **即時削除が確定仕様**。UX 的に確認ダイアログを挟まないという判断は明記されている。

## 現状の実装 drift

`DeleteButton.svelte` には以下の挙動が入っている（2026-04-22 時点）:

- 1 回目クリックで `confirming = true`、ボタンテキストが `"Delete"` → `"Confirm Delete"`、背景色が danger カラーに変化
- 3 秒経過すると `confirming` がリセット
- 確認状態中の 2 回目クリックで `trashNote()`（失敗時 `forceDeleteNote()` フォールバック）を実行

この drift は 2026-04-22 の `codd propagate --verify` 実行時に AI が設計書を実装側に寄せて書き換えようとしたことで発覚した。

## 本タスクの目的

`DeleteButton.svelte` を `requirements.md` に準拠させる（即時削除・確認状態なし）。キーボードの `d` / Delete と同一 UX にする。

## 完遂条件

- [x] `DeleteButton.svelte` から `confirming` state と `setTimeout` ロジックを削除
- [x] `handleDelete()` は即座に `trashNote()` を呼ぶ（フォールバックロジックは保持）
- [x] ボタンテキスト・視覚フィードバックの仕様を決め直す（即時削除なので `Delete` ラベル単独で OK）
- [x] **(drift #2)** trash 失敗時は `forceDeleteNote()` にサイレントフォールバックせず、**確認ダイアログ（`削除する` / `キャンセル`）を表示**してユーザー明示同意後に完全削除を実行する
- [x] `docs/detailed_design/editor_clipboard_design.md` の DeleteButton 記述が requirements に揃っているか再確認
- [ ] 該当する受入基準テスト（AC-EDIT-07）を書き、GREEN 化させる

## Drift 判定サマリー (2026-04-22 HITL レビュー)

`codd propagate --diff 21b1020` で検出された 16 件の editor モジュール drift を HITL 判定した結果、本タスクに直接関係する項目は以下の 2 件:

- **Drift #1 (spec 勝ち)**: 2 段階確認 (`confirming` + 3 秒タイムアウト) を撤去し、`trashNote()` を即時呼び出し (requirements.md L133 準拠)
- **Drift #2 (spec 勝ち)**: trash 失敗時の確認ダイアログを実装 (editor_clipboard_design.md §4.4b / OQ-EDIT-004 準拠)

残り 14 件の判定結果は `docs/detailed_design/editor_clipboard_design.md` および `docs/requirements/requirements.md` の更新に反映済み。

## 関連

- 仕様: `docs/requirements/requirements.md` §機能要件 > ノートカード、§キーボードナビゲーション
- 実装: `src/editor/DeleteButton.svelte`
- 受入基準: `docs/test/acceptance_criteria.md` AC-EDIT-07, VB-07, VB-48
- 発覚経緯: 2026-04-22 `codd propagate --verify --diff 21b1020` の AI 判断で drift が固定化されかけたため revert、本タスクとして切り出し
- 関連メモ: `feedback_codd_verify_drifts_to_impl.md`

## 補足

キーボード nav (AC-NAV-06: `d` / Delete キーによる即時削除) は既に green。ボタン側もキーボードと同じ `handleDelete()` を共有する設計にするか、ショートカットと統一したヘルパに切り出すかは実装時に検討。
