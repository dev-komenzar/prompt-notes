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
import { expect, type Page } from '@playwright/test';
import { APP_URL, isMac } from './app-launch';

export async function typeInEditor(page: Page, text: string): Promise<void> {
  const editor = page.locator('.cm-content');
  await editor.click();
  await editor.type(text);
}

export async function getEditorText(page: Page): Promise<string> {
  return page.evaluate(() => {
    const editor = document.querySelector('.cm-editor') as HTMLElement & { cmView?: unknown };
    // Try CodeMirror view state via DOM
    const lines = document.querySelectorAll('.cm-line');
    return Array.from(lines)
      .map((l) => l.textContent ?? '')
      .join('\n');
  });
}

export async function clickCopyButton(page: Page): Promise<void> {
  const copyBtn = page.locator('button[aria-label*="コピー"], button:has-text("コピー"), button:has-text("Copy")');
  await expect(copyBtn, 'Copy button must be visible').toBeVisible();
  await copyBtn.click();
}

export async function assertCopyButtonFeedback(page: Page): Promise<void> {
  const feedback = page.locator('button:has-text("✓"), button:has-text("コピー済み"), button:has-text("Copied")');
  await expect(feedback, 'Copy feedback must appear after click').toBeVisible({ timeout: 2000 });
}

export async function pressNewNote(page: Page): Promise<void> {
  if (isMac()) {
    await page.keyboard.press('Meta+n');
  } else {
    await page.keyboard.press('Control+n');
  }
}

export async function waitForEditorFocus(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const active = document.activeElement;
    if (!active) return false;
    return active.classList.contains('cm-content') || active.closest('.cm-editor') !== null;
  }, { timeout: 3000 });
}

export async function navigateToEditor(page: Page, filename: string): Promise<void> {
  await page.goto(`${APP_URL}/edit/${encodeURIComponent(filename)}`);
  await expect(page.locator('.cm-editor')).toBeVisible({ timeout: 5000 });
}

export async function waitForAutoSave(page: Page, debounceMs = 1500): Promise<void> {
  await page.waitForTimeout(debounceMs);
}

export async function getClipboardText(page: Page): Promise<string> {
  return page.evaluate(async () => navigator.clipboard.readText());
}
