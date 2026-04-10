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
import { type Page, type BrowserContext, chromium, type Browser } from '@playwright/test';

export const APP_URL = 'http://localhost:1420';
export const HEALTH_CHECK_TIMEOUT_MS = 30_000;
export const HEALTH_CHECK_INTERVAL_MS = 500;

export async function waitForAppReady(page: Page): Promise<void> {
  const deadline = Date.now() + HEALTH_CHECK_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const response = await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 5000 });
      if (response && response.status() < 500) {
        await page.waitForLoadState('networkidle', { timeout: 10_000 });
        return;
      }
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, HEALTH_CHECK_INTERVAL_MS));
  }
  throw new Error(`App at ${APP_URL} did not become ready within ${HEALTH_CHECK_TIMEOUT_MS}ms`);
}

export async function navigateTo(page: Page, path: string): Promise<void> {
  const url = `${APP_URL}${path}`;
  const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
  if (!response) throw new Error(`Navigation to ${url} returned no response`);
  if (response.status() >= 500) {
    throw new Error(`Server error ${response.status()} navigating to ${url}`);
  }
}

export async function invokeTauriCommand<T>(
  page: Page,
  command: string,
  args: Record<string, unknown> = {}
): Promise<T> {
  return page.evaluate(
    async ({ cmd, cmdArgs }: { cmd: string; cmdArgs: Record<string, unknown> }) => {
      // @ts-expect-error: Tauri globals
      const { invoke } = window.__TAURI__.core;
      return invoke(cmd, cmdArgs) as Promise<T>;
    },
    { cmd: command, cmdArgs: args }
  );
}

export function isMac(): boolean {
  return process.platform === 'darwin';
}
