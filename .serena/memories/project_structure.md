# Codebase Structure

## Top-level
- `spec.md` — プロジェクト入口の仕様概要 (frontmatterに`req:promptnotes-requirements` node_id)
- `CLAUDE.md` — CoDD ワークフロー / コミットメッセージテンプレート
- `docs/` — CoDD generated 設計書 (requirements, design, detailed_design, test, plan, governance)
- `codd/` — CoDD 依存グラフ (`codd.yaml`, `scan/`, `reports/`)
- `.codd_version` — CoDD バージョン (0.2.0)
- `flake.nix` / `flake.lock` — Nix build 定義 (src/generated/sprint_53 から生成)
- `package.json` / `vite.config.ts` / `svelte.config.js` / `tsconfig.json`
- `index.html` — Vite entrypoint
- `src-tauri/` — Rust バックエンド (Tauri 2)

## `src/` (フロントエンド)
- `src/main.ts`, `src/App.svelte`, `src/app.html`, `src/app.css`
- `src/routes/` — SvelteKit ルート
  - `+layout.svelte`, `+layout.ts`, `+page.svelte` (フィード一覧)
  - `new/+page.svelte`, `edit/[filename]/+page.svelte`, `settings/+page.svelte`
- `src/components/` — 共有Svelteコンポーネント
- `src/lib/`
  - `api.ts` — Tauri IPC ラッパー (フロントから直接FSアクセス禁止)
  - `stores.ts`, `stores/` — Svelte stores
  - `frontmatter.ts`, `date-utils.ts`, `clipboard.ts`, `debounce.ts`, `types.ts`
  - `editor/`, `components/`, `utils/`
- `src/generated/` — **CoDD が Sprint 単位で生成したコード断片** (sprint_4〜sprint_56 多数)。`codd assemble` で src/ 正式配置へ組み立てる。編集時は設計書を正とすること。

## `src-tauri/src/`
- `main.rs` — Tauri entry
- `lib.rs` — lib crate (`promptnotes_lib`, `cdylib` + `staticlib`)
- `commands.rs` — IPC コマンド
- `notes.rs` — ノート FS 操作
- `config.rs` — 設定 (保存ディレクトリ永続化)

## `tests/`
- `tests/unit/` — Vitest
- `tests/e2e/` — WebdriverIO 9
- `tests/helpers/`, `tests/wdio.conf.ts`

## `docs/` (CoDD 生成)
- `requirements/`, `governance/` (ADR), `design/` (system),
  `detailed_design/` (component / editor_clipboard / storage / feed_search),
  `test/` (acceptance_criteria), `plan/` (implementation_plan)
