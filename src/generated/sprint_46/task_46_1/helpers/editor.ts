// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 46-1
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

import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export async function typeIntoEditor(page: Page, text: string): Promise<void> {
  const editorEl = page.locator('.cm-editor .cm-content');
  await editorEl.click();
  await editorEl.type(text);
}

export async function getEditorText(page: Page): Promise<string> {
  return page.locator('.cm-editor .cm-content').innerText();
}

export async function clickCopyButton(page: Page): Promise<void> {
  await page.locator('[aria-label="本文をコピー"]').click();
}

export async function pressNewNote(page: Page): Promise<void> {
  const isMac = process.platform === 'darwin';
  if (isMac) {
    await page.keyboard.press('Meta+n');
  } else {
    await page.keyboard.press('Control+n');
  }
}

export async function waitForEditorFocus(page: Page): Promise<void> {
  await expect(page.locator('.cm-editor')).toBeFocused();
}

export async function assertNoTitleInput(page: Page): Promise<void> {
  const titleInputs = page.locator('input[placeholder*="タイトル"], textarea[placeholder*="タイトル"], input[name="title"], textarea[name="title"]');
  await expect(titleInputs).toHaveCount(0);
}

export async function assertNoMarkdownRendering(page: Page): Promise<void> {
  const bodyArea = page.locator('.cm-editor');
  await expect(bodyArea.locator('h1, h2, h3, strong, em')).toHaveCount(0);
}

export async function assertFrontmatterBackground(page: Page): Promise<void> {
  const fmLines = page.locator('.cm-frontmatter-bg');
  const count = await fmLines.count();
  expect(count).toBeGreaterThan(0);
}
