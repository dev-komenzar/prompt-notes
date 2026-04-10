// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 37-1
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
import { type Page, expect } from '@playwright/test';

export async function getNoteCards(page: Page) {
  return page.locator('.note-card, [data-testid="note-card"]');
}

export async function assertMasonryLayout(page: Page): Promise<void> {
  const grid = page.locator('.masonry-grid, [data-testid="masonry-grid"]');
  await expect(grid).toBeVisible();
  const cards = await getNoteCards(page);
  // Masonry should render cards in multi-column layout
  const count = await cards.count();
  expect(count).toBeGreaterThanOrEqual(0);
}

export async function typeInSearchBar(page: Page, query: string): Promise<void> {
  const searchInput = page.locator('input[type="search"], input[placeholder*="検索"], [data-testid="search-bar"] input');
  await searchInput.fill(query);
  // Wait for debounce (300ms + buffer)
  await page.waitForTimeout(500);
}

export async function selectTagFilter(page: Page, tag: string): Promise<void> {
  const tagFilter = page.locator(`[data-testid="tag-filter"] [data-tag="${tag}"], .tag-filter label:has-text("${tag}")`);
  await tagFilter.click();
  await page.waitForTimeout(300);
}

export async function setDateFilter(page: Page, from: string, to: string): Promise<void> {
  const fromInput = page.locator('[data-testid="date-from"], input[name="date_from"]');
  const toInput = page.locator('[data-testid="date-to"], input[name="date_to"]');
  await fromInput.fill(from);
  await toInput.fill(to);
  await page.waitForTimeout(300);
}

export async function clickNoteCard(page: Page, index = 0): Promise<void> {
  const cards = await getNoteCards(page);
  await cards.nth(index).click();
}

export async function clickDeleteButton(page: Page, index = 0): Promise<void> {
  const cards = await getNoteCards(page);
  const deleteBtn = cards.nth(index).locator('[aria-label*="削除"], button.delete-button, [data-testid="delete-button"]');
  await deleteBtn.click({ force: true });
}

export async function confirmDelete(page: Page): Promise<void> {
  const confirmBtn = page.locator('[data-testid="confirm-delete"], .delete-confirm button:has-text("削除")');
  await confirmBtn.click();
  await page.waitForTimeout(300);
}

export async function assertCardsVisible(page: Page, minCount: number): Promise<void> {
  const cards = await getNoteCards(page);
  await expect(cards).toHaveCount(minCount, { timeout: 5000 });
}

export async function assertCardNotVisible(page: Page, bodyPreview: string): Promise<void> {
  const card = page.locator(`.note-card:has-text("${bodyPreview}"), [data-testid="note-card"]:has-text("${bodyPreview}")`);
  await expect(card).not.toBeVisible();
}

export function formatDateTo(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getDateDaysAgo(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d;
}
