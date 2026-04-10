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

import { type Page } from '@playwright/test';

export async function typeInSearchBar(page: Page, query: string): Promise<void> {
  const searchBar = page.locator('input[type="search"], input[placeholder*="検索"], .search-bar input');
  await searchBar.fill(query);
  // wait for debounce
  await page.waitForTimeout(400);
}

export async function selectTag(page: Page, tag: string): Promise<void> {
  await page.locator(`.tag-filter [data-tag="${tag}"], .tag-filter label:has-text("${tag}")`).click();
  await page.waitForTimeout(300);
}

export async function setDateFrom(page: Page, dateStr: string): Promise<void> {
  const input = page.locator('input[name="date_from"], .date-filter input[type="date"]:first-of-type');
  await input.fill(dateStr);
  await input.dispatchEvent('change');
}

export async function setDateTo(page: Page, dateStr: string): Promise<void> {
  const input = page.locator('input[name="date_to"], .date-filter input[type="date"]:last-of-type');
  await input.fill(dateStr);
  await input.dispatchEvent('change');
}

export async function clickNoteCard(page: Page, filename: string): Promise<void> {
  await page.locator(`.note-card[data-filename="${filename}"], [data-filename="${filename}"]`).click();
}

export async function clickFirstCard(page: Page): Promise<void> {
  await page.locator('.note-card, .masonry-card').first().click();
}

export async function getNoteCardCount(page: Page): Promise<number> {
  return page.locator('.note-card, .masonry-card').count();
}

export async function clickDeleteButton(page: Page, filename: string): Promise<void> {
  const card = page.locator(`.note-card[data-filename="${filename}"]`);
  await card.locator('button.delete-button, button[aria-label*="削除"]').click({ force: true });
}

export async function confirmDelete(page: Page): Promise<void> {
  await page.locator('button:has-text("削除"), button.confirm-delete').click();
}

export async function waitForGridRefresh(page: Page): Promise<void> {
  await page.waitForTimeout(500);
}
