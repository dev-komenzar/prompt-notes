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

import { Page } from '@playwright/test';

export const BASE_URL = 'http://localhost:1420';
const HEALTH_TIMEOUT_MS = 30_000;
const HEALTH_INTERVAL_MS = 500;

export async function waitForAppReady(): Promise<void> {
  const deadline = Date.now() + HEALTH_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(BASE_URL);
      if (res.status < 500) return;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, HEALTH_INTERVAL_MS));
  }
  throw new Error(`App at ${BASE_URL} did not become ready within ${HEALTH_TIMEOUT_MS}ms`);
}

export async function gotoGrid(page: Page): Promise<void> {
  await page.goto(BASE_URL + '/');
  await page.waitForLoadState('networkidle');
}

export async function gotoEditor(page: Page, filename: string): Promise<void> {
  await page.goto(`${BASE_URL}/edit/${encodeURIComponent(filename)}`);
  await page.waitForLoadState('networkidle');
}

export async function gotoSettings(page: Page): Promise<void> {
  await page.goto(BASE_URL + '/settings');
  await page.waitForLoadState('networkidle');
}

export async function gotoNew(page: Page): Promise<void> {
  await page.goto(BASE_URL + '/new');
  await page.waitForLoadState('networkidle');
}

/** Invoke a Tauri IPC command from within the page context. */
export async function tauriInvoke<T>(
  page: Page,
  command: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  return page.evaluate(
    ([cmd, a]) => {
      const tauri = (window as unknown as { __TAURI__: { core: { invoke: (c: string, a: unknown) => Promise<unknown> } } }).__TAURI__;
      return tauri.core.invoke(cmd, a);
    },
    [command, args] as [string, Record<string, unknown>],
  ) as Promise<T>;
}
