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

import { type Page } from '@playwright/test';

const DEFAULT_URL = 'http://localhost:1420';
const HEALTH_CHECK_TIMEOUT = 30_000;
const HEALTH_CHECK_INTERVAL = 500;

export async function waitForAppReady(page: Page, baseUrl = DEFAULT_URL): Promise<void> {
  const deadline = Date.now() + HEALTH_CHECK_TIMEOUT;
  while (Date.now() < deadline) {
    try {
      const response = await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 5000 });
      if (response && response.status() < 500) {
        return;
      }
    } catch {
      // 接続待機中
    }
    await page.waitForTimeout(HEALTH_CHECK_INTERVAL);
  }
  throw new Error(`App did not become ready at ${baseUrl} within ${HEALTH_CHECK_TIMEOUT}ms`);
}

export async function navigateToGrid(page: Page, baseUrl = DEFAULT_URL): Promise<void> {
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="grid-view"], .masonry-grid, [data-testid="note-card"]', {
    timeout: 10_000,
    state: 'attached',
  });
}

export async function navigateToEditor(page: Page, filename: string, baseUrl = DEFAULT_URL): Promise<void> {
  await page.goto(`${baseUrl}/edit/${encodeURIComponent(filename)}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.cm-editor', { timeout: 10_000 });
}
