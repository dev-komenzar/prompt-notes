# Task Completion Checklist

タスク完了とみなす前に以下を実施する。

## 1. 型・静的検証
- `npm run check` — svelte-check で Svelte/TS の診断
- Rustを触った場合: `cd src-tauri && cargo check`

## 2. テスト
- `npm run test` — Vitest ユニット
- Rustを触った場合: `cd src-tauri && cargo test`
- UI/E2E経路を変更した場合: `npm run test:e2e` (WebdriverIO)

## 3. UI変更の実機確認
- CLAUDE.mdでの指示通り、UIや frontend の変更は `npm run tauri dev` で実機起動して golden path とエッジケースを確認
- 型/テスト通過は feature correctness を保証しない

## 4. CoDD との整合
**重要**: このプロジェクトは CoDD (Coherence-Driven Development) で運用されている。仕様書 → 設計書 → 実装 → テストは一方向。
- 要件/設計書を変更した → `codd impact` で Green/Amber/Gray 影響範囲を確認 → 影響 Wave を `codd generate --wave N --force` で再生成
- ソースコードだけ変更した → `codd propagate` で CEG グラフを辿って影響する設計書を特定 → 必要なら `--update` で AI 追従
- 依存グラフが古そうなら `codd scan` で再構築 (Edit/Write hook での自動実行推奨)
- `codd validate` で frontmatter/TODO プレースホルダ検出

## 5. 禁止事項の自己点検
- テストを通すためにプロダクションコードへ機能追加していないか (**feedback_spec_is_source_of_truth**)
- スコープ外機能 (AI呼び出し/クラウド同期/Markdownプレビュー/タイトル入力欄/モバイル/Windows) を実装していないか
- 設計書に反する決定 (CodeMirror→Monaco, Tauri→Electron, .md→DB 等) をしていないか

## 6. コミット
- CLAUDE.md のテンプレート (requirements更新 / docs生成 / Sprintコード生成) に従う
- ユーザーが明示的に依頼した時のみコミット
