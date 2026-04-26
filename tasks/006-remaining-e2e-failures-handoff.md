# 残 E2E 失敗のヒアリング・タスクハンドオフ

**目的**: 次のセッションで、残った E2E 失敗 9 件について「仕様 (spec) を実装に合わせるか / 実装を仕様に合わせるか」をユーザーから 1 件ずつ確認する。

**前提となる原則** (memory `feedback_spec_is_source_of_truth`)
> CoDD では frontmatter が単一信頼源。テスト/仕様の乖離は勝手に埋めず、どちらを直すかをユーザーに確認する。

---

## このプロンプトを次セッションで使う方法

次セッションの最初のメッセージに以下をそのまま貼ってください:

```
tasks/005-remaining-e2e-failures-handoff.md を読んで、
そこに記載されている E2E 失敗 9 件について、
1 件ずつ私にヒアリングしてください。

各項目について:
1. 失敗の要約と該当ファイル箇所を提示
2. 該当する仕様 (docs/test/acceptance_criteria.md / docs/requirements/*) を引用
3. 現状の実装が仕様と乖離している箇所を提示
4. 「仕様を実装に合わせる」「実装を仕様に合わせる」「両方修正」「いったん保留」のどれかを聞く
5. 回答を踏まえて該当の修正を実施 (または保留タスクとして記録)

すべての項目を一度に判断するのではなく、1 件ずつ進めてください。
途中で関連項目をまとめたほうが効率的だと判断したら、
その提案を私にしてから進めてください。
```

---

## 前回セッションの最終状態

- branch: `main` / commit `4161039`
- `pnpm check` ✓ / `pnpm test` ✓ (21/21) / `pnpm e2e` 4 spec PASS, 4 spec FAIL
- バイナリは `pnpm tauri build --no-bundle` で正規ビルド済 (memory `project_tauri_build_devurl` 参照)
- `tests/e2e/_precheck.spec.ts` が devUrl フォールバックを早期検知

---

## 残 E2E 失敗一覧 (9 件 + α)

### A. テスト側のセットアップ漏れ (前回フィックスし忘れ)

#### A-1. `tests/e2e/keyboard-shortcut.spec.ts:27` — path 不整合

- **失敗**: `AC-EDIT-01: Ctrl/Cmd+N (without clicking the New button) creates exactly one note` — `Expected: 1, Received: 0`
- **原因**: `setNotesDirectoryAndReload(path.join(tempDir, 'notes'))` だが `listNotesOnDisk(tempDir)` で読む。他の spec と同じバグを直し忘れ。
- **質問**: 単純にパスを揃えれば直るはず (他 spec で実証済)。
  - **+α 懸念**: Tauri の Cmd+N は `tauri_plugin_global_shortcut` で OS レベル登録 ([src/shell/global-shortcut.ts](src/shell/global-shortcut.ts), [src-tauri/src/lib.rs](src-tauri/src/lib.rs))。一方 E2E は `browser.keys()` で WebView に合成イベントを送る → OS-level shortcut は発火しない可能性大。
  - **対案**: (a) WebView-level でも同チョードを listen して `handleNewNote()` を呼ぶ二重実装にする、(b) E2E 側で Rust IPC `create_note` を直接 invoke してショートカット同等の挙動を assert する、(c) 仕様 (AC-EDIT-01) を「OS-level shortcut で実現」と明記して E2E ではカバー外にする
- **聞くこと**: パス修正だけで済むか? それとも shortcut の発火経路設計を見直すか?

---

### B. テスト側 testid と現行アーキテクチャの乖離

#### B-1. `tests/e2e/settings.spec.ts:21` — `[data-testid="nav-settings"]` が存在しない

- **失敗**: `AC-SE-01: settings screen displays notes directory` — element not found
- **原因**: テストは `navigateToView('settings')` を経由して `[data-testid="nav-settings"], [aria-label="Settings"]` をクリック。しかし現行 [src/App.svelte](src/App.svelte) は Header の callback (`onOpenSettings`) でモーダルを開く方式。トップナビゲーションは存在しない。
- **仕様参照**: `docs/test/acceptance_criteria.md` の AC-SE-01 を確認 (画面遷移の手段は仕様で定まっているか?)
- **聞くこと**:
  - A. テストを更新して Header の歯車ボタン (`aria-label="設定"` 等) をクリックする方式に変える?
  - B. App.svelte に top-nav を追加する仕様変更?
  - C. テスト helper `navigateToView` の selector を現状コンポーネントに合わせて拡張する?

#### B-2. `tests/e2e/storage.spec.ts:35,50,82,102` — `[data-testid="nav-editor"]` が存在しない

- **失敗**: `AC-ST-01`, `AC-ST-02`, `CONV-FILENAME`, `CONV-STORAGE` — element not found
- **原因**: テストは `navigateToView('editor')` で editor view へ遷移するが、現行アーキテクチャは「フィード内インライン編集」(component_architecture §2.1b INV-CONTAIN — sibling として編集モードのカードが共存)。editor 専用 view は存在しない。
- **仕様参照**: `INV-CONTAIN-02/03/04/05` (inline-editing-invariant.spec.ts で green) と矛盾。`navigateToView('editor')` はもはや概念的に存在しない。
- **聞くこと**:
  - A. テストから `await navigateToView('editor')` を削除する (inline 編集前提なので不要)?
  - B. editor view を別途用意する仕様変更?
  - 多分 A で良さそうだが確認したい。

---

### C. 実装ギャップ (キーボードナビゲーション機能未実装)

#### C-1. `tests/e2e/navigation.spec.ts:240-281 AC-NAV-06` — `c` キーでクリップボードコピー

- **失敗**: `Clipboard did not update to note body`
- **仕様**: AC-NAV-06 (acceptance_criteria.md:315) `c` キー押下で本文全体コピー + Copy ボタン同等のフィードバック
- **コード**: [src/feed/keyboard-nav/dispatcher.ts](src/feed/keyboard-nav/dispatcher.ts) を確認。`c` キーのハンドラが実装されているか?
- **聞くこと**: 実装するか? いったん仕様から外すか?

#### C-2. `navigation.spec.ts:285-414 AC-NAV-07a/b/c/d` — `d` / Delete キーで削除 + フォーカス連鎖

- **失敗**: `Card count did not drop to N after d` (4 件)
- **仕様**: AC-NAV-07 (acceptance_criteria.md:323-333) 削除と次/前カードへのフォーカス移動
- **コード**: 同 dispatcher.ts。`d` / `Delete` ハンドラが未実装の可能性。
- **聞くこと**: 実装するか? いったん仕様から外すか?

#### C-3. `navigation.spec.ts:435-509 AC-NAV-09a/b` — 編集モード中の ↑/↓ で CodeMirror caret 移動

- **失敗**: `CodeMirror caret did not move for ↑/↓`
- **仕様**: AC-NAV-09 (acceptance_criteria.md:340-346)
- **原因候補**: 編集モード中は dispatcher.ts が ↑/↓ を CodeMirror にスルーする必要があるが、capture phase で潰している可能性
- **聞くこと**: dispatcher.ts のキーイベント取り扱いを修正するか? 仕様の方を緩めるか (例: caret 位置検証を取り除く)?

---

## 各項目を聞く際の推奨フロー

各項目について次の順で確認:

1. **症状を再現**: 該当 spec を `pnpm e2e --spec <path>` で個別実行し、エラーログを抜粋して提示
2. **仕様引用**: `docs/test/acceptance_criteria.md` 該当箇所を読み、当該 AC の責務とリリースブロッキング種別 (`[リリースブロッキング]` etc.) を明示
3. **現コード確認**: 関連する `src/` または `src-tauri/src/` のファイル/シンボルを示す
4. **乖離の所在**: テスト・仕様・実装のどこにずれがあるかを 1 行で要約
5. **選択肢提示**: 「仕様→実装」「実装→仕様」「両方修正」「保留」のどれが妥当か、選択肢に推奨を 1 つ添えて聞く

質問テンプレ例:
> AC-NAV-06 (`c` キーでコピー) は acceptance_criteria.md:315 で「リリースブロッキング相当の Copy ボタンと同一動作」と仕様化されています。
> 現 [dispatcher.ts](src/feed/keyboard-nav/dispatcher.ts) には `c` キーハンドラが見当たりません。
> 選択肢: A) 実装を追加 (推奨)、B) 仕様から `c` キーを外す、C) 保留タスク化
> どれにしますか?

---

## メモリへの追加候補 (このセッションで観測できた事実)

次セッションで決定が固まったら、以下を memory に追記する候補:

- インラインカード内 編集 vs 別 view editor のアーキテクチャ判断 (B-2 の結論次第)
- `tauri_plugin_global_shortcut` と E2E `browser.keys()` の相性 (A-1 の結論次第)
- `data-testid` 命名規約 (`nav-*` を使うか否か)
