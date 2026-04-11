import { waitForAppReady, hasTitleInputField, hasMarkdownPreview } from '../helpers/webview-client';
import { createTempNotesDir, cleanupTempDir, writeTestConfig } from '../helpers/test-fixtures';

describe('Scope Exclusion — Prohibited Features Must NOT Exist', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = createTempNotesDir();
    writeTestConfig(tempDir, tempDir);
  });

  afterEach(async () => {
    cleanupTempDir(tempDir);
  });

  // FAIL-04: No title input field
  it('FAIL-04: title input field must not exist', async () => {
    await waitForAppReady();
    expect(await hasTitleInputField()).toBe(false);
  });

  // FAIL-05: No Markdown preview
  it('FAIL-05: Markdown preview must not exist', async () => {
    await waitForAppReady();
    expect(await hasMarkdownPreview()).toBe(false);
  });

  // FAIL-30: No AI/LLM call functionality
  it('FAIL-30: no AI/LLM UI exists', async () => {
    await waitForAppReady();
    const selectors = [
      '[data-testid*="ai" i]', '[data-testid*="llm" i]', '[data-testid*="chat" i]',
      '[aria-label*="AI" i]', '.ai-panel', '.chat-panel',
    ];
    for (const sel of selectors) {
      const el = await browser.$(sel);
      expect(await el.isExisting()).toBe(false);
    }
  });

  // FAIL-31: No cloud sync
  it('FAIL-31: no cloud sync UI exists', async () => {
    await waitForAppReady();
    const selectors = [
      '[data-testid*="sync" i]', '[data-testid*="cloud" i]',
      '[aria-label*="sync" i]', '.sync-button',
    ];
    for (const sel of selectors) {
      const el = await browser.$(sel);
      expect(await el.isExisting()).toBe(false);
    }
  });

  // FAIL-42: App uses Tauri framework
  it('FAIL-42: application is built on Tauri framework', async () => {
    await waitForAppReady();
    const hasTauri = await browser.execute(() => {
      return (
        typeof (window as any).__TAURI__ !== 'undefined' ||
        typeof (window as any).__TAURI_IPC__ !== 'undefined' ||
        typeof (window as any).__TAURI_INTERNALS__ !== 'undefined'
      );
    });
    expect(hasTauri).toBe(true);
  });

  // No manual save button (auto-save only)
  it('no manual save button exists in editor', async () => {
    await waitForAppReady();
    const selectors = [
      'button[aria-label*="save" i]', 'button[aria-label*="保存"]',
      '[data-testid="save-button"]', '.save-button',
    ];
    for (const sel of selectors) {
      const el = await browser.$(sel);
      // Exclude settings apply buttons
      if (await el.isExisting()) {
        const parentSettings = await el.$('xpath=./ancestor::*[@data-testid="settings-screen"]');
        expect(await parentSettings.isExisting()).toBe(true);
      }
    }
  });
});
