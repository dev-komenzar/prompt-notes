// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 21-1
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

export async function typeIntoCodeMirror(page: Page, text: string): Promise<void> {
  const editor = page.locator('.cm-editor .cm-content');
  await editor.click();
  await editor.type(text);
}

export async function getCodeMirrorContent(page: Page): Promise<string> {
  return page.evaluate(() => {
    const view = (window as any).__cm_view__;
    if (view) return view.state.doc.toString();
    // fallback: read text content of editor lines
    const lines = Array.from(document.querySelectorAll('.cm-line'));
    return lines.map((l) => l.textContent ?? '').join('\n');
  });
}

export async function clickCopyButton(page: Page): Promise<void> {
  const btn = page.getByRole('button', { name: /コピー|copy/i });
  await btn.click();
}

export async function assertCopyButtonShowsCopied(page: Page): Promise<void> {
  const btn = page.getByRole('button', { name: /コピー済み|copied/i });
  await expect(btn).toBeVisible({ timeout: 2000 });
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
    return active?.closest('.cm-editor') !== null;
  });
  expect(isFocused).toBe(true);
}

export async function assertFrontmatterBackgroundDistinct(page: Page): Promise<void> {
  const frontmatterLine = page.locator('.cm-frontmatter-bg').first();
  await expect(frontmatterLine).toBeVisible();
  const bodyLine = page.locator('.cm-line:not(.cm-frontmatter-bg)').first();
  const fmBg = await frontmatterLine.evaluate((el) => getComputedStyle(el).backgroundColor);
  const bodyBg = await bodyLine.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(fmBg).not.toBe(bodyBg);
}

export async function waitForAutoSave(page: Page, ms = 1500): Promise<void> {
  await page.waitForTimeout(ms);
}
