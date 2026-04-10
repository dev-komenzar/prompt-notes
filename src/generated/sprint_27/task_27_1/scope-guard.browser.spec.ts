// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 27-1
// @task-title: 完了条件
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/acceptance_criteria.md
// @generated-by: codd implement --sprint 27

import { test, expect, type Page } from '@playwright/test';
import { launchApp, navigateTo } from './helpers/app-launch';
import { createTestNote, deleteTestNote } from './helpers/test-data';

async function collectNetworkRequests(page: Page, action: () => Promise<void>): Promise<string[]> {
  const externalUrls: string[] = [];
  page.on('request', (req) => {
    const url = req.url();
    if (!url.startsWith('http://localhost') && !url.startsWith('tauri://') && !url.startsWith('https://tauri.')) {
      externalUrls.push(url);
    }
  });
  await action();
  return externalUrls;
}

test.describe('Scope guard: prohibited features must not exist', () => {
  test.fixme('FC-SC-01 / FC-SC-02: no external network requests (AI calls or cloud sync) during normal operation', async () => {
    const { browser, page } = await launchApp();
    try {
      const fn = await createTestNote([], '外部通信テスト本文');
      const externalUrls = await collectNetworkRequests(page, async () => {
        await navigateTo(page, '/');
        await page.waitForSelector('.masonry-grid, .note-card, .empty-state');
        await navigateTo(page, `/edit/${fn}`);
        await page.waitForSelector('.cm-editor');
        await page.waitForTimeout(2000);
      });
      expect(externalUrls).toHaveLength(0);
      await deleteTestNote(fn);
    } finally {
      await browser.close();
    }
  });

  test.fixme('FC-ED-02: no title input element exists in editor screen', async () => {
    const { browser, page } = await launchApp();
    try {
      const fn = await createTestNote([], 'タイトル禁止テスト');
      await navigateTo(page, `/edit/${fn}`);
      await page.waitForSelector('.cm-editor');

      const titleInputCount = await page.locator(
        'input[name="title"], input[placeholder*="タイトル"], input[placeholder*="title"], textarea[name="title"]'
      ).count();
      expect(titleInputCount).toBe(0);

      await deleteTestNote(fn);
    } finally {
      await browser.close();
    }
  });

  test.fixme('FC-ED-02: no Markdown rendering (h1-h6, strong, em) in editor body area', async () => {
    const { browser, page } = await launchApp();
    try {
      const fn = await createTestNote([], '# 見出し\n**太字** _イタリック_');
      await navigateTo(page, `/edit/${fn}`);
      await page.waitForSelector('.cm-editor');

      const editorContent = page.locator('.cm-content');
      const rendered = editorContent.locator('h1, h2, h3, h4, h5, h6, strong, em, blockquote');
      expect(await rendered.count()).toBe(0);

      await deleteTestNote(fn);
    } finally {
      await browser.close();
    }
  });

  test.fixme('FC-SC-01: no fetch or XMLHttpRequest to external APIs', async () => {
    const { browser, page } = await launchApp();
    try {
      const violations: string[] = [];
      await page.addInitScript(() => {
        const origFetch = window.fetch;
        (window as any).fetch = function (input: RequestInfo, init?: RequestInit) {
          const url = typeof input === 'string' ? input : (input as Request).url;
          if (!url.startsWith('http://localhost') && !url.startsWith('tauri://')) {
            (window as any).__fetchViolations = (window as any).__fetchViolations || [];
            (window as any).__fetchViolations.push(url);
          }
          return origFetch.call(window, input, init);
        };

        const origXHR = window.XMLHttpRequest.prototype.open;
        window.XMLHttpRequest.prototype.open = function (method: string, url: string) {
          if (!url.startsWith('http://localhost') && !url.startsWith('tauri://')) {
            (window as any).__xhrViolations = (window as any).__xhrViolations || [];
            (window as any).__xhrViolations.push(url);
          }
          return origXHR.apply(this, arguments as any);
        };
      });

      await navigateTo(page, '/');
      await page.waitForSelector('.masonry-grid, .note-card, .empty-state');
      await page.waitForTimeout(1000);

      const fetchViolations = await page.evaluate(() => (window as any).__fetchViolations || []);
      const xhrViolations = await page.evaluate(() => (window as any).__xhrViolations || []);
      expect([...fetchViolations, ...xhrViolations]).toHaveLength(0);
    } finally {
      await browser.close();
    }
  });

  test.fixme('FC-ED-01: CodeMirror 6 editor element is present (.cm-editor)', async () => {
    const { browser, page } = await launchApp();
    try {
      const fn = await createTestNote([], 'エディタエンジン確認');
      await navigateTo(page, `/edit/${fn}`);
      await page.waitForSelector('.cm-editor', { timeout: 5000 });
      const cmEditor = await page.locator('.cm-editor').count();
      expect(cmEditor).toBeGreaterThan(0);

      // Ensure no Monaco-specific element exists
      const monacoCount = await page.locator('.monaco-editor').count();
      expect(monacoCount).toBe(0);

      await deleteTestNote(fn);
    } finally {
      await browser.close();
    }
  });
});
