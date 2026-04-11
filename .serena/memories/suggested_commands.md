# Suggested Commands

## 開発 (npm scripts)
- `npm run dev` — Vite dev server 起動
- `npm run build` — Vite production ビルド
- `npm run preview` — ビルド済みをプレビュー
- `npm run check` — svelte-check で型/診断 (tsconfig.json)
- `npm run test` — Vitest 単発実行
- `npm run test:watch` — Vitest watch
- `npm run test:e2e` — WebdriverIO E2E (`tests/wdio.conf.ts`)
- `npm run tauri` — Tauri CLI (例: `npm run tauri dev`, `npm run tauri build`)

## Tauri (Rust)
- `cd src-tauri && cargo check` — Rust側の型/コンパイルチェック
- `cd src-tauri && cargo build` — デバッグビルド
- `cd src-tauri && cargo test` — Rustユニットテスト
- `npm run tauri dev` — フロント＋Rustを同時起動 (通常の開発ループ)
- `npm run tauri build` — 配布用バイナリ

## CoDD (Coherence-Driven Development)
**このプロジェクトの肝。仕様書 → 設計書 → 実装 → テストの一方向フロー。**
- `codd init --requirements <file>` — 初期化
- `codd plan --init` — wave_config 生成
- `codd generate --wave N` — Wave順に設計書生成 (1〜5)
- `codd generate --wave N --force` — 強制再生成
- `codd validate` — frontmatter/TODO 検出
- `codd implement --sprint N` — 設計書から Sprint 単位コード生成
- `codd assemble` — `src/generated/sprint_*` を buildable に組み立て
- `codd impact` — requirements/設計書の影響範囲 (Green/Amber/Gray)
- `codd propagate` — ソース編集 → 影響する設計書を特定 (`--update` でAI追従)
- `codd scan` — 依存グラフ再構築

## Nix / 環境
- `direnv allow` — `.envrc` 有効化
- `nix develop` — flake.nix のdevShell
- `nix build` — flake ビルド

## タスク完了時の推奨手順
1. `npm run check` (svelte-check)
2. `npm run test` (Vitest)
3. `cd src-tauri && cargo check`
4. 関連するなら `npm run test:e2e`
5. 設計書と実装の整合が崩れたら `codd scan` → `codd propagate` / `codd impact`

## Linux システムコマンド
標準 GNU ツールチェーン。特殊な差異なし。zsh シェル。
- `git`, `ls`, `cd`, `grep`, `find`, `rg` (ripgrep が入っていれば)
