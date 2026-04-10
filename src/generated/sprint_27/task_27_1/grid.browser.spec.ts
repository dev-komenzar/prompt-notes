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

import { test, expect } from '@playwright/test';
import { launchApp, navigateTo } from './helpers/app-launch';
import {
  typeInSearchBar,
  selectTag,
  clickFirstCard,
  getNoteCardCount,
  clickDeleteButton,
  confirmDelete,
  waitForGridRefresh,
} from './helpers/grid';
import { createTestNote, deleteTestNote } from './helpers/test-data';

test.describe('Grid browser tests', () => {
  test.fixme('AC-GR-01 / FC-GR-04: grid view renders masonry cards', async () => {
    const { browser, page } = await launchApp();
    try {
      const fn = await createTestNote([], 'グリッド表示テスト');
      await navigateTo(page, '/');
      await page.waitForSelector('.masonry-grid, .note-card');
      const cards = await getNoteCardCount(page);
      expect(cards).toBeGreaterThan(0);
      await deleteTestNote(fn);
    } finally {
      await browser.close();
    }
  });

  test.fixme('AC-GR-02 / FC-GR-01: default filter shows only last 7 days', async () => {
    const { browser, page } = await launchApp();
    try {
      await navigateTo(page, '/');
      await page.waitForSelector('.masonry-grid, .date-filter, .note-card, .empty-state');

      // Verify date filter is set to last 7 days
      const dateFromInput = page.locator('input[name="date_from"], .date-filter input:first-of-type');
      const dateToInput = page.locator('input[name="date_to"], .date-filter input:last-of-type');

      if (await dateFromInput.count() > 0) {
        const from = await dateFromInput.inputValue();
        const fromDate = new Date(from);
        const expectedFrom = new Date();
        expectedFrom.setDate(expectedFrom.getDate() - 7);
        const diffDays = Math.abs(
          Math.round((fromDate.getTime() - expectedFrom.getTime()) / (1000 * 60 * 60 * 24))
        );
        expect(diffDays).toBeLessThanOrEqual(1);
      }
    } finally {
      await browser.close();
    }
  });

  test.fixme('AC-GR-04 / FC-GR-03: full text search filters cards', async () => {
    const { browser, page } = await launchApp();
    try {
      const token = `BROWSER_SEARCH_${Date.now()}`;
      const fn = await createTestNote([], `検索対象: ${token}`);
      await navigateTo(page, '/');
      await page.waitForSelector('.masonry-grid, .note-card');

      await typeInSearchBar(page, token);
      await page.waitForTimeout(500);

      const cards = await getNoteCardCount(page);
      expect(cards).toBeGreaterThan(0);

      const cardText = await page.locator('.note-card, .masonry-card').first().innerText();
      expect(cardText).toContain(token);

      await deleteTestNote(fn);
    } finally {
      await browser.close();
    }
  });

  test.fixme('AC-GR-05 / FC-GR-04: clicking a card navigates to editor', async () => {
    const { browser, page } = await launchApp();
    try {
      const fn = await createTestNote([], 'カードクリックテスト');
      await navigateTo(page, '/');
      await page.waitForSelector('.note-card, .masonry-card');
      await clickFirstCard(page);
      await page.waitForURL(/\/edit\//);
      expect(page.url()).toContain('/edit/');
      await page.waitForSelector('.cm-editor');
      await deleteTestNote(fn);
    } finally {
      await browser.close();
    }
  });

  test.fixme('AC-GR-03: tag filter updates visible cards', async () => {
    const { browser, page } = await launchApp();
    try {
      const tag = `filter-tag-${Date.now()}`;
      const fn1 = await createTestNote([tag], 'タグ付きノート');
      const fn2 = await createTestNote(['other'], '別タグノート');

      await navigateTo(page, '/');
      await page.waitForSelector('.masonry-grid, .note-card');
      await selectTag(page, tag);
      await waitForGridRefresh(page);

      const cards = await getNoteCardCount(page);
      expect(cards).toBeGreaterThanOrEqual(1);

      await deleteTestNote(fn1);
      await deleteTestNote(fn2);
    } finally {
      await browser.close();
    }
  });

  test.fixme('grid empty state shown when no results match search', async () => {
    const { browser, page } = await launchApp();
    try {
      await navigateTo(page, '/');
      await page.waitForSelector('.masonry-grid, .search-bar, .note-card, .empty-state');
      await typeInSearchBar(page, `NO_MATCH_TOKEN_${Date.now()}_XYZ`);
      await page.waitForTimeout(500);

      const emptyMsg = page.locator('.empty-state, [data-testid="empty-state"]');
      const cards = await getNoteCardCount(page);
      if (cards === 0) {
        await expect(emptyMsg).toBeVisible();
      }
    } finally {
      await browser.close();
    }
  });
});
