// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 53-1
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
// @generated-by: codd implement --sprint 53
import { chromium, Browser, BrowserContext, Page } from '@playwright/test';
import { APP_BASE_URL } from './test-data';

export interface AppHandle {
  browser: Browser;
  context: BrowserContext;
  page: Page;
}

/**
 * Tauri WebView に Playwright を接続する。
 * Tauri dev server が localhost:1420 で稼働している前提 (CI: xvfb-run + tauri dev)。
 */
export async function launchApp(): Promise<AppHandle> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(APP_BASE_URL, { waitUntil: 'networkidle' });
  return { browser, context, page };
}

export async function closeApp(handle: AppHandle): Promise<void> {
  await handle.context.close();
  await handle.browser.close();
}

/**
 * page.evaluate 経由で Tauri v2 IPC invoke を呼び出す。
 * window.__TAURI__.core.invoke は @tauri-apps/api/core が WebView に注入するグローバル。
 */
export async function invoke<T>(page: Page, command: string, args?: Record<string, unknown>): Promise<T> {
  return page.evaluate(
    async ({ cmd, cmdArgs }) => {
      const fn = (window as unknown as { __TAURI__: { core: { invoke: <R>(c: string, a?: unknown) => Promise<R> } } }).__TAURI__.core.invoke;
      return fn<T>(cmd, cmdArgs);
    },
    { cmd: command, cmdArgs: args }
  );
}

/** WebView が完全に初期化され Tauri IPC が利用可能になるまで待機する */
export async function waitForTauriReady(page: Page, timeoutMs = 5000): Promise<void> {
  await page.waitForFunction(
    () => typeof (window as unknown as Record<string, unknown>).__TAURI__ !== 'undefined',
    undefined,
    { timeout: timeoutMs }
  );
}
