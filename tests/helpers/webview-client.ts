/**
 * WebdriverIO helpers for interacting with the Tauri WebView.
 */

/** Wait for the Svelte SPA to mount inside the Tauri WebView. */
export async function waitForAppReady(): Promise<void> {
  await browser.waitUntil(
    async () => {
      const app = await browser.$('#app, [data-testid="app-root"]');
      return app.isExisting();
    },
    { timeout: 15_000, timeoutMsg: 'App did not become ready within 15s' },
  );
}

/** Navigate to a view by clicking the corresponding nav element. */
export async function navigateToView(view: 'grid' | 'editor' | 'settings'): Promise<void> {
  const selectors: Record<string, string> = {
    grid: '[data-testid="nav-grid"], [aria-label="Grid view"]',
    editor: '[data-testid="nav-editor"], [aria-label="Editor"]',
    settings: '[data-testid="nav-settings"], [aria-label="Settings"]',
  };
  const readyMarkers: Record<string, string> = {
    grid: '.feed-container, [data-testid="feed-screen"]',
    editor: '.cm-editor',
    settings: '[data-testid="settings-screen"]',
  };
  const el = await browser.$(selectors[view]);
  await el.click();
  await browser.waitUntil(
    async () => (await browser.$(readyMarkers[view])).isExisting(),
    { timeout: 5_000, timeoutMsg: `View "${view}" did not mount within 5s` },
  );
}

/** Get the text content of the CodeMirror 6 editor. */
export async function getEditorContent(): Promise<string> {
  const el = await browser.$('.cm-content');
  return el.getText();
}

/** Type text into the CodeMirror 6 editor.
 *
 * WebdriverIO 9 normalises a literal SPACE character in a `browser.keys` array
 * to an empty keyDown action, dropping every space from the typed payload.
 * Type each character one at a time, mapping ` ` to the W3C "Space" key name
 * which the WDIO key-action layer expands to U+E00D correctly. */
export async function typeInEditor(text: string): Promise<void> {
  const editor = await browser.$('.cm-editor');
  await editor.click();
  for (const ch of text) {
    if (ch === ' ') {
      await browser.keys(['Space']);
    } else if (ch === '\n') {
      await browser.keys(['Enter']);
    } else {
      await browser.keys(ch);
    }
  }
}

/** Get the count of note cards in the grid view. */
export async function getGridCardCount(): Promise<number> {
  const cards = await browser.$$('[data-testid="note-card"]');
  return cards.length;
}

/** Click a specific note card by index. */
export async function clickGridCard(index: number): Promise<void> {
  const cards = await browser.$$('[data-testid="note-card"]');
  await cards[index].click();
}

/** Check whether CodeMirror 6 is the active editor engine. */
export async function isCodeMirror6Active(): Promise<boolean> {
  const cmEditor = await browser.$('.cm-editor');
  const cmContent = await browser.$('.cm-content');
  return (await cmEditor.isExisting()) && (await cmContent.isExisting());
}

/** Check if a title input field exists (should NOT exist per RBC-2). */
export async function hasTitleInputField(): Promise<boolean> {
  const selectors = [
    'input[data-testid="title-input"]',
    'input[placeholder*="title" i]',
    'input[placeholder*="タイトル"]',
    '[data-testid="title-field"]',
  ];
  for (const sel of selectors) {
    if (await (await browser.$(sel)).isExisting()) return true;
  }
  return false;
}

/** Check if a Markdown preview panel exists (should NOT exist per RBC-2). */
export async function hasMarkdownPreview(): Promise<boolean> {
  const selectors = [
    '[data-testid="markdown-preview"]',
    '.markdown-preview',
    '.preview-pane',
  ];
  for (const sel of selectors) {
    if (await (await browser.$(sel)).isExisting()) return true;
  }
  return false;
}

/** Check whether the frontmatter region has a background decoration. */
export async function hasFrontmatterDecoration(): Promise<boolean> {
  const el = await browser.$('.cm-frontmatter-line, .cm-frontmatter-bg');
  return el.isExisting();
}

/** Get the copy button element. */
export async function getCopyButton() {
  return browser.$(
    '[data-testid="copy-button"], [aria-label*="コピー"], [aria-label*="copy" i]',
  );
}

/**
 * Redirect the running app's notes_directory to `dir` and reload the SPA so the
 * Svelte stores re-read the new directory's contents. Required because the
 * Tauri binary is launched once per spec session — per-test isolation must
 * therefore happen via IPC at runtime.
 */
export async function setNotesDirectoryAndReload(dir: string): Promise<void> {
  await waitForAppReady();
  await browser.waitUntil(
    async () =>
      Boolean(
        await browser.execute(
          () => typeof (window as any).__TAURI_INTERNALS__?.invoke === 'function',
        ),
      ),
    { timeout: 10_000, timeoutMsg: 'Tauri IPC bridge did not attach within 10s' },
  );

  const ipcErr = await browser.executeAsync<string | null, [string]>(
    function (notesDir, done) {
      const invoke = (window as any).__TAURI_INTERNALS__.invoke as (
        cmd: string,
        args?: Record<string, unknown>,
      ) => Promise<unknown>;
      invoke('set_config', { newConfig: { notes_directory: notesDir } })
        .then(() => done(null))
        .catch((err: unknown) =>
          done(err instanceof Error ? err.message : String(err)),
        );
    },
    dir,
  );
  if (ipcErr) {
    throw new Error(`set_config IPC failed: ${ipcErr}`);
  }

  // Reload the page; Rust State survives, so onMount picks up the new directory.
  await browser.execute(() => window.location.reload());
  await browser.pause(300);
  await waitForAppReady();
}
