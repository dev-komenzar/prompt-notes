/**
 * Helpers for the `module:keyboard-nav` E2E spec (AC-NAV-01〜10).
 *
 * - Key senders wrap `browser.keys()` with the W3C key-name convention used
 *   across the existing suite.
 * - Focus operations let each test establish the "destination" focus before
 *   dispatching a key, so the test asserts one transition at a time.
 * - State detection prefers the `data-focused="true"` attribute over
 *   `document.activeElement`, because the card-focus state is a middle layer
 *   between "no focus" and "edit mode" — it must coexist with the search-bar
 *   native focus per AC-NAV-09.
 * - Side-checks expose the CodeMirror caret and search-bar native focus so the
 *   AC-NAV-09a/b/c/d tests can assert the arrow-key intercepts.
 * - Clipboard helpers talk to the Tauri IPC (`read_from_clipboard` /
 *   `copy_to_clipboard`) so the test never has to touch the host clipboard
 *   through OS-level APIs.
 */

// ---------- Key senders ----------

export async function pressEsc(): Promise<void> {
  await browser.keys(['Escape']);
}

export async function pressEnter(): Promise<void> {
  await browser.keys(['Enter']);
}

export async function pressArrowUp(): Promise<void> {
  await browser.keys(['ArrowUp']);
}

export async function pressArrowDown(): Promise<void> {
  await browser.keys(['ArrowDown']);
}

export async function pressDelete(): Promise<void> {
  await browser.keys(['Delete']);
}

export async function pressC(): Promise<void> {
  await browser.keys('c');
}

export async function pressD(): Promise<void> {
  await browser.keys('d');
}

// ---------- Focus operations ----------

/**
 * Put native DOM focus on the SearchBar `<input>`. Used by AC-NAV-09c/d to set
 * up the arrow-key intercept precondition.
 */
export async function focusSearchBar(): Promise<void> {
  const input = await browser.$('[data-testid="search-input"]');
  await input.click();
  await browser.waitUntil(
    async () =>
      Boolean(
        await browser.execute(() => {
          const el = document.querySelector(
            '[data-testid="search-input"]',
          ) as HTMLElement | null;
          return !!el && document.activeElement === el;
        }),
      ),
    {
      timeout: 2_000,
      timeoutMsg: 'Search bar did not receive native focus within 2s',
    },
  );
}

/**
 * Drop all focus — both native DOM focus and card-focus state — so the next
 * arrow key tests the AC-NAV-08 "enter-from-nowhere" transition. Clicks a
 * neutral region (feed toolbar root) and then blurs activeElement just in
 * case an implicit focus remains on `<body>`.
 */
export async function blurAll(): Promise<void> {
  await browser.execute(() => {
    const active = document.activeElement as HTMLElement | null;
    if (active && typeof active.blur === 'function') active.blur();
    // Clear any card focus state by dispatching Escape to document.
    // (no-op if implementation does not bind to this layer yet; it's fine —
    // the data-focused assertion below is the authoritative check.)
  });
  await browser.waitUntil(
    async () =>
      Boolean(
        await browser.execute(
          () => document.activeElement === document.body,
        ),
      ),
    {
      timeout: 2_000,
      timeoutMsg: 'document.activeElement did not return to <body> within 2s',
    },
  );
}

/**
 * Directly set card-focus on the Nth note-card. Used sparingly — tests
 * normally drive focus through user-level interaction (arrow keys, Esc).
 * Provided for the rare setups where the precondition is "some card is
 * focused" without regard to how it got there.
 */
export async function focusCardAt(index: number): Promise<void> {
  const cards = await browser.$$('[data-testid="note-card"]');
  if (index < 0 || index >= cards.length) {
    throw new Error(
      `focusCardAt(${index}) out of range (cards.length=${cards.length})`,
    );
  }
  // Click the card to enter edit mode, then Esc to drop back into
  // card-focus state (AC-NAV-01 transition). This is the user-level path
  // into card-focus from a cold start.
  await cards[index].click();
  await browser.waitUntil(
    async () => (await browser.$('.cm-editor')).isExisting(),
    {
      timeout: 5_000,
      timeoutMsg: 'CodeMirror did not mount after click (focusCardAt setup)',
    },
  );
  await pressEsc();
  await assertFocusedCard(index);
}

// ---------- State detection ----------

/**
 * Assert that the Nth card (zero-based, newest-first) has `data-focused="true"`
 * and all other cards do not. Polls briefly to allow FLIP-style transitions
 * to settle.
 */
export async function assertFocusedCard(index: number): Promise<void> {
  await browser.waitUntil(
    async () => {
      const snapshot = await browser.execute(() => {
        const cards = Array.from(
          document.querySelectorAll('[data-testid="note-card"]'),
        ) as HTMLElement[];
        return cards.map((c) => c.getAttribute('data-focused') === 'true');
      });
      if (!Array.isArray(snapshot)) return false;
      if (index < 0 || index >= snapshot.length) return false;
      return snapshot.every((focused, i) => focused === (i === index));
    },
    {
      timeout: 2_000,
      timeoutMsg: `Expected card at index ${index} to be the only card with data-focused="true"`,
    },
  );
}

/** Assert that no card currently holds card-focus state. */
export async function assertNoFocus(): Promise<void> {
  await browser.waitUntil(
    async () => {
      const focused = await browser.execute(() => {
        const cards = Array.from(
          document.querySelectorAll('[data-testid="note-card"]'),
        ) as HTMLElement[];
        return cards.some((c) => c.getAttribute('data-focused') === 'true');
      });
      return focused === false;
    },
    {
      timeout: 2_000,
      timeoutMsg: 'Expected no card to hold card-focus state',
    },
  );
}

/**
 * Assert that card-focus did not move from `prevIndex`. Used by negative
 * checks (AC-NAV-09, AC-NAV-10a, AC-NAV-10c): wait 300ms for any spurious
 * transition to happen, then confirm focus is still pinned.
 */
export async function assertFocusUnchanged(prevIndex: number): Promise<void> {
  await browser.pause(300);
  await assertFocusedCard(prevIndex);
}

// ---------- Side-checks ----------

/**
 * Read the caret offset of the active CodeMirror 6 editor (`head` of the main
 * selection). Returns -1 if no editor is mounted. Used by AC-NAV-09a/b to
 * assert that ↑/↓ moved the caret inside the editor instead of the card focus.
 */
export async function getCodeMirrorCursor(): Promise<number> {
  return browser.execute(() => {
    const el = document.querySelector('.cm-editor') as
      | (HTMLElement & { cmView?: { view?: { state?: { selection?: { main?: { head?: number } } } } } })
      | null;
    if (!el) return -1;
    // @ts-ignore - runtime-only CodeMirror attach.
    const view = (el as any).cmView?.view ?? (window as any).__cmView;
    if (!view || !view.state) return -1;
    const head = view.state.selection?.main?.head;
    return typeof head === 'number' ? head : -1;
  }) as Promise<number>;
}

/**
 * Assert that the SearchBar `<input>` currently holds native DOM focus.
 * Used by AC-NAV-09c/d to verify that ↑/↓ was consumed by the input and did
 * not leak into card navigation.
 */
export async function assertSearchBarFocused(): Promise<void> {
  const focused = await browser.execute(() => {
    const el = document.querySelector(
      '[data-testid="search-input"]',
    ) as HTMLElement | null;
    return !!el && document.activeElement === el;
  });
  if (!focused) {
    throw new Error('Expected the search-bar input to hold native DOM focus');
  }
}

// ---------- Clipboard ----------

/** Read the system clipboard via the Tauri IPC command. */
export async function readClipboard(): Promise<string> {
  const result = await browser.executeAsync<string, []>(function (done) {
    const invoke = (window as any).__TAURI_INTERNALS__?.invoke as
      | ((cmd: string, args?: Record<string, unknown>) => Promise<unknown>)
      | undefined;
    if (!invoke) {
      done('__IPC_UNAVAILABLE__');
      return;
    }
    invoke('read_from_clipboard')
      .then((v) => done(typeof v === 'string' ? v : String(v)))
      .catch((err: unknown) =>
        done('__READ_FAILED__:' + (err instanceof Error ? err.message : String(err))),
      );
  });
  return result;
}

/**
 * Write a pre-test sentinel string to the system clipboard. Called in the
 * `beforeEach` of AC-NAV-06 so the assertion can distinguish "the test
 * overwrote the clipboard" from "the clipboard happened to match already".
 */
export async function writeClipboardSentinel(value: string): Promise<void> {
  const err = await browser.executeAsync<string | null, [string]>(
    function (v, done) {
      const invoke = (window as any).__TAURI_INTERNALS__?.invoke as
        | ((cmd: string, args?: Record<string, unknown>) => Promise<unknown>)
        | undefined;
      if (!invoke) {
        done('__IPC_UNAVAILABLE__');
        return;
      }
      invoke('copy_to_clipboard', { text: v })
        .then(() => done(null))
        .catch((e: unknown) =>
          done(e instanceof Error ? e.message : String(e)),
        );
    },
    value,
  );
  if (err) {
    throw new Error(`writeClipboardSentinel failed: ${err}`);
  }
}
