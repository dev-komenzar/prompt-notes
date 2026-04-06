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

// trace: sprint_55/task_55_1 — CI E2E テスト構築 — クロスモジュール画面遷移 E2E テスト
import { test, expect } from '@playwright/test';
import { resolvePlatformConfig, getNewNoteShortcut } from '../helpers/platform';
import {
  createTempNotesDir,
  cleanupTempDir,
  seedRecentNotes,
  writeTestConfig,
} from '../helpers/test-fixtures';
import {
  waitForAppReady,
  navigateToView,
  getCurrentView,
  getGridCardCount,
  clickGridCard,
  isCodeMirror6Active,
  typeInEditor,
} from '../helpers/webview-client';

const platformConfig = resolvePlatformConfig();

test.describe('Cross-module Navigation — E2E Tests', () => {
  let tempDir: string;

  test.beforeEach(async () => {
    tempDir = createTempNotesDir();
    writeTestConfig(tempDir, tempDir);
  });

  test.afterEach(async () => {
    cleanupTempDir(tempDir);
  });

  // Grid → Editor via card click (AC-GR-06)
  test('grid card click navigates to editor with note content', async ({ page }) => {
    seedRecentNotes(tempDir, 7, 3);
    await waitForAppReady(page);
    await navigateToView(page, 'grid');
    await page.waitForTimeout(1_500);

    const cardCount = await getGridCardCount(page);
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Click first card
    await clickGridCard(page, 0);
    await page.waitForTimeout(1_500);

    // Should now be in editor view with CodeMirror 6
    const isCM6 = await isCodeMirror6Active(page);
    expect(isCM6, 'After card click, editor with CodeMirror 6 must be displayed').toBe(
      true,
    );

    // Editor should have content from the clicked note
    const editorHasContent = await page.evaluate(() => {
      const content = document.querySelector('.cm-content');
      return content !== null && (content.textContent?.trim().length ?? 0) > 0;
    });
    expect(editorHasContent, 'Editor must display the clicked note content').toBe(true);
  });

  // Editor → Grid navigation
  test('can navigate from editor back to grid view', async ({ page }) => {
    seedRecentNotes(tempDir, 7, 2);
    await waitForAppReady(page);

    // Start at editor
    await navigateToView(page, 'editor');
    await page.waitForTimeout(500);
    expect(await isCodeMirror6Active(page)).toBe(true);

    // Navigate to grid
    await navigateToView(page, 'grid');
    await page.waitForTimeout(1_000);

    const cardCount = await getGridCardCount(page);
    expect(cardCount, 'Grid view must display cards after navigating from editor').toBeGreaterThanOrEqual(1);
  });

  // Settings → Grid → Editor round trip
  test('full navigation round trip: settings → grid → editor', async ({ page }) => {
    seedRecentNotes(tempDir, 7, 2);
    await waitForAppReady(page);

    // 1. Go to settings
    await navigateToView(page, 'settings');
    await page.waitForTimeout(500);

    const hasSettingsUI = await page.evaluate(() => {
      return (
        document.querySelector(
          '[data-testid="settings-screen"], [data-testid="notes-dir-display"], [data-testid="dir-picker-button"]',
        ) !== null
      );
    });
    expect(hasSettingsUI, 'Settings screen must be visible').toBe(true);

    // 2. Go to grid
    await navigateToView(page, 'grid');
    await page.waitForTimeout(1_000);
    const cardCount = await getGridCardCount(page);
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // 3. Click card to go to editor
    await clickGridCard(page, 0);
    await page.waitForTimeout(1_000);
    expect(await isCodeMirror6Active(page)).toBe(true);
  });

  // New note creation from grid view context
  test('Cmd+N / Ctrl+N works regardless of current view', async ({ page }) => {
    await waitForAppReady(page);

    const shortcut = getNewNoteShortcut(platformConfig.platform);

    // Create note from grid view
    await navigateToView(page, 'grid');
    await page.waitForTimeout(500);
    await page.keyboard.press(shortcut);
    await page.waitForTimeout(1_500);

    // Should transition to editor with new note
    const isCM6 = await isCodeMirror6Active(page);
    expect(isCM6, 'Cmd+N/Ctrl+N should open editor with new note').toBe(true);
  });

  // Auto-save persistence across view transitions
  test('auto-save persists content when switching views', async ({ page }) => {
    await waitForAppReady(page);
    await navigateToView(page, 'editor');

    const shortcut = getNewNoteShortcut(platformConfig.platform);
    await page.keyboard.press(shortcut);
    await page.waitForTimeout(1_000);

    const uniqueText = `Persist-test-${Date.now()}`;
    await typeInEditor(page, uniqueText);
    await page.waitForTimeout(2_000); // Wait for debounce + save

    // Switch to grid view
    await navigateToView(page, 'grid');
    await page.waitForTimeout(1_500);

    // Switch back to editor (or click the note card)
    const cardCount = await getGridCardCount(page);
    if (cardCount > 0) {
      await clickGridCard(page, 0);
      await page.waitForTimeout(1_500);

      // Content should be persisted
      const editorText = await page.evaluate(() => {
        return document.querySelector('.cm-content')?.textContent ?? '';
      });
      expect(
        editorText,
        'Content must be persisted after view switch (auto-save)',
      ).toContain(uniqueText);
    }
  });
});
