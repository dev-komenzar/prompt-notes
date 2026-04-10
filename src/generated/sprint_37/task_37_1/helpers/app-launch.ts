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
import { chromium, type Browser, type Page } from '@playwright/test';

const APP_URL = 'http://localhost:1420';
const HEALTH_CHECK_TIMEOUT = 30_000;
const HEALTH_CHECK_INTERVAL = 500;

export async function waitForApp(): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < HEALTH_CHECK_TIMEOUT) {
    try {
      const res = await fetch(APP_URL);
      if (res.status < 500) return;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, HEALTH_CHECK_INTERVAL));
  }
  throw new Error(`App did not start within ${HEALTH_CHECK_TIMEOUT}ms`);
}

export function getAppUrl(path = ''): string {
  return `${APP_URL}${path}`;
}

export async function navigateTo(page: Page, path: string): Promise<void> {
  await page.goto(getAppUrl(path));
  await page.waitForLoadState('networkidle');
}
