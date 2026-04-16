# 002: vitest 走査スコープの整備と既存テスト失敗の解消

## 背景

タスク 001 で `npm test` (`vitest run`) を起動可能にした結果、`Test Files 92 failed | 4 passed (96)` という大量失敗が観測された。内訳を分類すると、本質的に解決すべき問題は 3 種に分かれる。

| 区分 | 件数 | 場所 | 失敗の性質 |
|---|---|---|---|
| A | 79 | `.direnv/flake-inputs/80y3y0zsdnwhhr20p2sycqb6rx9nlqv7-source/src/generated/sprint_*/...` | nix flake input キャッシュ配下を vitest が拾っている。**そもそも実行対象ではない** |
| B | 7 | `tests/e2e/*.spec.ts` | Tauri WebView / `tauri-driver` 前提の E2E テスト。vitest からは起動不可 |
| C | 7 | `src/generated/sprint_6/**/*.spec.ts` | プロダクションコード or テストヘルパーの実装と不整合 |

タスク 001 が「vitest を起動可能にする」ことに閉じていたため、これらは別タスクとして切り出した。

## 区分 A: `.direnv/` 配下の誤検出 (79 ファイル)

### 原因

`vitest.config.ts` が存在せず、デフォルト設定で `**/*.{test,spec}.ts` を全ツリー走査している。`.direnv/flake-inputs/` には nix flake で取り込んだ別プロジェクトの source tree が展開されており、その中の `src/generated/sprint_*/...` がそっくり拾われている。

### 対処案

`vitest.config.ts` を新規追加し、以下を `exclude` する。

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.direnv/**',
      '**/result/**',
      'tests/e2e/**',           // Playwright/tauri-driver 用 (区分 B)
      'src-tauri/**',           // Rust 側
    ],
  },
});
```

これだけで 79 + 7 = 86 ファイル分のノイズが消える見込み。

### 検証

- `direnv exec . npm test` が `.direnv/` 配下を一切走査しないこと
- `tests/unit/*.test.ts` の 25 ケース (タスク 001 で確認済み) は引き続き pass

## 区分 B: E2E テスト (7 ファイル)

### 対象ファイル

- `tests/e2e/editor.spec.ts`
- `tests/e2e/grid.spec.ts`
- `tests/e2e/navigation.spec.ts`
- `tests/e2e/platform.spec.ts`
- `tests/e2e/scope-exclusion.spec.ts`
- `tests/e2e/settings.spec.ts`
- `tests/e2e/storage.spec.ts`

### 原因

`tests/helpers/webview-client.ts` 等を経由した Tauri WebView 駆動テスト。`describe`/`it` の API は使っているが、実行には `tauri-driver` + `webdriverio` 等の E2E ハーネスが必要。`vitest run` の対象から除外すべき。

### 対処案

1. **短期 (本タスク)**: 区分 A の `vitest.config.ts` で `tests/e2e/**` を除外し、vitest からは見えなくする
2. **中期 (別タスク化候補)**: `implementation_plan.md` Sprint 6 の「E2E テスト (Linux/macOS)」と接続し、`scripts.test:e2e` に `tauri-driver` ベースの runner を追加。CI マトリクスに組み込み

本タスクは短期対応のみをスコープとする。

## 区分 C: 実装/テスト不整合 (7 ファイル)

### 対象ファイルと既知エラー

| ファイル | エラー概要 |
|---|---|
| `src/generated/sprint_6/1_000_200ms/searchPerf.spec.ts` | `searchInvoke: no Tauri invoke available. Run this test inside tauri-driver or define __tauriInvokeSearchNotes` |
| `src/generated/sprint_6/frontmatter_ts_frontmatter_rs_rust/frontmatterParity.spec.ts` | `extractTagsForDisplay` が `parsed.tags` を読む際 `parsed` が `null` (TypeError) |
| `src/generated/sprint_6/rename_100ms/atomicWrite.perf.spec.ts` | (詳細未確認 — 本タスクで再現調査) |
| `src/generated/sprint_6/task_r_04/noteCreationCollision.spec.ts` | (詳細未確認) |
| `src/generated/sprint_6/ui_foundation/trashCompat.spec.ts` | (詳細未確認) |
| `src/generated/sprint_6/ui_foundation/waylandShortcut.spec.ts` | (詳細未確認) |

### 性質判断

これらは Sprint 6 (結合テスト・E2E・パフォーマンステスト) として CoDD が生成したテスト群だが、Sprint 6 自体は未完了 (Sprint 1〜5 のみ実装済み) であるため、テストが実装より先行している状態。

### 対処案

1. **案 i**: 区分 A の `exclude` に `src/generated/sprint_6/**` を追加し、Sprint 6 着手まで保留
2. **案 ii**: 各テストファイルの failure を個別に分類し、本当にプロダクションバグなのか / Sprint 6 未着手による前提欠如なのかを切り分けてから対処
3. **案 iii**: テストの前提となる実装 (`__tauriInvokeSearchNotes` グローバル定義、`parseFrontmatter` の null セーフ化) を最小限実装して GREEN 化

`searchPerf.spec.ts` は明らかに tauri-driver 前提なので案 i が適切。`frontmatterParity.spec.ts` の null アクセスは `frontmatterTs.ts:65` の薄いバグなので案 iii が候補。残り 4 ファイルは未調査につき本タスク内で振り分ける。

## 関連

- 親タスク: `tasks/001-vitest-runner-setup.md`
- ADR-008: `docs/governance/adr_tech_stack.md` (本文往復冪等性 = 区分 C `frontmatterParity` の文脈)
- 実装計画: `docs/plan/implementation_plan.md` Sprint 6 (E2E / 結合テスト)
- 関連メモリ: `project_direnv_nix.md` (`.direnv/` の取り扱い)

## 優先度

中。`.direnv/` 配下の誤検出 (区分 A) は **`npm test` の信号対雑音比を著しく損ねている** ため、設定追加だけで解決する区分 A は早期着手が望ましい。区分 B/C は Sprint 6 計画と統合して扱える。

## ゴール定義

- `direnv exec . npm test` の出力が `Test Files X passed (X)` または明確に分類された残失敗のみとなり、ノイズなく CI / ローカルで判定可能になる
- 残失敗があればそれは本物の実装バグ or 仕様化テストの未実装であり、`tasks/` または `docs/plan/implementation_plan.md` に対応エントリが存在する
