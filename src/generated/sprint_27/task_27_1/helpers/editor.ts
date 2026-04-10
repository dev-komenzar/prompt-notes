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

import { type Page } from '@playwright/test';

export async function typeIntoEditor(page: Page, text: string): Promise<void> {
  const editor = page.locator('.cm-content');
  await editor.click();
  await editor.pressSequentially(text);
}

export async function clickCopyButton(page: Page): Promise<void> {
  await page.locator('button.copy-button, button[aria-label="本文をコピー"]').click();
}

export async function triggerNewNote(page: Page, isMac: boolean): Promise<void> {
  const modifier = isMac ? 'Meta' : 'Control';
  await page.keyboard.press(`${modifier}+n`);
}

export async function getEditorContent(page: Page): Promise<string> {
  return page.locator('.cm-content').innerText();
}

export async function waitForAutoSave(page: Page, debounceMs = 1500): Promise<void> {
  await page.waitForTimeout(debounceMs);
}

export async function getCopyButtonText(page: Page): Promise<string> {
  const btn = page.locator('button.copy-button, button[aria-label="本文をコピー"]');
  return btn.innerText();
}

export async function waitForCopyFeedback(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const btn = document.querySelector('button.copy-button, button[aria-label="本文をコピー"]');
    return btn?.textContent?.includes('✓') || btn?.textContent?.includes('コピー済み');
  }, { timeout: 3000 });
}
