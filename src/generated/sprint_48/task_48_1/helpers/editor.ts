// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 48-1
// @task-title: グリッドビュー → エディタ → 自動保存 → グリッドビューに戻り変更が反映されるエンドツーエンドのワークフロー確認
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

import { type Page } from '@playwright/test';

export async function typeIntoEditor(page: Page, text: string): Promise<void> {
  const editorContent = page.locator('.cm-content');
  await editorContent.click();
  // 末尾に移動してから入力
  await page.keyboard.press('End');
  await editorContent.type(text);
}

export async function waitForAutoSave(page: Page, waitMs: number): Promise<void> {
  // デバウンス完了後にsave_note IPCが呼ばれるまで待機
  await page.waitForTimeout(waitMs);
}

export async function clickCopyButton(page: Page): Promise<string> {
  // クリップボード権限付与
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

  const copyBtn = page.locator(
    '[data-testid="copy-button"], button:has-text("コピー"), button[aria-label="本文をコピー"]'
  ).first();
  await copyBtn.click();

  // クリップボード内容を取得
  const clipboardText = await page.evaluate(async () => {
    return navigator.clipboard.readText();
  });
  return clipboardText;
}

export async function getFrontmatterRegion(page: Page): Promise<string> {
  const fmLines = page.locator('.cm-frontmatter-bg');
  const texts: string[] = [];
  const count = await fmLines.count();
  for (let i = 0; i < count; i++) {
    texts.push(await fmLines.nth(i).textContent() ?? '');
  }
  return texts.join('\n');
}

export async function getEditorBodyText(page: Page): Promise<string> {
  const fullText = await page.locator('.cm-content').innerText();
  // frontmatterを除いた本文を返す
  const match = fullText.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  return match ? match[1] : fullText;
}
