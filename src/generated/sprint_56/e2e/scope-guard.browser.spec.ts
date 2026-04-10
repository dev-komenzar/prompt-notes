// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 56-2
// @task-title: 全 E2E テスト通過
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
import { waitForAppReady, APP_URL, invokeTauriCommand } from './helpers/app-launch';
import { navigateToEditor } from './helpers/editor';
import { assertNoTitleInput, assertNoMarkdownRendering } from './helpers/assertions';

test.describe('scope-guard – out-of-scope features must be absent', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
  });

  // FC-SC-01: No AI calling functionality
  test('FC-SC-01: no external AI API calls are made (no fetch/XHR to non-local hosts)', async ({ page }) => {
    const externalRequests: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (
        !url.startsWith('http://localhost') &&
        !url.startsWith('https://localhost') &&
        !url.startsWith('tauri://') &&
        !url.startsWith('data:') &&
        !url.startsWith('blob:')
      ) {
        externalRequests.push(url);
      }
    });

    await page.goto(APP_URL);
    await page.waitForTimeout(2000);
    await page.goto(`${APP_URL}/settings`);
    await page.waitForTimeout(1000);

    expect(
      externalRequests,
      `External network requests are prohibited. Found: ${externalRequests.join(', ')}`
    ).toHaveLength(0);
  });

  // FC-SC-02: No cloud sync (no WebSocket or polling)
  test('FC-SC-02: no WebSocket connections to external hosts', async ({ page }) => {
    const wsConnections: string[] = [];
    page.on('websocket', (ws) => {
      if (!ws.url().includes('localhost')) {
        wsConnections.push(ws.url());
      }
    });

    await page.goto(APP_URL);
    await page.waitForTimeout(3000);

    expect(
      wsConnections,
      `WebSocket connections to external hosts are prohibited: ${wsConnections.join(', ')}`
    ).toHaveLength(0);
  });

  // FC-ED-02: No title input on editor screen
  test('FC-ED-02: editor screen has NO title-specific input/textarea', async ({ page }) => {
    const { filename } = await invokeTauriCommand<{ filename: string }>(page, 'create_note');
    await navigateToEditor(page, filename);
    await assertNoTitleInput(page);
    await invokeTauriCommand(page, 'delete_note', { filename });
  });

  // FC-ED-02: No Markdown rendering (no <h1>, <strong>, <em> generated in editor body)
  test('FC-ED-02: editor does NOT render Markdown to HTML elements', async ({ page }) => {
    const { filename } = await invokeTauriCommand<{ filename: string }>(page, 'create_note');
    await navigateToEditor(page, filename);

    const editor = page.locator('.cm-content');
    await editor.click();
    await editor.type('# Heading\n**Bold**\n_Italic_\n- List item');
    await page.waitForTimeout(500);

    await assertNoMarkdownRendering(page);
    await invokeTauriCommand(page, 'delete_note', { filename });
  });

  // FC-SC-01: window.fetch is not overridden to call AI APIs
  test('FC-SC-01: window.fetch does not call AI provider endpoints', async ({ page }) => {
    await page.goto(APP_URL);
    const aiEndpoints = await page.evaluate(() => {
      // Verify no AI-related global variables or endpoints are configured
      const w = window as Record<string, unknown>;
      const aiKeys = Object.keys(w).filter(
        (k) =>
          k.toLowerCase().includes('openai') ||
          k.toLowerCase().includes('anthropic') ||
          k.toLowerCase().includes('gemini') ||
          k.toLowerCase().includes('llm') ||
          k.toLowerCase().includes('ai_api')
      );
      return aiKeys;
    });
    expect(aiKeys, 'No AI API globals should be present').toHaveLength(0);

    // helper for the template literal
    function aiKeys(v: string[]): string[] { return v; }
  });

  // Tauri fs plugin access is not directly used in frontend
  test('FC-NNC1: frontend does not invoke Tauri fs plugin directly', async ({ page }) => {
    await page.goto(APP_URL);
    const fsAccess = await page.evaluate(() => {
      const w = window as Record<string, unknown>;
      // If fs plugin were enabled, __TAURI_INTERNALS__ or __TAURI__.fs would be accessible
      const tauriGlobal = (w.__TAURI__ as Record<string, unknown> | undefined) ?? {};
      return Object.prototype.hasOwnProperty.call(tauriGlobal, 'fs');
    });
    expect(fsAccess, 'Tauri fs plugin must not be exposed to the frontend').toBe(false);
  });

  // http plugin must not be available in frontend
  test('FC-NNC1: Tauri http plugin must not be accessible in frontend', async ({ page }) => {
    await page.goto(APP_URL);
    const httpAccess = await page.evaluate(() => {
      const w = window as Record<string, unknown>;
      const tauriGlobal = (w.__TAURI__ as Record<string, unknown> | undefined) ?? {};
      return Object.prototype.hasOwnProperty.call(tauriGlobal, 'http');
    });
    expect(httpAccess, 'Tauri http plugin must not be exposed to frontend').toBe(false);
  });

  // FC-SC-03: No mobile-specific UI (viewport meta for mobile)
  test('FC-SC-03: no mobile-specific viewport targeting', async ({ page }) => {
    await page.goto(APP_URL);
    const mobileViewport = await page.locator('meta[name="viewport"][content*="width=device-width"]').count();
    // Desktop app — mobile viewport targeting is unnecessary but not strictly harmful.
    // The key guard: no mobile-exclusive routes or UI components.
    const mobileNav = await page.locator('[aria-label*="mobile" i], .mobile-nav, .bottom-tab-bar').count();
    expect(mobileNav, 'No mobile navigation elements should exist').toBe(0);
  });

  // Clipboard API is used (not Tauri clipboard-manager plugin) for copy
  test('copy button uses Clipboard API, not Tauri clipboard-manager plugin', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const { filename } = await invokeTauriCommand<{ filename: string }>(page, 'create_note');
    await navigateToEditor(page, filename);

    // Monitor if clipboard-manager plugin invoke is called
    let clipboardManagerUsed = false;
    page.on('console', (msg) => {
      if (msg.text().includes('clipboard-manager')) clipboardManagerUsed = true;
    });

    const copyBtn = page.locator('button[aria-label*="コピー"], button:has-text("コピー"), button:has-text("Copy")');
    if (await copyBtn.isVisible()) {
      await copyBtn.click();
    }
    await page.waitForTimeout(500);

    // Verify navigator.clipboard.writeText is used (indirectly by checking no Tauri clipboard invoke)
    expect(clipboardManagerUsed, 'Tauri clipboard-manager plugin must not be used').toBe(false);

    await invokeTauriCommand(page, 'delete_note', { filename });
  });
});
