// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 49-1
// @task-title: 下記テストケース一覧のすべてが Playwright で通過
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/test/acceptance_criteria.md
// @generated-by: codd propagate

import { test, expect } from '@playwright/test';
import {
  BASE_URL,
  gotoEditor,
  gotoGrid,
  gotoSettings,
  tauriInvoke,
  waitForAppReady,
} from './helpers/app-launch';
import {
  getDefaultNotesDir,
  cleanupNoteFiles,
} from './helpers/test-data';
import {
  assertNoTitleInput,
  assertNoMarkdownRendering,
} from './helpers/assertions';

const notesDir = getDefaultNotesDir();

test.beforeAll(async () => {
  await waitForAppReady();
});

test.describe('scope-guard — prohibited features must not exist', () => {
  let createdFiles: string[] = [];

  test.afterEach(() => {
    cleanupNoteFiles(notesDir, createdFiles);
    createdFiles = [];
  });

  // FC-SC-01 / FC-SC-02: no network requests (no AI calls, no cloud sync)
  test('FC-SC-01 / FC-SC-02: no fetch or XHR requests to external origins during grid view', async ({
    page,
  }) => {
    const externalRequests: string[] = [];

    page.on('request', (req) => {
      const url = req.url();
      // Exclude localhost (app itself) — only flag external network calls
      if (!url.startsWith('http://localhost') && !url.startsWith('https://localhost') && !url.startsWith('tauri://')) {
        externalRequests.push(url);
      }
    });

    await gotoGrid(page);
    await page.waitForTimeout(1000);

    expect(
      externalRequests,
      `No external network requests allowed. Found: ${externalRequests.join(', ')}`,
    ).toHaveLength(0);
  });

  test('FC-SC-01 / FC-SC-02: no fetch or XHR to external origins during editor view', async ({
    page,
  }) => {
    const externalRequests: string[] = [];

    page.on('request', (req) => {
      const url = req.url();
      if (!url.startsWith('http://localhost') && !url.startsWith('https://localhost') && !url.startsWith('tauri://')) {
        externalRequests.push(url);
      }
    });

    await page.goto(BASE_URL);
    const result = await tauriInvoke<{ filename: string }>(page, 'create_note');
    createdFiles.push(result.filename);
    await gotoEditor(page, result.filename);
    await page.waitForTimeout(1000);

    expect(
      externalRequests,
      `No external network requests allowed. Found: ${externalRequests.join(', ')}`,
    ).toHaveLength(0);
  });

  // FC-ED-02: no title input in editor
  test('FC-ED-02: no title input/textarea in editor screen', async ({ page }) => {
    await page.goto(BASE_URL);
    const result = await tauriInvoke<{ filename: string }>(page, 'create_note');
    createdFiles.push(result.filename);
    await gotoEditor(page, result.filename);
    await assertNoTitleInput(page);
  });

  // FC-ED-02: no Markdown rendering (no <h1>, <strong>, etc.) in editor body
  test('FC-ED-02: no Markdown rendering elements in editor body area', async ({ page }) => {
    await page.goto(BASE_URL);
    const result = await tauriInvoke<{ filename: string }>(page, 'create_note');
    createdFiles.push(result.filename);
    await tauriInvoke(page, 'save_note', {
      filename: result.filename,
      frontmatter: { tags: [] },
      body: '# Heading\n**bold text**\n_italic_\n> blockquote',
    });
    await gotoEditor(page, result.filename);
    await assertNoMarkdownRendering(page);
  });

  // FC-SC-01: no AI-related UI elements
  test('FC-SC-01: no AI-call UI elements present anywhere in the app', async ({ page }) => {
    await gotoGrid(page);
    const aiElements = await page
      .locator(
        'button:has-text("AI"), button:has-text("Generate"), button:has-text("ChatGPT"), [aria-label*="AI" i], [data-testid*="ai"]',
      )
      .count();
    expect(aiElements, 'No AI-related UI elements must be present').toBe(0);
  });

  // FC-SC-02: no cloud sync UI elements
  test('FC-SC-02: no cloud sync UI elements present anywhere in the app', async ({ page }) => {
    await gotoSettings(page);
    const cloudElements = await page
      .locator(
        'button:has-text("Sync"), button:has-text("Cloud"), [aria-label*="sync" i], [aria-label*="cloud" i], [data-testid*="sync"]',
      )
      .count();
    expect(cloudElements, 'No cloud sync UI elements must be present').toBe(0);
  });

  // FC-SC-03: no mobile-specific viewport meta or responsive mobile UI
  test('FC-SC-03: app is desktop-targeted (no mobile-only UI patterns)', async ({ page }) => {
    await gotoGrid(page);
    // Mobile-specific elements that would indicate mobile targeting
    const mobileNav = await page
      .locator('[aria-label*="mobile" i], .mobile-nav, [data-testid*="mobile"]')
      .count();
    expect(mobileNav, 'No mobile-specific UI elements should exist').toBe(0);
  });

  // FC-ED-01: editor is CodeMirror 6, not other engines
  test('FC-ED-01: editor uses CodeMirror 6 (no Monaco, textarea, contenteditable body)', async ({
    page,
  }) => {
    await page.goto(BASE_URL);
    const result = await tauriInvoke<{ filename: string }>(page, 'create_note');
    createdFiles.push(result.filename);
    await gotoEditor(page, result.filename);

    // CodeMirror 6 marker must be present
    await expect(page.locator('.cm-editor')).toBeVisible();

    // Monaco editor container must NOT be present
    const monacoCount = await page.locator('.monaco-editor').count();
    expect(monacoCount, 'Monaco editor must not be present (FC-ED-01)').toBe(0);

    // Standalone contenteditable div that is NOT part of CodeMirror
    const standaloneContentEditable = await page
      .locator('[contenteditable="true"]')
      .filter({ hasNot: page.locator('.cm-editor [contenteditable="true"]') })
      .count();
    // The only contenteditable should be inside .cm-editor
    expect(standaloneContentEditable, 'No standalone contenteditable outside CodeMirror').toBe(0);
  });

  // window.__TAURI__ must exist (Tauri IPC available)
  test('Tauri IPC is available (framework:tauri)', async ({ page }) => {
    await page.goto(BASE_URL);
    const hasTauri = await page.evaluate(() => {
      return typeof (window as unknown as Record<string, unknown>).__TAURI__ !== 'undefined';
    });
    expect(hasTauri, '__TAURI__ must be available — app must run as Tauri, not plain browser').toBe(true);
  });

  // No direct fs access from frontend
  test('frontend cannot directly access filesystem (no Tauri fs plugin in allow scope)', async ({
    page,
  }) => {
    await page.goto(BASE_URL);
    // Attempting to use Tauri fs plugin directly should fail or be unavailable
    const canAccessFs = await page.evaluate(async () => {
      try {
        const tauri = (window as unknown as {
          __TAURI__?: {
            fs?: { readFile?: (path: string) => Promise<unknown> };
          };
        }).__TAURI__;
        if (!tauri?.fs?.readFile) return false;
        await tauri.fs.readFile('/etc/passwd');
        return true; // Should not reach here
      } catch {
        return false; // Expected: access denied
      }
    });
    expect(canAccessFs, 'Frontend must not be able to directly access filesystem via Tauri fs plugin').toBe(false);
  });
});
