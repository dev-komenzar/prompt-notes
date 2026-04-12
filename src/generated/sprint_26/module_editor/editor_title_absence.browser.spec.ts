// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 26-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/test/acceptance_criteria.md (AC-EDIT-01, FC-EDIT-05)
// Sprint 26: ブラウザ上で EditorView にタイトル入力欄が存在しないことを確認

import { test, expect, Page } from '@playwright/test';

const APP_URL = process.env.TAURI_DEV_URL ?? 'http://localhost:1420';

async function navigateToEditor(page: Page): Promise<void> {
  await page.goto(APP_URL);
  // エディタ画面 (/) にいることを確認
  await page.waitForSelector('[data-testid="editor-view"], .cm-editor, .editor-view', {
    timeout: 5000,
  });
}

test.describe('EditorView — タイトル <input> / <textarea> 不在確認 (AC-EDIT-01 / FC-EDIT-05)', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToEditor(page);
  });

  test('エディタ画面にタイトル用 <input> が存在しない', async ({ page }) => {
    // title / タイトル に関連する placeholder, aria-label, name, id を持つ input
    const titleInputs = page.locator(
      'input[placeholder*="title" i], input[placeholder*="タイトル"], ' +
        'input[aria-label*="title" i], input[aria-label*="タイトル"], ' +
        'input[name*="title" i], input[name="タイトル"], ' +
        'input[id*="title" i], input[id*="タイトル"]'
    );
    await expect(titleInputs).toHaveCount(0);
  });

  test('エディタ画面にタイトル用 <textarea> が存在しない', async ({ page }) => {
    const titleTextareas = page.locator(
      'textarea[placeholder*="title" i], textarea[placeholder*="タイトル"], ' +
        'textarea[aria-label*="title" i], textarea[aria-label*="タイトル"]'
    );
    await expect(titleTextareas).toHaveCount(0);
  });

  test('CodeMirror 外の裸の <input type="text"> が存在しない', async ({ page }) => {
    // CodeMirror 6 は内部的に contenteditable div を使う。
    // .cm-editor コンテナ外に type="text" の input があればタイトル欄の疑い。
    const bareTextInputsOutsideCM = page.locator(
      'input[type="text"]:not(.cm-editor input):not(.cm-content input)'
    );
    // FrontmatterBar のタグ入力は許容するが、タイトル欄としての input は 0 件であること
    const count = await bareTextInputsOutsideCM.count();
    for (let i = 0; i < count; i++) {
      const el = bareTextInputsOutsideCM.nth(i);
      const placeholder = (await el.getAttribute('placeholder')) ?? '';
      const ariaLabel = (await el.getAttribute('aria-label')) ?? '';
      const name = (await el.getAttribute('name')) ?? '';
      const id = (await el.getAttribute('id')) ?? '';
      const combined = [placeholder, ariaLabel, name, id].join(' ').toLowerCase();
      expect(combined).not.toMatch(/title|タイトル|題名/);
    }
  });

  test('エディタ本文エリアは CodeMirror 6 インスタンスであること (RB-2)', async ({ page }) => {
    // CodeMirror 6 は .cm-editor クラスを持つコンテナを生成する
    const cmEditor = page.locator('.cm-editor');
    await expect(cmEditor).toBeVisible();

    // contenteditable の div が存在すること (CodeMirror 6 の編集領域)
    const cmContent = page.locator('.cm-content[contenteditable="true"]');
    await expect(cmContent).toBeVisible();
  });

  test('画面上部に frontmatter 領域が存在し、本文と背景色で区別されている (AC-EDIT-01)', async ({
    page,
  }) => {
    // frontmatter bar は .cm-editor コンテナの外側に存在する
    const frontmatterBar = page.locator(
      '[data-testid="frontmatter-bar"], .frontmatter-bar, .frontmatter'
    );
    await expect(frontmatterBar).toBeVisible();

    // frontmatter 領域とエディタ本文の背景色が異なることを検証
    const fmBg = await frontmatterBar.evaluate(
      (el) => getComputedStyle(el).backgroundColor
    );
    const cmEditor = page.locator('.cm-editor');
    const editorBg = await cmEditor.evaluate(
      (el) => getComputedStyle(el).backgroundColor
    );
    expect(fmBg).not.toBe(editorBg);
  });

  test('Markdown レンダリングプレビュー要素が存在しない (RB-2)', async ({ page }) => {
    // レンダリングされた HTML (h1, strong 等) が .cm-editor 外に存在しないこと
    const renderedMarkdown = page.locator(
      ':not(.cm-editor) > h1, :not(.cm-editor) > h2, ' +
        '[class*="preview"], [class*="render"], [class*="markdown-body"]'
    );
    await expect(renderedMarkdown).toHaveCount(0);
  });

  test('コピーボタンが存在する (RB-1 / AC-EDIT-04)', async ({ page }) => {
    const copyButton = page.locator(
      '[data-testid="copy-button"], button[aria-label*="copy" i], ' +
        'button[aria-label*="コピー"], .copy-button'
    );
    await expect(copyButton).toBeVisible();
  });
});
