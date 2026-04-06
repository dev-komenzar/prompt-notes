// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 55-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// trace: sprint_55/task_55_1 — CI E2E テスト構築 — WebView クライアントユーティリティ
import { type Page } from '@playwright/test';

/**
 * Waits for the Svelte SPA to fully initialize inside the Tauri WebView.
 * Detects the root component mount by checking for the app container.
 */
export async function waitForAppReady(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const app = document.querySelector('#app') ?? document.querySelector('[data-testid="app-root"]');
      return app !== null && app.children.length > 0;
    },
    { timeout: 10_000 },
  );
}

/**
 * Returns the current view name from the SPA state.
 */
export async function getCurrentView(page: Page): Promise<string> {
  return page.evaluate(() => {
    const el = document.querySelector('[data-current-view]');
    return el?.getAttribute('data-current-view') ?? 'unknown';
  });
}

/**
 * Navigates to a specific view by clicking the corresponding navigation element.
 */
export async function navigateToView(
  page: Page,
  view: 'grid' | 'editor' | 'settings',
): Promise<void> {
  const selectors: Record<string, string> = {
    grid: '[data-testid="nav-grid"], [aria-label="Grid view"]',
    editor: '[data-testid="nav-editor"], [aria-label="Editor"]',
    settings: '[data-testid="nav-settings"], [aria-label="Settings"]',
  };
  const selector = selectors[view];
  await page.click(selector);
  await page.waitForTimeout(300);
}

/**
 * Extracts the CodeMirror 6 editor content from the page.
 */
export async function getEditorContent(page: Page): Promise<string> {
  return page.evaluate(() => {
    const cmContent = document.querySelector('.cm-content');
    if (!cmContent) throw new Error('CodeMirror .cm-content element not found');
    return cmContent.textContent ?? '';
  });
}

/**
 * Types text into the CodeMirror 6 editor by focusing and dispatching key events.
 */
export async function typeInEditor(page: Page, text: string): Promise<void> {
  const editor = page.locator('.cm-editor');
  await editor.click();
  await page.keyboard.type(text, { delay: 20 });
}

/**
 * Gets the count of note cards displayed in the grid view.
 */
export async function getGridCardCount(page: Page): Promise<number> {
  return page.locator('[data-testid="note-card"]').count();
}

/**
 * Clicks a specific note card by index in the grid view.
 */
export async function clickGridCard(page: Page, index: number): Promise<void> {
  const cards = page.locator('[data-testid="note-card"]');
  await cards.nth(index).click();
}

/**
 * Gets all visible tag badges from the grid view cards.
 */
export async function getVisibleTags(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const badges = document.querySelectorAll('[data-testid="tag-badge"]');
    return Array.from(badges).map((b) => b.textContent?.trim() ?? '');
  });
}

/**
 * Checks whether the frontmatter region has a distinct background decoration in CodeMirror.
 */
export async function hasFrontmatterDecoration(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const lines = document.querySelectorAll('.cm-frontmatter-line, .cm-line');
    if (lines.length === 0) return false;
    // Check if any line has the frontmatter CSS class
    const fmLines = document.querySelectorAll('.cm-frontmatter-line');
    return fmLines.length > 0;
  });
}

/**
 * Checks if a title input field exists on the editor screen (should NOT exist per RBC-2).
 */
export async function hasTitleInputField(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const selectors = [
      'input[data-testid="title-input"]',
      'input[placeholder*="title" i]',
      'input[placeholder*="タイトル"]',
      '[data-testid="title-field"]',
      '.title-input',
      '#title-input',
    ];
    return selectors.some((s) => document.querySelector(s) !== null);
  });
}

/**
 * Checks if a Markdown preview/render panel exists (should NOT exist per RBC-2).
 */
export async function hasMarkdownPreview(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const selectors = [
      '[data-testid="markdown-preview"]',
      '.markdown-preview',
      '.md-preview',
      '.preview-pane',
      '[data-testid="preview-panel"]',
      'iframe[src*="preview"]',
    ];
    return selectors.some((s) => document.querySelector(s) !== null);
  });
}

/**
 * Gets the copy button element locator.
 */
export function getCopyButton(page: Page) {
  return page.locator(
    '[data-testid="copy-button"], [aria-label*="コピー"], [aria-label*="copy" i], button:has(.copy-icon)',
  );
}

/**
 * Checks whether CodeMirror 6 is the active editor engine.
 */
export async function isCodeMirror6Active(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const cmEditor = document.querySelector('.cm-editor');
    const cmContent = document.querySelector('.cm-content');
    return cmEditor !== null && cmContent !== null;
  });
}
