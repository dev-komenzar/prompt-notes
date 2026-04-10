// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 48-1
// @task-title: グリッドビュー → エディタ → 自動保存 → グリッドビューに戻り変更が反映されるエンドツーエンドのワークフロー確認
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

import { type Page, expect } from '@playwright/test';

export async function openGridView(page: Page, baseUrl = 'http://localhost:1420'): Promise<void> {
  await page.goto(baseUrl);
  await page.waitForSelector('.masonry-grid, [data-testid="grid-view"]', {
    timeout: 10_000,
    state: 'attached',
  });
}

export async function clickNoteCard(page: Page, filename: string): Promise<void> {
  // filenameに対応するカードを探してクリック
  const card = page
    .locator(`[data-testid="note-card"][data-filename="${filename}"], [data-filename="${filename}"]`)
    .first();

  if (await card.isVisible()) {
    await card.click();
    return;
  }

  // data-filenameが見つからない場合は本文プレビューから特定を試みる
  const allCards = page.locator('[data-testid="note-card"]');
  const count = await allCards.count();
  for (let i = 0; i < count; i++) {
    const href = await allCards.nth(i).getAttribute('href') ?? '';
    const onclick = await allCards.nth(i).getAttribute('data-filename') ?? '';
    if (href.includes(encodeURIComponent(filename)) || onclick.includes(filename)) {
      await allCards.nth(i).click();
      return;
    }
  }

  throw new Error(`ノートカードが見つかりませんでした: ${filename}`);
}

export async function searchNotes(page: Page, query: string): Promise<void> {
  const searchInput = page.locator(
    '[data-testid="search-input"], input[placeholder*="検索"], input[type="search"]'
  ).first();
  await searchInput.fill(query);
  // 検索デバウンス(300ms)を待つ
  await page.waitForTimeout(400);
}

export async function waitForGridReload(page: Page): Promise<void> {
  // グリッドビューのローディング完了を待機
  await page.waitForSelector('.masonry-grid, [data-testid="grid-view"]', {
    timeout: 5_000,
    state: 'visible',
  });
  await page.waitForTimeout(300);
}

export async function setDateFilter(
  page: Page,
  options: { from?: string; to?: string }
): Promise<void> {
  if (options.from) {
    const fromInput = page.locator('[data-testid="date-from"], input[name="date_from"]').first();
    await fromInput.fill(options.from);
  }
  if (options.to) {
    const toInput = page.locator('[data-testid="date-to"], input[name="date_to"]').first();
    await toInput.fill(options.to);
  }
  await page.waitForTimeout(300);
}

export async function selectTagFilter(page: Page, tag: string): Promise<void> {
  const tagChip = page
    .locator(`[data-testid="tag-filter-option"]:has-text("${tag}"), label:has-text("${tag}")`)
    .first();
  await tagChip.click();
  await page.waitForTimeout(300);
}

export async function getVisibleNoteFilenames(page: Page): Promise<string[]> {
  const cards = page.locator('[data-testid="note-card"][data-filename]');
  const count = await cards.count();
  const filenames: string[] = [];
  for (let i = 0; i < count; i++) {
    const fn = await cards.nth(i).getAttribute('data-filename');
    if (fn) filenames.push(fn);
  }
  return filenames;
}
