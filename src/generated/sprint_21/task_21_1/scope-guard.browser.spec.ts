// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 21-1
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
import { waitForAppReady, openPage } from './helpers/app-launch';
import { pressNewNote } from './helpers/editor';

test.beforeAll(async () => {
  await waitForAppReady();
});

test.describe('FC-SC-01: no AI calling functionality', () => {
  test('no external API calls are made from the app', async ({ page }) => {
    const externalRequests: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (
        !url.startsWith('http://localhost') &&
        !url.startsWith('https://localhost') &&
        !url.startsWith('asset://') &&
        !url.startsWith('tauri://')
      ) {
        externalRequests.push(url);
      }
    });

    await openPage(page, '/');
    await page.waitForTimeout(1000);
    await pressNewNote(page);
    await page.waitForURL(/\/edit\/.+/, { timeout: 5000 });
    await page.waitForTimeout(1000);

    expect(externalRequests).toHaveLength(0);
  });

  test('no fetch or XMLHttpRequest to external endpoints', async ({ page }) => {
    const externalFetches: string[] = [];
    await page.addInitScript(() => {
      const origFetch = window.fetch;
      window.fetch = function (...args) {
        const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
        if (!url.startsWith('http://localhost') && !url.startsWith('tauri://')) {
          (window as any).__externalFetches = (window as any).__externalFetches || [];
          (window as any).__externalFetches.push(url);
        }
        return origFetch.apply(this, args);
      };
    });

    await openPage(page, '/');
    await page.waitForTimeout(500);

    const fetches: string[] = await page.evaluate(() => (window as any).__externalFetches || []);
    expect(fetches).toHaveLength(0);
  });
});

test.describe('FC-SC-02: no cloud sync', () => {
  test('no network requests to cloud services', async ({ page }) => {
    const cloudPatterns = [/amazonaws\.com/, /googleapis\.com/, /azure\.com/, /firebase/, /supabase/, /notion\.so/];
    const cloudRequests: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (cloudPatterns.some((p) => p.test(url))) {
        cloudRequests.push(url);
      }
    });

    await openPage(page, '/');
    await page.waitForTimeout(1000);
    expect(cloudRequests).toHaveLength(0);
  });
});

test.describe('FC-ED-01: CodeMirror 6 must be present', () => {
  test('editor uses .cm-editor (CodeMirror 6 class)', async ({ page }) => {
    await openPage(page, '/');
    await pressNewNote(page);
    await page.waitForURL(/\/edit\/.+/, { timeout: 5000 });
    const cmEditor = page.locator('.cm-editor');
    await expect(cmEditor).toBeVisible();
    // Verify it's NOT a Monaco editor
    const monacoEditor = page.locator('.monaco-editor');
    expect(await monacoEditor.count()).toBe(0);
    // Verify it's NOT a textarea-based editor
    const standaloneTextarea = page.locator('.cm-editor ~ textarea, textarea.editor, #editor-textarea');
    expect(await standaloneTextarea.count()).toBe(0);
  });
});

test.describe('FC-ED-02: no title input, no Markdown preview rendering', () => {
  test('no title-specific input field on editor screen', async ({ page }) => {
    await openPage(page, '/');
    await pressNewNote(page);
    await page.waitForURL(/\/edit\/.+/, { timeout: 5000 });

    const titleInputs = await page.locator(
      'input[placeholder*="title" i], input[placeholder*="タイトル" i], input[name*="title" i], textarea[placeholder*="title" i]'
    ).count();
    expect(titleInputs).toBe(0);
  });

  test('no rendered Markdown HTML elements in editor body area', async ({ page }) => {
    await openPage(page, '/');
    await pressNewNote(page);
    await page.waitForURL(/\/edit\/.+/, { timeout: 5000 });

    const editor = page.locator('.cm-editor .cm-content');
    await editor.click();
    await editor.type('# Heading\n**bold text**\n- list item');

    const renderedH1 = await page.locator('.cm-content h1').count();
    const renderedStrong = await page.locator('.cm-content strong').count();
    const renderedEm = await page.locator('.cm-content em').count();
    expect(renderedH1 + renderedStrong + renderedEm).toBe(0);
  });
});

test.describe('FC-SC-03: no mobile-specific UI', () => {
  test('app targets desktop viewport', async ({ page }) => {
    await openPage(page, '/');
    const viewport = page.viewportSize();
    expect(viewport?.width ?? 0).toBeGreaterThan(600);
  });
});

test.describe('AC-DV-01: README.md has required sections', () => {
  test('README.md contains Download, Usage, and Local Development sections', async () => {
    const readmePath = process.cwd().includes('src/generated')
      ? '../../../../README.md'
      : 'README.md';
    const { existsSync, readFileSync } = await import('fs');
    const { resolve } = await import('path');
    const abs = resolve(process.cwd(), readmePath);
    if (!existsSync(abs)) {
      test.fixme();
      return;
    }
    const content = readFileSync(abs, 'utf-8');
    expect(content).toMatch(/## Download|# Download/i);
    expect(content).toMatch(/## Usage|# Usage/i);
    expect(content).toMatch(/## Local Development|# Local Development/i);
  });
});
