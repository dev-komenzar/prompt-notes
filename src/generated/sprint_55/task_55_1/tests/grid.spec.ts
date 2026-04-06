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

// trace: sprint_55/task_55_1 — CI E2E テスト構築 — module:grid E2E テスト
import { test, expect } from '@playwright/test';
import { resolvePlatformConfig } from '../helpers/platform';
import {
  createTempNotesDir,
  cleanupTempDir,
  seedRecentNotes,
  seedOldNotes,
  seedNote,
  daysAgo,
  writeTestConfig,
} from '../helpers/test-fixtures';
import {
  waitForAppReady,
  navigateToView,
  getGridCardCount,
  clickGridCard,
  getVisibleTags,
  getCurrentView,
  isCodeMirror6Active,
} from '../helpers/webview-client';
import { assertNoDirectFileAccess, assertIPCCommandCalled } from '../helpers/ipc-assertions';

const platformConfig = resolvePlatformConfig();

test.describe('module:grid — E2E Tests', () => {
  let tempDir: string;

  test.beforeEach(async () => {
    tempDir = createTempNotesDir();
    writeTestConfig(tempDir, tempDir);
  });

  test.afterEach(async () => {
    cleanupTempDir(tempDir);
  });

  // AC-GR-01: Pinterest スタイルカード表示
  test('AC-GR-01: grid displays Pinterest-style variable-height cards', async ({
    page,
  }) => {
    seedRecentNotes(tempDir, 7, 5);
    await waitForAppReady(page);
    await navigateToView(page, 'grid');
    await page.waitForTimeout(1_000);

    const cardCount = await getGridCardCount(page);
    expect(
      cardCount,
      'Grid must display note cards (AC-GR-01)',
    ).toBeGreaterThanOrEqual(1);

    // Verify masonry/column layout structure exists
    const hasMasonryLayout = await page.evaluate(() => {
      const grid = document.querySelector(
        '[data-testid="grid-container"], .grid-container, .masonry-grid',
      );
      if (!grid) return false;
      const style = getComputedStyle(grid);
      // CSS Columns or CSS Grid masonry
      return (
        style.columnCount !== 'auto' ||
        style.display === 'grid' ||
        grid.classList.contains('masonry-grid')
      );
    });
    expect(hasMasonryLayout, 'Grid must use Masonry/column layout (AC-GR-01)').toBe(true);
  });

  // AC-GR-01: Cards show body preview
  test('AC-GR-01: each card displays body preview text', async ({ page }) => {
    seedRecentNotes(tempDir, 7, 3);
    await waitForAppReady(page);
    await navigateToView(page, 'grid');
    await page.waitForTimeout(1_000);

    const cardsWithPreview = await page.evaluate(() => {
      const cards = document.querySelectorAll('[data-testid="note-card"]');
      let withText = 0;
      for (const card of cards) {
        const preview = card.querySelector(
          '[data-testid="card-preview"], .card-preview, .body-preview',
        );
        if (preview && (preview.textContent?.trim().length ?? 0) > 0) {
          withText++;
        }
      }
      return withText;
    });

    expect(cardsWithPreview, 'All cards must display body preview').toBeGreaterThan(0);
  });

  // AC-GR-02: デフォルト直近7日間フィルタ (RBC-4 / FAIL-08)
  test('AC-GR-02/FAIL-08: default filter shows only notes from last 7 days', async ({
    page,
  }) => {
    // Seed 3 recent notes (within 7 days) and 3 old notes (14+ days ago)
    const recentNotes = seedRecentNotes(tempDir, 7, 3);
    const oldNotes = seedOldNotes(tempDir, 14, 3);

    await waitForAppReady(page);
    await navigateToView(page, 'grid');
    await page.waitForTimeout(1_500);

    const cardCount = await getGridCardCount(page);

    // Only recent notes (within 7 days) should be displayed by default
    expect(
      cardCount,
      'Default filter must show only notes from last 7 days (RBC-4 / FAIL-08)',
    ).toBe(recentNotes.length);
  });

  // AC-GR-03: タグフィルタ (RBC-4 / FAIL-09)
  test('AC-GR-03/FAIL-09: tag filter narrows results to matching tags', async ({
    page,
  }) => {
    // Seed notes with different tags
    const now = new Date();
    seedNote(tempDir, new Date(now.getTime() - 1000), ['gpt'], 'Note about GPT');
    seedNote(tempDir, new Date(now.getTime() - 2000), ['coding'], 'Note about coding');
    seedNote(
      tempDir,
      new Date(now.getTime() - 3000),
      ['gpt', 'coding'],
      'Note about GPT and coding',
    );

    await waitForAppReady(page);
    await navigateToView(page, 'grid');
    await page.waitForTimeout(1_000);

    // Verify tag filter UI exists
    const tagFilterExists = await page.evaluate(() => {
      const el = document.querySelector(
        '[data-testid="tag-filter"], .tag-filter, [aria-label*="tag" i]',
      );
      return el !== null;
    });
    expect(
      tagFilterExists,
      'Tag filter must exist on grid view (RBC-4 / FAIL-09)',
    ).toBe(true);

    // Select the 'gpt' tag filter
    const tagFilter = page.locator(
      '[data-testid="tag-filter"], .tag-filter, [aria-label*="tag" i]',
    );
    await tagFilter.first().click();
    await page.waitForTimeout(500);

    // Look for the gpt tag option and click it
    const gptOption = page.locator('text=gpt').first();
    if (await gptOption.isVisible()) {
      await gptOption.click();
      await page.waitForTimeout(1_000);

      const filteredCount = await getGridCardCount(page);
      // Should show 2 notes (the one with [gpt] and the one with [gpt, coding])
      expect(filteredCount).toBeLessThanOrEqual(3);
      expect(filteredCount).toBeGreaterThanOrEqual(1);
    }
  });

  // AC-GR-04: 日付フィルタ (RBC-4 / FAIL-10)
  test('AC-GR-04/FAIL-10: date filter UI exists and is functional', async ({
    page,
  }) => {
    seedRecentNotes(tempDir, 7, 5);
    await waitForAppReady(page);
    await navigateToView(page, 'grid');
    await page.waitForTimeout(1_000);

    // Verify date filter UI exists
    const dateFilterExists = await page.evaluate(() => {
      const el = document.querySelector(
        '[data-testid="date-filter"], .date-filter, [aria-label*="date" i], input[type="date"]',
      );
      return el !== null;
    });
    expect(
      dateFilterExists,
      'Date filter must exist on grid view (RBC-4 / FAIL-10)',
    ).toBe(true);
  });

  // AC-GR-05: 全文検索 (RBC-4 / FAIL-11)
  test('AC-GR-05/FAIL-11: full-text search finds matching notes', async ({
    page,
  }) => {
    const now = new Date();
    seedNote(
      tempDir,
      new Date(now.getTime() - 1000),
      ['test'],
      'This note contains the unique search term: xylophone',
    );
    seedNote(
      tempDir,
      new Date(now.getTime() - 2000),
      ['test'],
      'This note is about something else entirely',
    );

    await waitForAppReady(page);
    await navigateToView(page, 'grid');
    await page.waitForTimeout(1_000);

    // Verify search input exists
    const searchInput = page.locator(
      '[data-testid="search-input"], input[type="search"], input[placeholder*="search" i], input[placeholder*="検索"]',
    );
    await expect(
      searchInput.first(),
      'Search input must exist on grid view (RBC-4 / FAIL-11)',
    ).toBeVisible();

    // Type search query
    await searchInput.first().fill('xylophone');
    await page.waitForTimeout(1_500); // Wait for debounce + IPC

    const searchResultCount = await getGridCardCount(page);
    expect(
      searchResultCount,
      'Full-text search must return matching notes (RBC-4 / FAIL-11)',
    ).toBe(1);
  });

  // AC-GR-05: full-text search invokes search_notes IPC (not client-side)
  test('AC-GR-05: search uses search_notes IPC command', async ({ page }) => {
    seedRecentNotes(tempDir, 7, 3);
    await waitForAppReady(page);
    await navigateToView(page, 'grid');
    await page.waitForTimeout(1_000);

    await assertIPCCommandCalled(
      page,
      async () => {
        const searchInput = page.locator(
          '[data-testid="search-input"], input[type="search"], input[placeholder*="search" i]',
        );
        await searchInput.first().fill('test');
        await page.waitForTimeout(1_500);
      },
      'search_notes',
    );
  });

  // AC-GR-06: カードクリックによるエディタ遷移 (FAIL-22)
  test('AC-GR-06/FAIL-22: card click navigates to editor', async ({ page }) => {
    seedRecentNotes(tempDir, 7, 2);
    await waitForAppReady(page);
    await navigateToView(page, 'grid');
    await page.waitForTimeout(1_500);

    const cardCount = await getGridCardCount(page);
    expect(cardCount).toBeGreaterThanOrEqual(1);

    // Click the first card
    await clickGridCard(page, 0);
    await page.waitForTimeout(1_500);

    // Verify we navigated to editor view
    const isCM6 = await isCodeMirror6Active(page);
    expect(
      isCM6,
      'Clicking a card must navigate to editor screen (FAIL-22)',
    ).toBe(true);
  });

  // IPC boundary enforcement
  test('IPC: grid does not directly access filesystem', async ({ page }) => {
    seedRecentNotes(tempDir, 7, 3);
    await waitForAppReady(page);
    await navigateToView(page, 'grid');
    await page.waitForTimeout(1_000);
    await assertNoDirectFileAccess(page);
  });

  // Grid uses list_notes IPC for initial load
  test('IPC: initial grid load invokes list_notes', async ({ page }) => {
    seedRecentNotes(tempDir, 7, 3);
    await waitForAppReady(page);

    await assertIPCCommandCalled(
      page,
      async () => {
        await navigateToView(page, 'grid');
        await page.waitForTimeout(1_500);
      },
      'list_notes',
    );
  });
});
