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
import { expect, type Page } from '@playwright/test';
import { APP_URL } from './app-launch';

export async function navigateToGrid(page: Page): Promise<void> {
  await page.goto(APP_URL);
  await page.waitForLoadState('networkidle');
}

export async function searchNotes(page: Page, query: string): Promise<void> {
  const searchInput = page.locator('input[type="search"], input[placeholder*="検索"], input[placeholder*="search" i]');
  await expect(searchInput, 'Search bar must be visible').toBeVisible();
  await searchInput.fill(query);
  await page.waitForTimeout(400); // debounce
}

export async function selectTagFilter(page: Page, tag: string): Promise<void> {
  const tagCheckbox = page.locator(`input[type="checkbox"][value="${tag}"], label:has-text("${tag}")`).first();
  await expect(tagCheckbox).toBeVisible();
  await tagCheckbox.click();
  await page.waitForTimeout(300);
}

export async function setDateFilter(page: Page, from: string, to: string): Promise<void> {
  const fromInput = page.locator('input[name="date_from"], input[aria-label*="from" i], input[aria-label*="開始" i]');
  const toInput = page.locator('input[name="date_to"], input[aria-label*="to" i], input[aria-label*="終了" i]');
  await fromInput.fill(from);
  await toInput.fill(to);
  await page.waitForTimeout(300);
}

export async function getNoteCards(page: Page): Promise<string[]> {
  await page.waitForTimeout(500);
  const cards = page.locator('[data-testid="note-card"], .note-card, .masonry-card');
  const count = await cards.count();
  const filenames: string[] = [];
  for (let i = 0; i < count; i++) {
    const card = cards.nth(i);
    const fn = await card.getAttribute('data-filename');
    if (fn) filenames.push(fn);
  }
  return filenames;
}

export async function clickNoteCard(page: Page, index = 0): Promise<void> {
  const cards = page.locator('[data-testid="note-card"], .note-card, .masonry-card');
  await expect(cards.nth(index), `Card at index ${index} must be visible`).toBeVisible();
  await cards.nth(index).click();
}

export async function assertMasonryLayout(page: Page): Promise<void> {
  const grid = page.locator('.masonry-grid, [class*="masonry"]');
  await expect(grid, 'Masonry grid container must be present').toBeVisible();
}

export async function assertCardCount(page: Page, expected: number): Promise<void> {
  const cards = page.locator('[data-testid="note-card"], .note-card, .masonry-card');
  await expect(cards).toHaveCount(expected, { timeout: 5000 });
}

export async function getCardPreviewText(page: Page, index = 0): Promise<string> {
  const card = page.locator('[data-testid="note-card"], .note-card, .masonry-card').nth(index);
  return (await card.textContent()) ?? '';
}
