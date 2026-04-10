// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 46-1
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
// @generated-by: codd propagate

import { test, expect } from '@playwright/test';
import { defaultNotesDir, createTestNote, deleteTestNote } from './helpers/test-data';

const APP_URL = 'http://localhost:1420';

test.describe('Scope guard — out-of-scope feature absence', () => {
  const notesDir = defaultNotesDir();
  const created: string[] = [];

  test.afterAll(async () => {
    for (const f of created) await deleteTestNote(notesDir, f);
  });

  test('FC-SC-01 / FC-SC-02: no network requests to external hosts', async ({ page }) => {
    const externalRequests: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (!url.startsWith('http://localhost') && !url.startsWith('tauri://')) {
        externalRequests.push(url);
      }
    });

    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');

    // Navigate to editor
    const fn = await createTestNote(notesDir, { body: 'scope guard' });
    created.push(fn);
    await page.goto(`${APP_URL}/edit/${encodeURIComponent(fn)}`);
    await page.waitForLoadState('networkidle');

    expect(externalRequests).toHaveLength(0);
  });

  test('FC-ED-01: CodeMirror editor element is present (not textarea/contenteditable fallback)', async ({ page }) => {
    const fn = await createTestNote(notesDir, { body: 'cm6 check' });
    created.push(fn);
    await page.goto(`${APP_URL}/edit/${encodeURIComponent(fn)}`);
    await page.waitForSelector('.cm-editor');
    await expect(page.locator('.cm-editor')).toBeVisible();
  });

  test('FC-ED-02: no title input exists on editor screen', async ({ page }) => {
    const fn = await createTestNote(notesDir, { body: 'no title check' });
    created.push(fn);
    await page.goto(`${APP_URL}/edit/${encodeURIComponent(fn)}`);
    await page.waitForSelector('.cm-editor');

    // No title-specific input/textarea
    const titleInputs = page.locator(
      'input[placeholder*="タイトル"], textarea[placeholder*="タイトル"], input[name="title"], textarea[name="title"], input[aria-label*="タイトル"]'
    );
    await expect(titleInputs).toHaveCount(0);
  });

  test('FC-ED-02: no Markdown rendered HTML in body area', async ({ page }) => {
    const fn = await createTestNote(notesDir, { body: '# heading\n**bold**\n_italic_' });
    created.push(fn);
    await page.goto(`${APP_URL}/edit/${encodeURIComponent(fn)}`);
    await page.waitForSelector('.cm-editor');

    // Rendered heading/strong/em must not appear inside body area
    const bodyArea = page.locator('.cm-editor');
    await expect(bodyArea.locator('h1, h2, h3, h4, h5, h6')).toHaveCount(0);
    await expect(bodyArea.locator('strong')).toHaveCount(0);
    await expect(bodyArea.locator('em')).toHaveCount(0);
  });

  test('FC-SC-01: no AI-related UI exists anywhere', async ({ page }) => {
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');

    const aiElements = page.locator('[data-testid*="ai"], button:text("AI"), button:text("Generate"), button:text("生成")');
    await expect(aiElements).toHaveCount(0);
  });

  test('FC-SC-02: no cloud sync UI exists anywhere', async ({ page }) => {
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');

    const syncElements = page.locator('[data-testid*="sync"], button:text("同期"), button:text("Sync"), button:text("クラウド")');
    await expect(syncElements).toHaveCount(0);
  });

  test('FC-ED-05: frontmatter region has .cm-frontmatter-bg class', async ({ page }) => {
    const fn = await createTestNote(notesDir, { tags: ['a'], body: 'fm bg check' });
    created.push(fn);
    await page.goto(`${APP_URL}/edit/${encodeURIComponent(fn)}`);
    await page.waitForSelector('.cm-editor');

    const fmLines = page.locator('.cm-frontmatter-bg');
    await expect(fmLines.first()).toBeVisible({ timeout: 2000 });
  });

  test('FC-GR-01: grid view default filter is NOT showing 8-days-old notes', async ({ page }) => {
    const { daysAgo } = await import('./helpers/test-data');
    const oldFn = await createTestNote(notesDir, { date: daysAgo(8), body: 'should be hidden' });
    created.push(oldFn);

    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');

    const oldCard = page.locator(`[data-filename="${oldFn}"]`);
    await expect(oldCard).not.toBeVisible({ timeout: 2000 });
  });
});
