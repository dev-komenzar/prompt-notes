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

/** Type text into the CodeMirror 6 editor. */
export async function typeInEditor(text: string): Promise<void> {
  const editor = await browser.$('.cm-editor');
  await editor.click();
  await browser.keys(text.split(''));
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
