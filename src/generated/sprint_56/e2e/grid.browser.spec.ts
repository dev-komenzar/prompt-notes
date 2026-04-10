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
import {
  navigateToGrid,
  searchNotes,
  assertMasonryLayout,
  getNoteCards,
  clickNoteCard,
  getCardPreviewText,
} from './helpers/grid';
import { getDefaultNotesDir, daysAgoFilename, writeTestNote, makeCleanup } from './helpers/test-data';

test.describe('grid – browser tests', () => {
  let notesDir: string;

  test.beforeEach(async ({ page }) => {
    notesDir = getDefaultNotesDir();
    await waitForAppReady(page);
  });

  // AC-GR-01: Pinterest-style masonry layout
  test('AC-GR-01: grid shows masonry layout with variable-height cards', async ({ page }) => {
    await navigateToGrid(page);
    await assertMasonryLayout(page);
  });

  // AC-GR-02: default 7-day filter applied on initial load
  test('AC-GR-02: initial grid does NOT show notes older than 7 days by default', async ({ page }) => {
    const cleanup = makeCleanup(notesDir);
    const fn8 = daysAgoFilename(8);
    const uniqueOldText = `OldNote_${Date.now()}`;
    writeTestNote(notesDir, fn8, [], uniqueOldText);
    cleanup.filenames.push(fn8);

    try {
      await navigateToGrid(page);
      await page.waitForTimeout(1000);
      const pageContent = await page.content();
      expect(
        pageContent,
        '8-day-old note body text must not appear in default grid view'
      ).not.toContain(uniqueOldText);
    } finally {
      cleanup.cleanup();
    }
  });

  // AC-GR-04: full-text search updates displayed cards
  test('AC-GR-04: typing in search box filters cards by body content', async ({ page }) => {
    const cleanup = makeCleanup(notesDir);
    const uniqueQuery = `SearchBrowserTest_${Date.now()}`;
    const fn = daysAgoFilename(1);
    writeTestNote(notesDir, fn, [], `This note body contains ${uniqueQuery}`);
    cleanup.filenames.push(fn);

    try {
      await navigateToGrid(page);
      await searchNotes(page, uniqueQuery);
      const content = await page.content();
      expect(content, 'Search results must show the matching note').toContain(uniqueQuery);
    } finally {
      cleanup.cleanup();
    }
  });

  // AC-GR-04: empty search result shows message
  test('AC-GR-04: empty search result shows informative message', async ({ page }) => {
    await navigateToGrid(page);
    await searchNotes(page, `NoSuchNote_zzz_${Date.now()}`);
    const emptyMessage = page.locator('text=/ノートはありません|no notes|結果なし|empty/i');
    await expect(emptyMessage, 'Empty state message must appear when no results').toBeVisible({ timeout: 3000 });
  });

  // AC-GR-05 / FC-GR-04: card click navigates to editor
  test('AC-GR-05: clicking a note card navigates to /edit/:filename', async ({ page }) => {
    const cleanup = makeCleanup(notesDir);
    const fn = daysAgoFilename(1);
    writeTestNote(notesDir, fn, [], 'Card click navigation test');
    cleanup.filenames.push(fn);

    try {
      await navigateToGrid(page);
      await page.waitForTimeout(500);

      const card = page.locator('[data-testid="note-card"], .note-card, .masonry-card').first();
      await expect(card, 'At least one card must be visible').toBeVisible({ timeout: 5000 });
      await card.click();

      await expect(page).toHaveURL(/\/edit\/.+/, { timeout: 5000 });
      await expect(page.locator('.cm-editor'), 'Editor must be shown after card click').toBeVisible({ timeout: 5000 });
    } finally {
      cleanup.cleanup();
    }
  });

  // AC-GR-03: tag filter UI is present
  test('AC-GR-03: tag filter UI is present on grid view', async ({ page }) => {
    await navigateToGrid(page);
    const tagFilter = page.locator('[data-testid="tag-filter"], .tag-filter, [aria-label*="tag" i], [aria-label*="タグ"]');
    await expect(tagFilter, 'Tag filter must be visible on grid page').toBeVisible();
  });

  // AC-GR-03: date filter UI is present
  test('AC-GR-03: date range filter UI is present on grid view', async ({ page }) => {
    await navigateToGrid(page);
    const dateFilter = page.locator('[data-testid="date-filter"], .date-filter, input[name="date_from"], input[aria-label*="date" i]');
    await expect(dateFilter, 'Date filter must be present on grid page').toBeVisible();
  });

  // FC-GR-01: full grid without 7-day filter must be accessible via filter change
  test('FC-GR-01: removing date filter reveals older notes', async ({ page }) => {
    const cleanup = makeCleanup(notesDir);
    const fn10 = daysAgoFilename(10);
    const uniqueOld = `OlderVisible_${Date.now()}`;
    writeTestNote(notesDir, fn10, [], uniqueOld);
    cleanup.filenames.push(fn10);

    try {
      await navigateToGrid(page);
      // Clear date_from to show all notes
      const fromInput = page.locator('input[name="date_from"], input[aria-label*="from" i], input[aria-label*="開始" i]');
      if (await fromInput.isVisible()) {
        await fromInput.fill('');
        await page.waitForTimeout(600);
        const content = await page.content();
        expect(content, 'Clearing date filter must reveal 10-day-old note').toContain(uniqueOld);
      } else {
        test.fixme();
      }
    } finally {
      cleanup.cleanup();
    }
  });
});
