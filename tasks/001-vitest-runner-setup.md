# 001: vitest テストランナーを dev 環境で実行可能にする

## 背景

ADR-008 本文往復冪等性の GREEN フェーズ作業中、`tests/unit/*.test.ts`（vitest で import する単体テスト）を走らせようとして以下の問題に遭遇した。

### 問題 1: `direnv exec . npx vitest` が実行できない

nix flake 環境の `npx` シム（`/nix/store/1gw2r0h59vr5dzcilhg1xvzjqgn84f8b-nodejs-20.20.2/bin/npx` → `../lib/node_modules/npm/bin/npx-cli.js`）の shebang が GC 済みの `nodejs-slim` パス（`b6zafi0xdd…-nodejs-slim-20.20.2`）を指しており、ENOENT で即死する。

```
npm error code ENOENT
npm error path /nix/store/b6zafi0xddw1s6nsx1gmsrxrw00yr8h6-nodejs-slim-20.20.2/lib
```

node 本体（非 slim）は生きているが、npm/npx が nodejs-slim を参照しているため npm 経由のパッケージフェッチが一切できない。

### 問題 2: vitest が依存に入っていない

`tests/unit/frontmatter.test.ts` / `tests/unit/prod-frontmatter.test.ts` は `import { describe, it, expect } from 'vitest'` しているが、`package.json` に `vitest` は未追加。前セッションでは RED 確認のため `npx vitest` で都度フェッチしていたと推測されるが、問題 1 により再現不能。

## 暫定対処（ADR-008 セッションで実施）

`pnpm`（nix-profile 由来の `/home/takuya/.nix-profile/bin/pnpm` が使える）経由で `vitest@4.1.4` を devDependencies に追加し、`pnpm exec vitest run` で実行した。GREEN 確認後、この変更は以下の理由で revert 済み。

- `package.json` の devDependencies 肥大化を避けたい
- テストランナー導入は独立した設計判断（単体テスト実行環境の整備）であり、バグ修正 PR に混ぜるべきでない
- CoDD ワークフロー上どこに位置づけるか未決（`docs/plan/implementation_plan.md` のどの Sprint か、`tools/` か、CI なのか）

## 対処案

### 案 A: vitest を正式に devDependency として導入

- `package.json` に `vitest` を追加し、`pnpm-lock.yaml` をコミット
- `scripts` に `"test": "vitest run"` を追加
- CoDD の `implement_plan.md` に「テストランナー整備」タスクを追加

### 案 B: flake.nix で vitest をネイティブに提供

- `nodePackages.vitest` を dev shell に入れ、プロジェクトに lock せず global に使う
- 代償として特定バージョンの再現性は `flake.lock` 依存

### 案 C: nix-slim 参照切れを根治

- `nix-collect-garbage` で GC された path を復活 or 別の node 派生を `flake.nix` で使う
- npm/npx の shebang が指す nodejs-slim を明示的に依存に入れる
- これ単独ではテストは走らない（vitest 自体は入れる必要あり）が、将来の同種問題を予防

## 現状のテスト実行手順（暫定）

ADR-008 GREEN 確認時に使った手順を記録：

```bash
# Rust 側
direnv exec . bash -c 'cd src-tauri && cargo test --bin promptnotes storage::frontmatter::tests'

# TypeScript 側（要 pnpm install vitest）
direnv exec . bash -c 'pnpm install vitest --save-dev'
direnv exec . bash -c 'pnpm exec vitest run tests/unit/frontmatter.test.ts tests/unit/prod-frontmatter.test.ts'
```

## 関連

- ADR-008: docs/governance/adr_tech_stack.md
- 本文往復冪等性修正: a981016 (RED) + 本タスクセッションの GREEN コミット
- テストファイル: tests/unit/frontmatter.test.ts, tests/unit/prod-frontmatter.test.ts
- 関連メモリ: `project_direnv_nix.md`（nix flake + direnv 運用）

## 優先度

中。GREEN 確認は Rust 側の 3 ケースで本質は担保できており、TS スタブの 25 ケースは「本番側バグ修正には不要な仕様化テスト」にあたるため、ブロッカーではない。ただし今後 CoDD の Sprint で TS 単体テストを書き足す際に必須になる。

## 解決 (2026-04-16)

採用案: **案 A の改訂版（npm ベース）**。

### 経緯

- 本セッション開始時に `direnv exec . npm --version` を再試行したところ正常応答（10.8.2）。タスク起票時の ENOENT は nix store GC の一過性問題と判断し、npm シムは現状動作している。
- プロジェクトの既存ロックファイルは `package-lock.json` のみ。pnpm 移行は dual lockfile drift を招くため見送り、npm を継続使用する方針をユーザー判断で確定。

### 実施内容

1. `direnv exec . npm install --save-dev vitest` → `vitest@4.1.4` を `devDependencies` に追加し `package-lock.json` を更新。
2. `direnv exec . npm install --save-dev js-yaml @types/js-yaml` → `tests/unit/yaml-utils.ts` の依存を解消（vitest 起動時の suite collection 失敗を解消）。
3. `package.json` `scripts.test` に `"vitest run"` を追加。
4. `docs/plan/implementation_plan.md` Sprint 1 に成果物 `1-15 TS 単体テストランナー整備` と検証基準「テストランナー起動」を追加。

### 動作確認

```
$ direnv exec . npm test
...
Test Files  3 passed (96 中 3 / 残り 93 は別件の既存テスト失敗)
$ direnv exec . npx vitest run tests/unit/frontmatter.test.ts tests/unit/prod-frontmatter.test.ts
Test Files  2 passed (2)
Tests       25 passed (25)
```

タスク 001 が直接対象とした 25 ケースは全 pass。`src/generated/sprint_6/**` 配下の他テスト群の失敗（93 ファイル）は別問題で、本タスクのスコープ外。

### 本タスク完了後にやり残し

- `src/generated/sprint_6/**` の `__tauriInvokeSearchNotes` 不在エラー / `extractTagsForDisplay` の null アクセスは個別のテスト品質課題として別タスク化が必要。
- npm シムの nix-slim 参照切れ（問題 1）は再発の可能性あり。次に再現したら別タスクで `flake.nix` 側の根治を検討。
