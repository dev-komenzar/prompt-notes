// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 55-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/test/acceptance_criteria.md
// @generated-by: codd implement --sprint 55

import { chromium, Browser, Page } from '@playwright/test';

const WEBVIEW_URL = 'http://localhost:1420';
const LAUNCH_TIMEOUT_MS = 30_000;

export interface AppContext {
  browser: Browser;
  page: Page;
}

export async function launchApp(): Promise<AppContext> {
  const browser = await chromium.launch({ headless: process.env.CI === 'true' });
  const page = await browser.newPage();

  const deadline = Date.now() + LAUNCH_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      await page.goto(WEBVIEW_URL, { waitUntil: 'domcontentloaded', timeout: 3_000 });
      break;
    } catch {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return { browser, page };
}

export async function closeApp(ctx: AppContext): Promise<void> {
  await ctx.browser.close();
}

export async function invokeCommand<T>(page: Page, command: string, args?: Record<string, unknown>): Promise<T> {
  return page.evaluate(
    ([cmd, a]) =>
      (window as unknown as { __TAURI__: { core: { invoke: (c: string, a?: unknown) => Promise<unknown> } } })
        .__TAURI__.core.invoke(cmd, a),
    [command, args] as [string, Record<string, unknown> | undefined],
  ) as Promise<T>;
}

export async function mockDialogOpen(page: Page, returnPath: string): Promise<void> {
  await page.evaluate((p) => {
    const tauri = (window as unknown as Record<string, unknown>).__TAURI__;
    if (tauri && typeof tauri === 'object' && 'dialog' in tauri) {
      const dialog = tauri.dialog as Record<string, unknown>;
      dialog.open = async () => p;
    }
  }, returnPath);
}
