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
import { type Page, expect } from '@playwright/test';

export async function getEditorText(page: Page): Promise<string> {
  return page.evaluate(() => {
    const cm = document.querySelector('.cm-content');
    return cm ? cm.textContent ?? '' : '';
  });
}

export async function typeIntoEditor(page: Page, text: string): Promise<void> {
  const editor = page.locator('.cm-content');
  await editor.click();
  await editor.type(text);
}

export async function clickCopyButton(page: Page): Promise<void> {
  const btn = page.locator('[aria-label="本文をコピー"], button.copy-button');
  await btn.click();
}

export async function pressNewNote(page: Page): Promise<void> {
  const isMac = process.platform === 'darwin';
  if (isMac) {
    await page.keyboard.press('Meta+n');
  } else {
    await page.keyboard.press('Control+n');
  }
}

export async function assertEditorFocused(page: Page): Promise<void> {
  const isFocused = await page.evaluate(() => {
    const active = document.activeElement;
    return active?.classList.contains('cm-content') || active?.closest('.cm-editor') !== null;
  });
  expect(isFocused, 'CodeMirror editor should be focused').toBe(true);
}

export async function assertNoTitleInput(page: Page): Promise<void> {
  const titleInputs = await page.locator('input[data-title], textarea[data-title], .title-input input, .title-input textarea').count();
  expect(titleInputs, 'no title input elements should exist').toBe(0);
}

export async function assertFrontmatterBackground(page: Page): Promise<void> {
  const hasFrontmatterBg = await page.evaluate(() => {
    const frontmatterLines = document.querySelectorAll('.cm-frontmatter-bg');
    return frontmatterLines.length > 0;
  });
  expect(hasFrontmatterBg, '.cm-frontmatter-bg class must be applied to frontmatter lines').toBe(true);
}

export async function assertNoMarkdownRendering(page: Page): Promise<void> {
  const editorContent = page.locator('.cm-content');
  const h1Count = await editorContent.locator('h1').count();
  const strongCount = await editorContent.locator('strong').count();
  const emCount = await editorContent.locator('em').count();
  expect(h1Count, 'no rendered <h1> in editor content').toBe(0);
  expect(strongCount, 'no rendered <strong> in editor content').toBe(0);
  expect(emCount, 'no rendered <em> in editor content').toBe(0);
}

export async function assertCopyButtonExists(page: Page): Promise<void> {
  const btn = page.locator('[aria-label="本文をコピー"], button.copy-button');
  await expect(btn).toBeVisible();
}

export async function assertCodeMirrorLoaded(page: Page): Promise<void> {
  await expect(page.locator('.cm-editor')).toBeVisible();
}
