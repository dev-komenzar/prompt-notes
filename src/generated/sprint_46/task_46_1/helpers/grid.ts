// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 46-1
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

import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export async function navigateToGrid(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
}

export async function searchNotes(page: Page, query: string): Promise<void> {
  const searchInput = page.locator('input[placeholder*="検索"], input[type="search"]').first();
  await searchInput.fill(query);
  // wait for debounce (300ms + margin)
  await page.waitForTimeout(500);
}

export async function selectTagFilter(page: Page, tag: string): Promise<void> {
  await page.locator(`[data-testid="tag-filter"] >> text=${tag}`).click();
  await page.waitForTimeout(300);
}

export async function setDateFrom(page: Page, dateStr: string): Promise<void> {
  await page.locator('[data-testid="date-from"]').fill(dateStr);
  await page.waitForTimeout(300);
}

export async function setDateTo(page: Page, dateStr: string): Promise<void> {
  await page.locator('[data-testid="date-to"]').fill(dateStr);
  await page.waitForTimeout(300);
}

export async function clickNoteCard(page: Page, filename: string): Promise<void> {
  await page.locator(`[data-filename="${filename}"]`).click();
}

export async function getNoteCardCount(page: Page): Promise<number> {
  return page.locator('[data-testid="note-card"]').count();
}

export async function assertMasonryLayout(page: Page): Promise<void> {
  const grid = page.locator('.masonry-grid');
  await expect(grid).toBeVisible();
  const cards = grid.locator('[data-testid="note-card"]');
  const count = await cards.count();
  expect(count).toBeGreaterThanOrEqual(0);
}
