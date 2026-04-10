// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 37-1
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
import { waitForApp, navigateTo } from './helpers/app-launch';
import { pressNewNote } from './helpers/editor';

test.beforeAll(async () => {
  await waitForApp();
});

test.describe('FC-SC-01 / FC-GN: no network communication', () => {
  test('no fetch or XHR to external origins while using the app', async ({ page }) => {
    const externalRequests: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (!url.startsWith('http://localhost') && !url.startsWith('https://localhost') && !url.startsWith('tauri://')) {
        externalRequests.push(url);
      }
    });

    await navigateTo(page, '/');
    await page.waitForTimeout(1000);
    await pressNewNote(page);
    await page.waitForURL(/\/edit\//);
    await page.waitForTimeout(1000);

    expect(externalRequests, `unexpected external requests: ${externalRequests.join(', ')}`).toHaveLength(0);
  });
});

test.describe('FC-ED-02: no title input element on editor page', () => {
  test('editor page has no title-dedicated input or textarea', async ({ page }) => {
    await navigateTo(page, '/');
    await pressNewNote(page);
    await page.waitForURL(/\/edit\//);

    const titleInputs = await page
      .locator('input[data-title], textarea[data-title], .title-input, [aria-label*="タイトル"] input, [aria-label*="title" i] input')
      .count();
    expect(titleInputs, 'title input elements must not exist').toBe(0);
  });
});

test.describe('FC-ED-02: no Markdown rendering in editor body', () => {
  test('editor body area contains no rendered HTML elements from Markdown', async ({ page }) => {
    await navigateTo(page, '/');
    await pressNewNote(page);
    await page.waitForURL(/\/edit\//);
    await expect(page.locator('.cm-editor')).toBeVisible();

    const editorContent = page.locator('.cm-content');
    expect(await editorContent.locator('h1').count()).toBe(0);
    expect(await editorContent.locator('h2').count()).toBe(0);
    expect(await editorContent.locator('strong').count()).toBe(0);
    expect(await editorContent.locator('em').count()).toBe(0);
    expect(await editorContent.locator('blockquote').count()).toBe(0);
  });
});

test.describe('FC-SC-02: no cloud sync UI or functionality', () => {
  test('no cloud sync button or menu item exists in the app', async ({ page }) => {
    await navigateTo(page, '/');
    const syncElements = await page
      .locator('[data-testid*="sync"], button:has-text("同期"), button:has-text("Sync"), a:has-text("クラウド")')
      .count();
    expect(syncElements, 'cloud sync elements must not exist').toBe(0);
  });
});

test.describe('FC-SC-01: no AI invocation UI', () => {
  test('no AI call button or panel exists in the app', async ({ page }) => {
    await navigateTo(page, '/');
    const aiElements = await page
      .locator('button:has-text("AI"), button:has-text("GPT"), [data-testid*="ai-"], .ai-panel')
      .count();
    expect(aiElements, 'AI call elements must not exist').toBe(0);
  });
});

test.describe('FC-GN-01: app starts and basic navigation works', () => {
  test('index route (/) loads without 5xx error', async ({ page }) => {
    const response = await page.goto('http://localhost:1420/');
    expect(response?.status() ?? 200).toBeLessThan(500);
  });

  test('settings route (/settings) loads without 5xx error', async ({ page }) => {
    const response = await page.goto('http://localhost:1420/settings');
    expect(response?.status() ?? 200).toBeLessThan(500);
  });
});
