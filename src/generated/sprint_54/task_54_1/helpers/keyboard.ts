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

import { type Page } from '@playwright/test';

export function isMac(): boolean {
  return process.platform === 'darwin';
}

/** Cmd+N (macOS) / Ctrl+N (Linux) — AC-EDIT-03 */
export async function pressNewNote(page: Page): Promise<void> {
  if (isMac()) {
    await page.keyboard.press('Meta+n');
  } else {
    await page.keyboard.press('Control+n');
  }
}

/** Cmd+Z (macOS) / Ctrl+Z (Linux) — Undo */
export async function pressUndo(page: Page): Promise<void> {
  if (isMac()) {
    await page.keyboard.press('Meta+z');
  } else {
    await page.keyboard.press('Control+z');
  }
}

/** Enter key for card activation (keyboard accessibility) */
export async function pressEnterOnCard(page: Page, cardLocator: ReturnType<Page['locator']>): Promise<void> {
  await cardLocator.focus();
  await page.keyboard.press('Enter');
}
