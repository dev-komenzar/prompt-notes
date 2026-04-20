---
codd:
  node_id: test:e2e_strategy
  type: test
  depends_on:
  - id: test:acceptance_criteria
    relation: derives_from
    semantic: governance
  - id: req:promptnotes-requirements
    relation: derives_from
    semantic: governance
  modules:
  - editor
  - feed
  - storage
  - settings
---

# E2E テスト戦略

本ドキュメントは PromptNotes の E2E (End-to-End) テスト戦略と運用手順を定義する。
`test:acceptance_criteria` で定義された受入基準 (AC-*) を V-Model の最上位で検証することを目的とする。

## 1. 前提と全体構成

| 項目 | 採用 |
|---|---|
| ランナー | WebdriverIO v9 + Mocha |
| ドライバ | `tauri-driver` (Tauri 公式の WebDriver 実装) |
| 検証対象 | `src-tauri/target/release/promptnotes` (リリースビルド済みバイナリ) |
| 対応プラットフォーム | Linux / macOS (`tests/wdio.conf.ts` 内 `resolveTauriBinary()` で判別) |

WebdriverIO が `onPrepare` フックで `tauri-driver` を `spawn` し、Tauri バイナリを WebDriver 経由で操作する。
フロントエンドのユニットテスト (vitest) および Rust の単体テスト (cargo test) とは独立した検証層に位置付ける。

## 2. ディレクトリレイアウト

```
tests/
├── wdio.conf.ts          # WebdriverIO 設定 (tauri-driver 起動・バイナリ解決)
├── e2e/                  # 受入基準ごとの spec
│   ├── editor.spec.ts          # module:editor
│   ├── feed.spec.ts            # (将来) module:feed
│   ├── grid.spec.ts            # レイアウト / グリッド
│   ├── keyboard-shortcut.spec.ts # FC-EDIT-01 ショートカット分離検証
│   ├── navigation.spec.ts      # 画面遷移
│   ├── platform.spec.ts        # OS 差分 (Cmd/Ctrl)
│   ├── scope-exclusion.spec.ts # 非スコープ機能の未実装確認
│   ├── settings.spec.ts        # module:settings
│   └── storage.spec.ts         # module:storage
└── helpers/
    ├── platform.ts             # OS 判別・モディファイアキー
    ├── test-fixtures.ts        # 一時 notes ディレクトリ作成
    └── webview-client.ts       # WebView 内 DOM 操作のヘルパ
```

## 3. 前提ツール

実行前に以下が利用可能である必要がある。

| ツール | 役割 | 確認コマンド |
|---|---|---|
| `tauri-driver` | WebDriver プロキシ | `which tauri-driver` |
| `WebKitWebDriver` / `msedgedriver` | プラットフォーム別 WebDriver | platform に依存 |
| リリースバイナリ | テスト対象 | `ls src-tauri/target/release/promptnotes` |

Linux (nix + direnv 前提) では `tauri-driver` は flake の dev shell から供給される。
リリースバイナリは `cargo tauri build --no-bundle` 等で事前に生成する。

## 4. 実行手順

```bash
# 1. リリースバイナリをビルド (初回・コード変更時)
cargo tauri build --no-bundle

# 2. E2E 実行
npm run e2e
```

`package.json` スクリプト:

```json
{
  "scripts": {
    "e2e": "wdio run tests/wdio.conf.ts"
  }
}
```

## 5. 受入基準との対応

各 spec は `test:acceptance_criteria` の AC-* ID をテスト名に含めることで追跡可能性を担保する。

```typescript
// AC-ED-01: CodeMirror 6 エディタの採用
it('AC-ED-01: editor engine is CodeMirror 6', async () => { ... });
```

| spec ファイル | カバーする AC ID 範囲 |
|---|---|
| `editor.spec.ts` | AC-ED-*, AC-EDIT-*, FC-SCOPE-01/02 |
| `keyboard-shortcut.spec.ts` | FC-EDIT-01 (ショートカット単独の分離検証 — ボタン動作と相乗させず `.md` ファイル件数 0→1 を確認) |
| `storage.spec.ts` | AC-STOR-* |
| `navigation.spec.ts` | AC-NAV-* |
| `settings.spec.ts` | AC-SET-*, AC-STOR-05, AC-STOR-05a, AC-STOR-05b, AC-STOR-05c (2 段階確定・移動オプション・衝突検出・起動時不在の 4 エラー分類) |
| `platform.spec.ts` | AC-PLAT-* (Cmd/Ctrl 差分) |
| `grid.spec.ts` | AC-FEED-* のうちレイアウト検証 |
| `scope-exclusion.spec.ts` | FC-SCOPE-* (非スコープ機能の未実装確認) |

## 6. テストデータ方針

- 各テストは `createTempNotesDir()` (`tests/helpers/test-fixtures.ts`) で **一時ディレクトリ** を生成し、`afterEach` で削除する
- 本番ユーザーデータ (`~/.local/share/com.promptnotes/notes/`、旧 `~/.local/share/com.promptnotes.app/notes/` 等) は参照しない
- ファイル名規則 `YYYY-MM-DDTHHMMSS.md` の生成/検出は `listNotesOnDisk()` ヘルパ経由で確認する
- 保存ディレクトリ変更系テスト（AC-STOR-05 系）は旧/新 2 つの一時ディレクトリを生成し、3 フェーズ実行後の各ディレクトリ状態（ファイル件数・`config.json` 内容・`SetConfigResult` 戻り値）を検証する

## 7. CI / ローカル実行の差分

| 観点 | ローカル | CI (将来) |
|---|---|---|
| バイナリ | 開発者が事前ビルド | `cargo tauri build --no-bundle` を前段ジョブで実行 |
| ヘッドレス | WebKitGTK はヘッドレス非対応 → Xvfb 併用 | `xvfb-run -a npm run e2e` |
| リトライ | 無し | flaky 対策で `--retries 1` 検討 |

## 8. Flakiness 対策

- 非同期状態の待機は **固定 sleep を使わず** `waitForAppReady()` 等のヘルパで条件待機する
- `tauri-driver` の起動直後はプロセスが不安定なため `onPrepare` 後に 1 回リトライ可能な構造を維持する
- 自動保存 (`AUTO_SAVE_MS = 2000`) に依存するテストは必ず 2 秒超の wait を入れる

## 9. 非スコープ

以下は E2E ではなく別層で検証する。

| 非スコープ | 代替検証層 |
|---|---|
| frontmatter parser の純粋ロジック | `tests/unit/frontmatter.test.ts` (vitest) |
| ファイル I/O の境界値 | `cargo test` (Rust 単体) |
| 視覚回帰 (Visual Regression) | 本戦略では対象外 |

## 10. 変更追従

- 本ドキュメントは `test:acceptance_criteria` に `derives_from` で紐付く
- AC-* が追加・変更された場合 `codd impact` で本ドキュメントが Amber 以上に検出される想定
- その際は対応する spec の追加または改訂を行い、同時に本ドキュメントの対応表 (§5) を更新する
