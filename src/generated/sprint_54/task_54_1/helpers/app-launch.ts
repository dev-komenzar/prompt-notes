// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 54-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/design/test/acceptance_criteria.md
// @generated-by: codd propagate

import { type Page, type BrowserContext } from '@playwright/test';

/** Tauri dev server default port */
const TAURI_DEV_URL = process.env.TAURI_DEV_URL ?? 'http://localhost:1420';

export async function navigateToGrid(page: Page): Promise<void> {
  await page.goto(`${TAURI_DEV_URL}/#/grid`);
  await page.waitForLoadState('networkidle');
}

export async function navigateToEditor(page: Page, noteId?: string): Promise<void> {
  const url = noteId
    ? `${TAURI_DEV_URL}/#/?note=${noteId}`
    : `${TAURI_DEV_URL}/`;
  await page.goto(url);
  await page.waitForLoadState('networkidle');
}

export async function navigateToSettings(page: Page): Promise<void> {
  await page.goto(`${TAURI_DEV_URL}/#/settings`);
  await page.waitForLoadState('networkidle');
}

export async function waitForGridCards(page: Page, minCount = 1): Promise<void> {
  await page.waitForSelector('[data-testid="note-card"], .note-card', {
    state: 'visible',
    timeout: 5000,
  }).catch(() => {
    // May be no cards if filtered — caller decides
  });
}

export async function waitForEditorReady(page: Page): Promise<void> {
  await page.waitForSelector('.cm-editor', { state: 'visible', timeout: 5000 });
}

/** Invoke a Tauri command via page.evaluate using the injected __TAURI__ API */
export async function tauriInvoke<T>(page: Page, cmd: string, args?: Record<string, unknown>): Promise<T> {
  return page.evaluate(
    ([command, payload]) =>
      (window as unknown as { __TAURI__: { core: { invoke: <R>(cmd: string, args?: unknown) => Promise<R> } } })
        .__TAURI__.core.invoke<typeof payload extends undefined ? never : unknown>(command as string, payload),
    [cmd, args] as [string, Record<string, unknown> | undefined]
  ) as Promise<T>;
}
