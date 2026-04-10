// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 49-1
// @task-title: 下記テストケース一覧のすべてが Playwright で通過
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

import { Page, expect } from '@playwright/test';

/** Type text into the CodeMirror 6 editor. */
export async function typeInEditor(page: Page, text: string): Promise<void> {
  const content = page.locator('.cm-content');
  await content.click();
  await content.pressSequentially(text);
}

/** Get the full text currently in the CodeMirror editor (including frontmatter). */
export async function getEditorText(page: Page): Promise<string> {
  return page.evaluate(() => {
    const view = (
      document.querySelector('.cm-editor') as unknown as {
        CodeMirror?: { state: { doc: { toString(): string } } };
        cmView?: { state: { doc: { toString(): string } } };
      }
    );
    // Access CodeMirror view instance stored on the DOM element
    const el = document.querySelector('.cm-editor') as HTMLElement & { cmView?: unknown };
    const cmView = el?.cmView as { state: { doc: { toString(): string } } } | undefined;
    if (cmView) return cmView.state.doc.toString();
    return (document.querySelector('.cm-content') as HTMLElement)?.textContent ?? '';
  });
}

/** Extract the body part (after frontmatter) from editor text. */
export function extractBody(text: string): string {
  const m = text.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  return m ? m[1] : text;
}

/** Click the copy button and wait for clipboard content. */
export async function clickCopyButton(page: Page): Promise<void> {
  const btn = page.locator('button[aria-label*="コピー"], button:has-text("コピー"), button[aria-label*="copy" i]').first();
  await expect(btn).toBeVisible();
  await btn.click();
}

/** Send Ctrl+N or Cmd+N depending on platform. */
export async function pressNewNote(page: Page): Promise<void> {
  const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
  await page.keyboard.press(`${modifier}+n`);
}

/** Wait until the editor is focused. */
export async function waitForEditorFocus(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const content = document.querySelector('.cm-content');
    return content !== null && document.activeElement === content;
  }, undefined, { timeout: 5000 });
}

/** Assert that frontmatter lines carry the `.cm-frontmatter-bg` decoration class. */
export async function assertFrontmatterDecoration(page: Page): Promise<void> {
  // The ViewPlugin applies `.cm-frontmatter-bg` to each frontmatter line
  const decorated = await page.locator('.cm-frontmatter-bg').count();
  expect(decorated, '.cm-frontmatter-bg decoration must be present in frontmatter area').toBeGreaterThan(0);
}
