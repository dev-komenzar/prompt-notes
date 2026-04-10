// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 21-1
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

export async function typeInSearchBar(page: Page, query: string): Promise<void> {
  const searchInput = page.locator('input[type="search"], input[placeholder*="検索" i], [data-testid="search-bar"] input').first();
  await searchInput.fill(query);
  // wait for debounce
  await page.waitForTimeout(400);
}

export async function selectTagFilter(page: Page, tag: string): Promise<void> {
  const tagOption = page.locator(`[data-testid="tag-filter"] label:has-text("${tag}"), [data-testid="tag-filter"] button:has-text("${tag}")`).first();
  await tagOption.click();
  await page.waitForTimeout(300);
}

export async function setDateFilter(page: Page, from: string, to: string): Promise<void> {
  const fromInput = page.locator('input[name="date_from"], [data-testid="date-from"]').first();
  const toInput = page.locator('input[name="date_to"], [data-testid="date-to"]').first();
  await fromInput.fill(from);
  await toInput.fill(to);
  await page.waitForTimeout(300);
}

export async function getNoteCardCount(page: Page): Promise<number> {
  await page.waitForSelector('[data-testid="note-card"], .note-card', { timeout: 5000 }).catch(() => {});
  return page.locator('[data-testid="note-card"], .note-card').count();
}

export async function clickNoteCard(page: Page, index = 0): Promise<void> {
  const cards = page.locator('[data-testid="note-card"], .note-card');
  await cards.nth(index).click();
}

export async function clickDeleteOnCard(page: Page, index = 0): Promise<void> {
  const cards = page.locator('[data-testid="note-card"], .note-card');
  const deleteBtn = cards.nth(index).locator('button[aria-label*="削除" i], button[aria-label*="delete" i], [data-testid="delete-btn"]');
  await deleteBtn.click();
}

export async function confirmDelete(page: Page): Promise<void> {
  const confirmBtn = page.getByRole('button', { name: /削除|delete|confirm/i }).last();
  await confirmBtn.click();
}

export async function assertMasonryLayout(page: Page): Promise<void> {
  const grid = page.locator('[data-testid="masonry-grid"], .masonry-grid').first();
  await expect(grid).toBeVisible();
  const style = await grid.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { columns: cs.columns, columnCount: cs.columnCount };
  });
  // columns > 1 or uses CSS columns
  const hasMultipleColumns = style.columnCount !== '1' && style.columnCount !== 'auto';
  const hasColumnsShorthand = style.columns !== 'auto';
  expect(hasMultipleColumns || hasColumnsShorthand).toBe(true);
}

export async function assertEmptyState(page: Page): Promise<void> {
  const empty = page.locator('[data-testid="empty-state"], .empty-state');
  await expect(empty).toBeVisible();
}

export function dateString(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}
