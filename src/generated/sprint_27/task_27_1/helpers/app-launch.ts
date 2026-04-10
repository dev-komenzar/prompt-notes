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

import { chromium, type Browser, type Page } from '@playwright/test';

const DEV_SERVER_URL = 'http://localhost:1420';
const HEALTH_CHECK_TIMEOUT_MS = 30_000;
const HEALTH_CHECK_INTERVAL_MS = 500;

async function waitForDevServer(url: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, HEALTH_CHECK_INTERVAL_MS));
  }
  throw new Error(`Dev server did not become available within ${timeoutMs}ms`);
}

export async function launchApp(): Promise<{ browser: Browser; page: Page }> {
  await waitForDevServer(DEV_SERVER_URL, HEALTH_CHECK_TIMEOUT_MS);
  const browser = await chromium.launch({ headless: process.env.CI === 'true' });
  const page = await browser.newPage();
  await page.goto(DEV_SERVER_URL);
  return { browser, page };
}

export async function navigateTo(page: Page, path: string): Promise<void> {
  await page.goto(`${DEV_SERVER_URL}${path}`);
}

export { DEV_SERVER_URL };
