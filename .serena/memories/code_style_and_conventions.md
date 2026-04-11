# Code Style & Conventions

## TypeScript / Svelte
- TypeScript 5.5, `tsconfig.json` は `@tsconfig/svelte` ベース
- Svelte 5 (runes構文: `$state`, `$derived` など)
- SvelteKit 2 の routing (`src/routes/[filename]/+page.svelte`)
- フロント↔Rust間は **必ず Tauri IPC 経由** (フロントからの直接FSアクセス禁止)
- IPCラッパーは `src/lib/api.ts` に集約

## Rust
- edition = 2021
- crate名 `promptnotes_lib` (`lib` + `cdylib` + `staticlib`)
- `serde` / `serde_yaml` でfrontmatter入出力
- `chrono` でタイムスタンプ、`dirs` でプラットフォーム別パス

## ファイル/データ規約 (変更は要件変更が必要)
- ノートファイル名: `YYYY-MM-DDTHHMMSS.md` (作成時タイムスタンプで不変)
- frontmatter は YAML。メタデータは **`tags` のみ** (追加禁止)
- 作成日はファイル名から取得 (frontmatterに保持しない)
- デフォルト保存ディレクトリ:
  - Linux: `~/.local/share/promptnotes/notes/`
  - macOS: `~/Library/Application Support/promptnotes/notes/`

## 禁止事項 (設計書レベルで明示)
- タイトル入力欄の追加
- Markdown プレビュー（レンダリング）
- AI呼び出し機能
- クラウド同期 / DB 利用
- Monaco等への乗り換え (CodeMirror 6 確定)
- Electronへの乗り換え (Tauri 確定)

## CoDD 生成コード
- `src/generated/sprint_NN/**` は CoDD が `codd implement --sprint NN` で生成した断片
- 直接編集ではなく、上流 (設計書) を直して再生成が原則
- `codd assemble` で src/ 本配置へ組み立てる

## コミットメッセージ規約 (CLAUDE.md 準拠)
- `docs/requirements/requirements.md` 更新: `update: タイトル` + 箇条書き5行以内
- その他 `docs/` 生成: `update: タイトル` + `## 生成コマンド` + `## 変更点`
- Sprint コード生成: `update: Sprint XX コード生成` + `## 生成コマンド` (`codd implement --sprint XX`) + `## 変更点`
