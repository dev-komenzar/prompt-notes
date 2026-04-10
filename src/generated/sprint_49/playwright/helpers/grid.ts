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

import { Page, expect } from '@playwright/test';

/** Count visible note cards in the grid. */
export async function countCards(page: Page): Promise<number> {
  return page.locator('[data-testid="note-card"], .note-card').count();
}

/** Enter a search query in the SearchBar and wait for debounce (≥300ms). */
export async function enterSearchQuery(page: Page, query: string): Promise<void> {
  const input = page
    .locator('input[type="search"], input[placeholder*="検索" i], input[aria-label*="search" i]')
    .first();
  await input.fill(query);
  await page.waitForTimeout(400); // debounce is 300ms
}

/** Set tag filter by clicking a tag chip/checkbox. */
export async function selectTagFilter(page: Page, tag: string): Promise<void> {
  const tagEl = page
    .locator(`[data-testid="tag-filter"] >> text="${tag}", .tag-filter >> text="${tag}"`)
    .first();
  await tagEl.click();
  await page.waitForTimeout(200);
}

/** Set the date-from filter (YYYY-MM-DD). */
export async function setDateFrom(page: Page, dateFrom: string): Promise<void> {
  const input = page
    .locator('input[name="date_from"], input[data-testid="date-from"], input[aria-label*="from" i]')
    .first();
  await input.fill(dateFrom);
  await input.dispatchEvent('change');
  await page.waitForTimeout(200);
}

/** Set the date-to filter (YYYY-MM-DD). */
export async function setDateTo(page: Page, dateTo: string): Promise<void> {
  const input = page
    .locator('input[name="date_to"], input[data-testid="date-to"], input[aria-label*="to" i]')
    .first();
  await input.fill(dateTo);
  await input.dispatchEvent('change');
  await page.waitForTimeout(200);
}

/** Click the first card and return the filename from the URL. */
export async function clickFirstCard(page: Page): Promise<string> {
  const card = page.locator('[data-testid="note-card"], .note-card').first();
  await card.click();
  await page.waitForURL(/\/edit\/.+/, { timeout: 5000 });
  const url = page.url();
  const m = url.match(/\/edit\/(.+)$/);
  return m ? decodeURIComponent(m[1]) : '';
}

/** Assert that the masonry grid container is visible. */
export async function assertMasonryGridVisible(page: Page): Promise<void> {
  const grid = page.locator('.masonry-grid, [data-testid="masonry-grid"]');
  await expect(grid).toBeVisible();
}

/** Assert that a card with the given body preview text is visible. */
export async function assertCardVisible(page: Page, previewText: string): Promise<void> {
  const card = page
    .locator('[data-testid="note-card"], .note-card')
    .filter({ hasText: previewText })
    .first();
  await expect(card).toBeVisible();
}

/** Assert that NO card with the given body preview text is visible. */
export async function assertCardNotVisible(page: Page, previewText: string): Promise<void> {
  const card = page
    .locator('[data-testid="note-card"], .note-card')
    .filter({ hasText: previewText });
  await expect(card).toHaveCount(0);
}
