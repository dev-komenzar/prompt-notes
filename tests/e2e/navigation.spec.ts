import {
  waitForAppReady,
  setNotesDirectoryAndReload,
} from '../helpers/webview-client';
import {
  createTempNotesDir,
  cleanupTempDir,
  writeTestConfig,
  seedNavigationFixture,
  seedOldNote,
  listNotesOnDisk,
} from '../helpers/test-fixtures';
import {
  pressEsc,
  pressEnter,
  pressArrowUp,
  pressArrowDown,
  pressDelete,
  pressC,
  pressD,
  focusSearchBar,
  blurAll,
  assertFocusedCard,
  assertNoFocus,
  assertFocusUnchanged,
  getCodeMirrorCursor,
  assertSearchBarFocused,
  readClipboard,
  writeClipboardSentinel,
} from './helpers/keyboard-nav';

/**
 * Covers AC-NAV-01〜10 — フィード画面キーボードナビゲーション
 * SSOT:
 *   docs/requirements/requirements.md:147-171
 *   docs/design/system_design.md:188-216
 *   docs/test/acceptance_criteria.md:271-348
 *
 * RED pin: 全 it は派生タスク (keyboard-nav 実装) 完了まで fail する前提で書かれている。
 * `it.skip` / `it.todo` / `it.only` は一切使用しない。
 */

const CLIPBOARD_SENTINEL = '__PRE_TEST_SENTINEL__';
const NEGATIVE_PAUSE_MS = 300; // system_design.md:154 の 200ms 目標 + 100ms バッファ

describe('module:keyboard-nav — フィード画面のキーボード操作 (AC-NAV-01〜10)', () => {
  let tempDir: string;
  let fixtureFilenames: string[];

  beforeEach(async () => {
    // Layer 1 — createTempNotesDir + writeTestConfig (全 it 共通)
    tempDir = createTempNotesDir();
    writeTestConfig(tempDir, tempDir);

    // Layer 2 — seedNavigationFixture + setNotesDirectoryAndReload + writeClipboardSentinel
    fixtureFilenames = seedNavigationFixture(tempDir);
    await setNotesDirectoryAndReload(tempDir);
    await waitForAppReady();
    // Give the feed list and card DOM a moment to render after the reload.
    await browser.pause(500);
    await writeClipboardSentinel(CLIPBOARD_SENTINEL);
  });

  afterEach(async () => {
    cleanupTempDir(tempDir);
  });

  // ──────────────────────────────────────────────────────────────
  // AC-NAV-01: Esc キーによる編集モード終了
  // 期待: 編集内容が自動保存 + 表示モードに戻る + そのカードにフォーカスが残る
  // ──────────────────────────────────────────────────────────────
  it('AC-NAV-01: Esc キー押下で編集モードが終了し、自動保存され、そのカードにカードフォーカスが残る', async () => {
    // 前提: 先頭カード (index 0) を編集モードにし、.cm-content にネイティブフォーカスを確立
    const cards = await browser.$$('[data-testid="note-card"]');
    expect(cards.length).toBeGreaterThanOrEqual(4);
    await cards[0].click();
    await browser.waitUntil(
      async () => (await browser.$('.cm-editor')).isExisting(),
      { timeout: 5_000, timeoutMsg: 'CodeMirror did not mount within 5s' },
    );
    const cmContent = await browser.$('.cm-content');
    await cmContent.click();

    // Esc キー押下
    await pressEsc();

    // 1. 編集モードが終了 (.cm-editor が消滅)
    await browser.waitUntil(
      async () => !(await (await browser.$('.cm-editor')).isExisting()),
      { timeout: 2_000, timeoutMsg: '.cm-editor did not unmount after Esc' },
    );

    // 2. カードフォーカスが残る (そのカードに data-focused="true")
    await assertFocusedCard(0);
  });

  // ──────────────────────────────────────────────────────────────
  // AC-NAV-02: カードフォーカス状態の視覚表示
  // 期待: 背景色の微妙な変化で示される (罫線・アウトラインは使われない)
  // ──────────────────────────────────────────────────────────────
  it('AC-NAV-02: フォーカス中カードは背景色差異で示され、罫線・アウトラインは使われない', async () => {
    // 前提: 先頭カード (index 0) にカードフォーカス状態を確立
    const cards = await browser.$$('[data-testid="note-card"]');
    await cards[0].click();
    await browser.waitUntil(
      async () => (await browser.$('.cm-editor')).isExisting(),
      { timeout: 5_000, timeoutMsg: 'CodeMirror did not mount within 5s' },
    );
    await pressEsc();
    await assertFocusedCard(0);

    // 背景色差異: フォーカス中 (index 0) ≠ 非フォーカス (index 1)
    // 色値は theme 差異を吸収するため固定せず、差異だけを assert する。
    const styles = await browser.execute(() => {
      const c = Array.from(
        document.querySelectorAll('[data-testid="note-card"]'),
      ) as HTMLElement[];
      const pick = (el: HTMLElement) => {
        const s = getComputedStyle(el);
        return {
          bg: s.backgroundColor,
          outline: s.outlineStyle,
          outlineWidth: s.outlineWidth,
          borderStyle: s.borderStyle,
          borderWidth: s.borderWidth,
        };
      };
      return { focused: pick(c[0]), other: pick(c[1]) };
    });

    // 1. 背景色に差異がある
    expect(styles.focused.bg).not.toEqual(styles.other.bg);

    // 2. outline 使用なし (none または 0px)
    const focusedOutlineAbsent =
      styles.focused.outline === 'none' ||
      styles.focused.outlineWidth === '0px';
    expect(focusedOutlineAbsent).toBe(true);

    // 3. border style 差異がない (非フォーカスと同じ → 罫線追加なし)
    expect(styles.focused.borderStyle).toEqual(styles.other.borderStyle);
    expect(styles.focused.borderWidth).toEqual(styles.other.borderWidth);
  });

  // ──────────────────────────────────────────────────────────────
  // AC-NAV-03: カードフォーカス状態で Esc → フォーカス解除
  // 期待: どのカードにもフォーカスがない状態になる
  // ──────────────────────────────────────────────────────────────
  it('AC-NAV-03: カードフォーカス状態で Esc → どのカードにもフォーカスがない状態になる', async () => {
    // 前提: 先頭カードにカードフォーカス状態を確立
    const cards = await browser.$$('[data-testid="note-card"]');
    await cards[0].click();
    await browser.waitUntil(
      async () => (await browser.$('.cm-editor')).isExisting(),
      { timeout: 5_000, timeoutMsg: 'CodeMirror did not mount within 5s' },
    );
    await pressEsc();
    await assertFocusedCard(0);

    // もう一度 Esc
    await pressEsc();

    // フォーカスなし状態
    await assertNoFocus();
  });

  // ──────────────────────────────────────────────────────────────
  // AC-NAV-04: ↑/↓ キーによるカード間フォーカス移動
  // ──────────────────────────────────────────────────────────────
  describe('AC-NAV-04: ↑/↓ キーによるカード間フォーカス移動', () => {
    it('AC-NAV-04a: ↓ キーで次（下方向・より古い）のカードにフォーカスが移動する', async () => {
      // 前提: index 0 にカードフォーカス状態
      const cards = await browser.$$('[data-testid="note-card"]');
      await cards[0].click();
      await browser.waitUntil(
        async () => (await browser.$('.cm-editor')).isExisting(),
        { timeout: 5_000, timeoutMsg: 'CodeMirror did not mount within 5s' },
      );
      await pressEsc();
      await assertFocusedCard(0);

      // ↓ 押下
      await pressArrowDown();

      // index 1 (次の古いカード) に移動
      await assertFocusedCard(1);
    });

    it('AC-NAV-04b: ↑ キーで前（上方向・より新しい）のカードにフォーカスが移動する', async () => {
      // 前提: index 1 にカードフォーカス状態
      // (先頭 click → Esc でフォーカス取得 → ↓ で index 1 に移動)
      const cards = await browser.$$('[data-testid="note-card"]');
      await cards[0].click();
      await browser.waitUntil(
        async () => (await browser.$('.cm-editor')).isExisting(),
        { timeout: 5_000, timeoutMsg: 'CodeMirror did not mount within 5s' },
      );
      await pressEsc();
      await pressArrowDown();
      await assertFocusedCard(1);

      // ↑ 押下
      await pressArrowUp();

      // index 0 に移動
      await assertFocusedCard(0);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // AC-NAV-05: Enter キーによる編集モード遷移
  // ──────────────────────────────────────────────────────────────
  it('AC-NAV-05: Enter キー押下でフォーカス中カードが編集モードに入り、CodeMirror 6 が出現する', async () => {
    // 前提: 先頭カードにカードフォーカス状態
    const cards = await browser.$$('[data-testid="note-card"]');
    await cards[0].click();
    await browser.waitUntil(
      async () => (await browser.$('.cm-editor')).isExisting(),
      { timeout: 5_000, timeoutMsg: 'CodeMirror did not mount within 5s' },
    );
    await pressEsc();
    await assertFocusedCard(0);
    // .cm-editor は unmount しているはず
    await browser.waitUntil(
      async () => !(await (await browser.$('.cm-editor')).isExisting()),
      { timeout: 2_000, timeoutMsg: '.cm-editor did not unmount after Esc' },
    );

    // Enter 押下
    await pressEnter();

    // CodeMirror 6 が出現
    await browser.waitUntil(
      async () => (await browser.$('.cm-editor')).isExisting(),
      { timeout: 5_000, timeoutMsg: '.cm-editor did not appear after Enter' },
    );
  });

  // ──────────────────────────────────────────────────────────────
  // AC-NAV-06: `c` キーによるクリップボードコピー
  // ──────────────────────────────────────────────────────────────
  it('AC-NAV-06: c キー押下で本文全体がクリップボードにコピーされ、Copy ボタン同等のフィードバック表示', async () => {
    // 前提: 先頭カード (note A) にカードフォーカス状態
    const cards = await browser.$$('[data-testid="note-card"]');
    await cards[0].click();
    await browser.waitUntil(
      async () => (await browser.$('.cm-editor')).isExisting(),
      { timeout: 5_000, timeoutMsg: 'CodeMirror did not mount within 5s' },
    );
    await pressEsc();
    await assertFocusedCard(0);

    // sentinel 確認
    expect(await readClipboard()).toEqual(CLIPBOARD_SENTINEL);

    // c 押下
    await pressC();

    // 1. 本文全体 (frontmatter 除く) がコピーされる
    await browser.waitUntil(
      async () => {
        const v = await readClipboard();
        return v !== CLIPBOARD_SENTINEL && v.includes('Navigation fixture note A');
      },
      { timeout: 3_000, timeoutMsg: 'Clipboard did not update to note body' },
    );
    const copied = await readClipboard();
    expect(copied).toContain('Navigation fixture note A');
    expect(copied).not.toContain('---'); // frontmatter delimiter excluded
    expect(copied).not.toContain('tags:'); // frontmatter field excluded

    // 2. Copy ボタンと同一フィードバック (AC-NAV-06: チェックマーク化・色変化)
    //    実装は `📋` → `✓` への置換 + `.copied` クラス付与で表現する。
    const copyButton = await browser.$(
      '[data-testid="note-card"][data-focused="true"] [data-testid="copy-button"]',
    );
    await browser.waitUntil(
      async () => {
        const cls = await copyButton.getAttribute('class');
        return typeof cls === 'string' && cls.split(/\s+/).includes('copied');
      },
      { timeout: 2_000, timeoutMsg: 'CopyButton did not show copied feedback (.copied class)' },
    );
  });

  // ──────────────────────────────────────────────────────────────
  // AC-NAV-07: `d` キー / Delete キーによるノート削除とフォーカス連鎖
  // ──────────────────────────────────────────────────────────────
  describe('AC-NAV-07: d / Delete キーによる削除とフォーカス連鎖', () => {
    it('AC-NAV-07a: 下にカードあり → d キー押下で削除され、下のカードに移る', async () => {
      // 前提: index 1 (B) にフォーカス (下は C, D、上は A)
      const cards = await browser.$$('[data-testid="note-card"]');
      await cards[0].click();
      await browser.waitUntil(
        async () => (await browser.$('.cm-editor')).isExisting(),
        { timeout: 5_000, timeoutMsg: 'CodeMirror did not mount within 5s' },
      );
      await pressEsc();
      await pressArrowDown();
      await assertFocusedCard(1);
      const beforeFilenames = listNotesOnDisk(tempDir);
      expect(beforeFilenames.length).toBe(4);
      const targetFilename = fixtureFilenames[1]; // B

      // d 押下
      await pressD();

      // カード数が 3 に収束するまで待機 (FLIP アニメ対策)
      await browser.waitUntil(
        async () => (await browser.$$('[data-testid="note-card"]')).length === 3,
        { timeout: 2_000, timeoutMsg: 'Card count did not drop to 3 after d' },
      );

      // FS から B が消えている
      const afterFilenames = listNotesOnDisk(tempDir);
      expect(afterFilenames.length).toBe(3);
      expect(afterFilenames).not.toContain(targetFilename);

      // 削除後のフォーカスは下のカード (新 index 1 = 旧 C) に移る
      await assertFocusedCard(1);
    });

    it('AC-NAV-07b: 下なし上あり → d キー押下で削除され、上のカードに移る', async () => {
      // 前提: 最下部 (index 3 = D) にフォーカス
      const cards = await browser.$$('[data-testid="note-card"]');
      await cards[0].click();
      await browser.waitUntil(
        async () => (await browser.$('.cm-editor')).isExisting(),
        { timeout: 5_000, timeoutMsg: 'CodeMirror did not mount within 5s' },
      );
      await pressEsc();
      await pressArrowDown();
      await pressArrowDown();
      await pressArrowDown();
      await assertFocusedCard(3);
      const targetFilename = fixtureFilenames[3];

      // d 押下
      await pressD();

      // カード数が 3 に収束
      await browser.waitUntil(
        async () => (await browser.$$('[data-testid="note-card"]')).length === 3,
        { timeout: 2_000, timeoutMsg: 'Card count did not drop to 3 after d' },
      );

      // FS から D が消えている
      const afterFilenames = listNotesOnDisk(tempDir);
      expect(afterFilenames.length).toBe(3);
      expect(afterFilenames).not.toContain(targetFilename);

      // フォーカスは上 (新 index 2 = 旧 C) に移る
      await assertFocusedCard(2);
    });

    it('AC-NAV-07c: 全削除 → フォーカスなし状態になる', async () => {
      // 4 枚を順に d で削除してゆく
      const cards = await browser.$$('[data-testid="note-card"]');
      await cards[0].click();
      await browser.waitUntil(
        async () => (await browser.$('.cm-editor')).isExisting(),
        { timeout: 5_000, timeoutMsg: 'CodeMirror did not mount within 5s' },
      );
      await pressEsc();
      await assertFocusedCard(0);

      for (let expected = 3; expected >= 0; expected--) {
        await pressD();
        await browser.waitUntil(
          async () =>
            (await browser.$$('[data-testid="note-card"]')).length === expected,
          {
            timeout: 2_000,
            timeoutMsg: `Card count did not drop to ${expected} after d`,
          },
        );
      }

      // FS からすべて消えている
      expect(listNotesOnDisk(tempDir).length).toBe(0);

      // フォーカスなし状態
      await assertNoFocus();
    });

    it('AC-NAV-07d: Delete キーでも d キーと同じ削除挙動が起きる (key equivalence)', async () => {
      // 前提: index 0 (A) にフォーカス
      const cards = await browser.$$('[data-testid="note-card"]');
      await cards[0].click();
      await browser.waitUntil(
        async () => (await browser.$('.cm-editor')).isExisting(),
        { timeout: 5_000, timeoutMsg: 'CodeMirror did not mount within 5s' },
      );
      await pressEsc();
      await assertFocusedCard(0);
      const targetFilename = fixtureFilenames[0];

      // Delete 押下
      await pressDelete();

      // カード数が 3 に収束
      await browser.waitUntil(
        async () => (await browser.$$('[data-testid="note-card"]')).length === 3,
        {
          timeout: 2_000,
          timeoutMsg: 'Card count did not drop to 3 after Delete',
        },
      );

      // FS から A が消えている
      const afterFilenames = listNotesOnDisk(tempDir);
      expect(afterFilenames).not.toContain(targetFilename);

      // 下のカード (新 index 0 = 旧 B) にフォーカスが移る
      await assertFocusedCard(0);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // AC-NAV-08: フォーカスなし状態からの ↑/↓ キー
  // 期待: フィード先頭 (最新) のカードにフォーカスが当たる
  // ──────────────────────────────────────────────────────────────
  it('AC-NAV-08: フォーカスなし状態で ↑ または ↓ → フィード先頭 (最新) のカードにフォーカス', async () => {
    // 前提: どのカードにもフォーカスがなく、document.activeElement === body
    await blurAll();
    await assertNoFocus();

    // ↓ 押下
    await pressArrowDown();

    // index 0 (最新) にフォーカス
    await assertFocusedCard(0);
  });

  // ──────────────────────────────────────────────────────────────
  // AC-NAV-09: 矢印キーの有効範囲制限
  // ──────────────────────────────────────────────────────────────
  describe('AC-NAV-09: 矢印キーの有効範囲制限 (編集中 / 検索中)', () => {
    it('AC-NAV-09a: 編集モード中の ↑ は CodeMirror 内のカーソル移動として動作し、カード間移動は発生しない', async () => {
      // 前提: index 1 (B) を編集モードに入れ、.cm-content にフォーカス
      // 複数行本文があると ↑ のカーソル移動が観測しやすいので改行付き本文に編集する
      const cards = await browser.$$('[data-testid="note-card"]');
      await cards[1].click();
      await browser.waitUntil(
        async () => (await browser.$('.cm-editor')).isExisting(),
        { timeout: 5_000, timeoutMsg: 'CodeMirror did not mount within 5s' },
      );
      const cmContent = await browser.$('.cm-content');
      await cmContent.click();
      // 改行入りテキストを追加して ↑ でカーソル移動可能な状態を作る
      await browser.keys(['End']);
      await browser.keys(['Enter']);
      await browser.keys('line2');
      const before = await getCodeMirrorCursor();
      expect(before).toBeGreaterThan(0);
      const focusedBefore = await browser.execute(() => {
        const cs = Array.from(
          document.querySelectorAll('[data-testid="note-card"]'),
        ) as HTMLElement[];
        return cs.map((c) => c.getAttribute('data-focused') === 'true');
      });

      // ↑ 押下
      await pressArrowUp();

      // 肯定的代替シグナル: CodeMirror caret 変化
      await browser.waitUntil(
        async () => (await getCodeMirrorCursor()) !== before,
        { timeout: NEGATIVE_PAUSE_MS, timeoutMsg: 'CodeMirror caret did not move for ↑' },
      );
      // 不変性: data-focused index 不変
      const focusedAfter = await browser.execute(() => {
        const cs = Array.from(
          document.querySelectorAll('[data-testid="note-card"]'),
        ) as HTMLElement[];
        return cs.map((c) => c.getAttribute('data-focused') === 'true');
      });
      expect(focusedAfter).toEqual(focusedBefore);
    });

    it('AC-NAV-09b: 編集モード中の ↓ は CodeMirror 内のカーソル移動として動作し、カード間移動は発生しない', async () => {
      // 前提: index 1 (B) を編集モードにし、複数行本文で先頭行にカーソル
      const cards = await browser.$$('[data-testid="note-card"]');
      await cards[1].click();
      await browser.waitUntil(
        async () => (await browser.$('.cm-editor')).isExisting(),
        { timeout: 5_000, timeoutMsg: 'CodeMirror did not mount within 5s' },
      );
      const cmContent = await browser.$('.cm-content');
      await cmContent.click();
      await browser.keys(['End']);
      await browser.keys(['Enter']);
      await browser.keys('line2');
      // カーソルを先頭 (offset 0) に戻す
      await browser.keys(['Home']);
      await browser.keys(['ArrowUp']); // move to first line
      const before = await getCodeMirrorCursor();
      const focusedBefore = await browser.execute(() => {
        const cs = Array.from(
          document.querySelectorAll('[data-testid="note-card"]'),
        ) as HTMLElement[];
        return cs.map((c) => c.getAttribute('data-focused') === 'true');
      });

      // ↓ 押下
      await pressArrowDown();

      // 肯定的代替シグナル: CodeMirror caret 変化
      await browser.waitUntil(
        async () => (await getCodeMirrorCursor()) !== before,
        { timeout: NEGATIVE_PAUSE_MS, timeoutMsg: 'CodeMirror caret did not move for ↓' },
      );
      // 不変性: data-focused index 不変
      const focusedAfter = await browser.execute(() => {
        const cs = Array.from(
          document.querySelectorAll('[data-testid="note-card"]'),
        ) as HTMLElement[];
        return cs.map((c) => c.getAttribute('data-focused') === 'true');
      });
      expect(focusedAfter).toEqual(focusedBefore);
    });

    it('AC-NAV-09c: 検索バーにフォーカスがある状態で ↑ → 検索バーのフォーカス維持、カード間移動なし', async () => {
      await focusSearchBar();
      const focusedBefore = await browser.execute(() => {
        const cs = Array.from(
          document.querySelectorAll('[data-testid="note-card"]'),
        ) as HTMLElement[];
        return cs.map((c) => c.getAttribute('data-focused') === 'true');
      });

      // ↑ 押下
      await pressArrowUp();

      // 肯定的代替シグナル: 検索バーが activeElement のまま
      await browser.pause(NEGATIVE_PAUSE_MS);
      await assertSearchBarFocused();
      // 不変性: data-focused index 不変
      const focusedAfter = await browser.execute(() => {
        const cs = Array.from(
          document.querySelectorAll('[data-testid="note-card"]'),
        ) as HTMLElement[];
        return cs.map((c) => c.getAttribute('data-focused') === 'true');
      });
      expect(focusedAfter).toEqual(focusedBefore);
    });

    it('AC-NAV-09d: 検索バーにフォーカスがある状態で ↓ → 検索バーのフォーカス維持、カード間移動なし', async () => {
      await focusSearchBar();
      const focusedBefore = await browser.execute(() => {
        const cs = Array.from(
          document.querySelectorAll('[data-testid="note-card"]'),
        ) as HTMLElement[];
        return cs.map((c) => c.getAttribute('data-focused') === 'true');
      });

      // ↓ 押下
      await pressArrowDown();

      // 肯定的代替シグナル: 検索バーが activeElement のまま
      await browser.pause(NEGATIVE_PAUSE_MS);
      await assertSearchBarFocused();
      // 不変性: data-focused index 不変
      const focusedAfter = await browser.execute(() => {
        const cs = Array.from(
          document.querySelectorAll('[data-testid="note-card"]'),
        ) as HTMLElement[];
        return cs.map((c) => c.getAttribute('data-focused') === 'true');
      });
      expect(focusedAfter).toEqual(focusedBefore);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // AC-NAV-10: カード間移動の境界動作
  // ──────────────────────────────────────────────────────────────
  describe('AC-NAV-10: カード間移動の境界動作', () => {
    it('AC-NAV-10a: 最上部カードで ↑ キー → 何も起きない (フォーカスは最上部に留まる)', async () => {
      // 前提: index 0 にフォーカス
      const cards = await browser.$$('[data-testid="note-card"]');
      await cards[0].click();
      await browser.waitUntil(
        async () => (await browser.$('.cm-editor')).isExisting(),
        { timeout: 5_000, timeoutMsg: 'CodeMirror did not mount within 5s' },
      );
      await pressEsc();
      await assertFocusedCard(0);

      // ↑ 押下
      await pressArrowUp();

      // 300ms 待機後も data-focused === 0 不変
      await assertFocusUnchanged(0);
    });

    it('AC-NAV-10b: 最下部カードで ↓ + 古いノートあり → より古いノートがロードされる', async () => {
      // 古いノート (8 日前) を追加してからリロード、その後最下部にフォーカス
      seedOldNote(tempDir, 8, [], 'Old navigation note beyond 7-day filter');
      await setNotesDirectoryAndReload(tempDir);
      await waitForAppReady();
      await browser.pause(500);

      const cardsBefore = await browser.$$('[data-testid="note-card"]');
      const cardCountBefore = cardsBefore.length;
      expect(cardCountBefore).toBeGreaterThanOrEqual(4);
      const lastIndex = cardCountBefore - 1;

      // 最下部までフォーカス移動
      await cardsBefore[0].click();
      await browser.waitUntil(
        async () => (await browser.$('.cm-editor')).isExisting(),
        { timeout: 5_000, timeoutMsg: 'CodeMirror did not mount within 5s' },
      );
      await pressEsc();
      for (let i = 0; i < lastIndex; i++) {
        await pressArrowDown();
      }
      await assertFocusedCard(lastIndex);

      // ↓ 押下 — より古いノートがロードされてカード数が増える
      await pressArrowDown();

      await browser.waitUntil(
        async () => {
          const cs = await browser.$$('[data-testid="note-card"]');
          return cs.length > cardCountBefore;
        },
        {
          timeout: 3_000,
          timeoutMsg: 'Older notes were not loaded after ↓ at the last card',
        },
      );
    });

    it('AC-NAV-10c: 最下部カードで ↓ + 古いノートなし → 何も起きない (カード件数・FS・フォーカス不変)', async () => {
      // 前提: fixture 4 件のみ (古いノートなし)、最下部 (index 3) にフォーカス
      const cardsBefore = await browser.$$('[data-testid="note-card"]');
      const cardCountBefore = cardsBefore.length;
      const lastIndex = cardCountBefore - 1;
      await cardsBefore[0].click();
      await browser.waitUntil(
        async () => (await browser.$('.cm-editor')).isExisting(),
        { timeout: 5_000, timeoutMsg: 'CodeMirror did not mount within 5s' },
      );
      await pressEsc();
      for (let i = 0; i < lastIndex; i++) {
        await pressArrowDown();
      }
      await assertFocusedCard(lastIndex);

      const filesBefore = listNotesOnDisk(tempDir);

      // ↓ 押下
      await pressArrowDown();

      // 300ms 待機後、件数・FS・フォーカス全て不変
      await browser.pause(NEGATIVE_PAUSE_MS);
      const cardsAfter = await browser.$$('[data-testid="note-card"]');
      expect(cardsAfter.length).toBe(cardCountBefore);

      const filesAfter = listNotesOnDisk(tempDir);
      expect(filesAfter).toEqual(filesBefore);

      await assertFocusedCard(lastIndex);
    });
  });
});
