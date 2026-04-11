# テスト統合プロンプト

## 目的

`src/generated/` 以下に CoDD (`codd implement`) で生成されたテストファイル群を、プロジェクトで実際に実行可能な形に統合する。

## 現状

### 生成済みテストの概要

| 種類 | 件数 | 場所 |
|------|------|------|
| Vitest 単体テスト (.test.ts) | 14ファイル | `src/generated/sprint_{13,20,23,26}/` |
| Playwright E2E テスト (.spec.ts) | 73ファイル | `src/generated/sprint_{21,27,37,46,48,49,50,55,56}/` |
| テストヘルパー | 40+ファイル | 各 sprint の `helpers/` |
| E2E設定 | 1ファイル | `src/generated/sprint_55/task_55_1/e2e.config.ts` |
| Rust ユニットテスト | 9テスト | `src-tauri/src/notes.rs` (統合済み) |

### テスト基盤の不足点

- `package.json` にテスト関連の devDependencies が未定義（vitest, playwright 等）
- `package.json` に test スクリプトが未定義
- `vite.config.ts` に vitest 設定なし
- プロジェクトルートに `tests/` ディレクトリなし

### 生成済みテストの重複

Sprint 21, 27, 37, 46, 49, 56 の E2E テストは同じ構造（editor, grid, settings, storage, scope-guard）を繰り返している。最新の Sprint 55 (`task_55_1/`) が最も包括的で、以下のヘルパーを持つ：

- `global-setup.ts` — Tauri バイナリ存在確認
- `global-teardown.ts` — プロセスクリーンアップ
- `platform.ts` — Linux/macOS プラットフォーム検出
- `tauri-driver.ts` — Tauri アプリ起動/停止
- `test-fixtures.ts` — テストデータ生成（ノート作成、一時ディレクトリ等）
- `ipc-instrumentation.ts` — WebView IPC ログ注入
- `ipc-assertions.ts` — IPC 呼び出し検証
- `webview-client.ts` — WebView 操作ヘルパー

## タスク

### 1. テスト基盤のセットアップ

#### 1.1 devDependencies の追加

```bash
npm install -D vitest @playwright/test
```

#### 1.2 package.json にテストスクリプトを追加

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test --config e2e.config.ts"
  }
}
```

#### 1.3 vite.config.ts に vitest 設定を追加

```typescript
import { defineConfig } from 'vitest/config';
// ...
export default defineConfig({
  // ... 既存設定
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.ts'],
  },
});
```

### 2. テストファイルの統合

#### 2.1 ディレクトリ構成

以下の構成でテストを配置する：

```
tests/
├── unit/                        # Vitest 単体テスト
│   ├── frontmatter.test.ts      # Sprint 13 由来
│   ├── crud.test.ts             # Sprint 20 由来
│   ├── atomic_write.test.ts     # Sprint 20 由来
│   ├── frontmatter_parse.test.ts # Sprint 20 由来
│   ├── path_resolution.test.ts  # Sprint 20 由来
│   ├── path_traversal.test.ts   # Sprint 20 由来
│   ├── storage_integration.test.ts # Sprint 23 由来
│   ├── settings_api.test.ts     # Sprint 23 由来
│   ├── mock_invoke.test.ts      # Sprint 23 由来
│   ├── api_uninit.test.ts       # Sprint 23 由来
│   ├── search_notes_filter.test.ts # Sprint 26 由来
│   └── settings_rw.test.ts      # Sprint 26 由来
├── e2e/                         # Playwright E2E テスト (Sprint 55 ベース)
│   ├── editor.spec.ts
│   ├── grid.spec.ts
│   ├── navigation.spec.ts
│   ├── platform.spec.ts
│   ├── scope-exclusion.spec.ts
│   ├── settings.spec.ts
│   ├── storage.spec.ts
│   ├── ci-matrix.spec.ts
│   └── acceptance_criteria_e2e.spec.ts  # Sprint 50 由来
├── helpers/                     # Sprint 55 ベースのヘルパー
│   ├── global-setup.ts
│   ├── global-teardown.ts
│   ├── platform.ts
│   ├── tauri-driver.ts
│   ├── test-fixtures.ts
│   ├── ipc-instrumentation.ts
│   ├── ipc-assertions.ts
│   └── webview-client.ts
└── e2e.config.ts                # Sprint 55 ベースの Playwright 設定
```

#### 2.2 統合の方針

- **Sprint 55 を基準とする**: E2E テストとヘルパーは最新・最包括の Sprint 55 (`task_55_1/`) を採用
- **Sprint 50 の受入テスト**: `acceptance_criteria_e2e.spec.ts` は独自テストのため追加統合
- **Sprint 48 のワークフローテスト**: `workflow.e2e.spec.ts` の内容が Sprint 55 にカバーされていれば不要、そうでなければ統合
- **重複排除**: Sprint 21, 27, 37, 46, 49, 56 の E2E テストは Sprint 55 と重複するため除外
- **Vitest テスト**: Sprint 20 が最も基本的な CRUD・セキュリティテストを含み全件統合。Sprint 23, 26 も統合
- **インポートパス修正**: `src/generated/` からの移動に伴い、相対パスを修正する

### 3. テスト実行確認

#### 3.1 Vitest

```bash
npm run test
```

- Tauri IPC (`@tauri-apps/api/core`) のモック方法を確認し、必要に応じて vi.mock() を設定
- テストが実際のファイルシステム操作を行う場合、一時ディレクトリを使用していることを確認

#### 3.2 Playwright E2E

```bash
# 先に Tauri アプリをビルド
npm run tauri build
# E2E テスト実行
npm run test:e2e
```

- `e2e.config.ts` の `globalSetup` パスが正しいことを確認
- `platform.ts` の Tauri バイナリパスが正しいことを確認

### 4. CoDD ワークフロー

テスト統合後、以下を実行：

```bash
codd scan --path .
codd propagate
codd impact
```

## 注意事項

- 生成コードには `@generated-by: codd implement` コメントが含まれる。統合時にこのコメントを残すかは任意
- テストは Linux と macOS のみ対象。Windows は明示的にスコープ外
- E2E テストは Tauri アプリが単一インスタンスのため `workers: 1`（シリアル実行）が必須
- Vitest テストで `@tauri-apps/api/core` の `invoke` をモックする必要がある場合、`vi.mock()` パターンが Sprint 20/23 のテストに実装済み
