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

import { test, expect } from '@playwright/test';
import {
  BASE_URL,
  gotoEditor,
  gotoNew,
  tauriInvoke,
  waitForAppReady,
} from './helpers/app-launch';
import { getDefaultNotesDir, cleanupNoteFiles } from './helpers/test-data';
import {
  assertServerHealthy,
  assertCodeMirrorPresent,
  assertNoTitleInput,
  assertNoMarkdownRendering,
  assertFrontmatterDecoration,
} from './helpers/assertions';
import {
  typeInEditor,
  clickCopyButton,
  pressNewNote,
  waitForEditorFocus,
} from './helpers/editor';

const notesDir = getDefaultNotesDir();

test.beforeAll(async () => {
  await waitForAppReady();
});

test.use({
  permissions: ['clipboard-read', 'clipboard-write'],
});

test.describe('editor — browser tests', () => {
  let createdFiles: string[] = [];

  test.afterEach(() => {
    cleanupNoteFiles(notesDir, createdFiles);
    createdFiles = [];
  });

  test('server is healthy (< 5xx) (health baseline)', async ({ page }) => {
    await page.goto(BASE_URL);
    await assertServerHealthy(page);
  });

  // AC-ED-01: CodeMirror 6 is the editor engine
  test('AC-ED-01: CodeMirror 6 editor is present and visible', async ({ page }) => {
    await page.goto(BASE_URL);
    const result = await tauriInvoke<{ filename: string }>(page, 'create_note');
    createdFiles.push(result.filename);
    await gotoEditor(page, result.filename);
    await assertCodeMirrorPresent(page);
  });

  // AC-ED-01 / FC-ED-01: no non-CodeMirror editor engine
  test('FC-ED-01: no non-CodeMirror editor (textarea / contenteditable body)', async ({ page }) => {
    await page.goto(BASE_URL);
    const result = await tauriInvoke<{ filename: string }>(page, 'create_note');
    createdFiles.push(result.filename);
    await gotoEditor(page, result.filename);
    // Raw textarea used as a standalone editor would be at root level, not inside .cm-editor
    const standaloneTextarea = await page
      .locator('textarea')
      .filter({ hasNot: page.locator('.cm-editor') })
      .count();
    expect(standaloneTextarea, 'Standalone <textarea> editor must not exist (FC-ED-01)').toBe(0);
  });

  // AC-ED-01: no rendered Markdown HTML elements
  test('AC-ED-01: Markdown is syntax-highlighted, not rendered (no <h1> etc in body area)', async ({
    page,
  }) => {
    await page.goto(BASE_URL);
    const result = await tauriInvoke<{ filename: string }>(page, 'create_note');
    createdFiles.push(result.filename);
    await tauriInvoke(page, 'save_note', {
      filename: result.filename,
      frontmatter: { tags: [] },
      body: '# Heading\n**bold** _italic_',
    });
    await gotoEditor(page, result.filename);
    await assertNoMarkdownRendering(page);
  });

  // AC-ED-02 / FC-ED-02: no title input
  test('AC-ED-02 / FC-ED-02: no title input field in editor', async ({ page }) => {
    await page.goto(BASE_URL);
    const result = await tauriInvoke<{ filename: string }>(page, 'create_note');
    createdFiles.push(result.filename);
    await gotoEditor(page, result.filename);
    await assertNoTitleInput(page);
  });

  // AC-ED-03 / FC-ED-05: frontmatter area has distinct background
  test('AC-ED-03 / FC-ED-05: frontmatter area is visually distinct (.cm-frontmatter-bg)', async ({
    page,
  }) => {
    await page.goto(BASE_URL);
    const result = await tauriInvoke<{ filename: string }>(page, 'create_note');
    createdFiles.push(result.filename);
    await tauriInvoke(page, 'save_note', {
      filename: result.filename,
      frontmatter: { tags: ['e2e'] },
      body: 'body text',
    });
    await gotoEditor(page, result.filename);
    await assertFrontmatterDecoration(page);
  });

  // AC-ED-04 / FC-ED-03: Cmd+N / Ctrl+N creates new note
  test('AC-ED-04 / FC-ED-03: Ctrl+N / Cmd+N creates new note and navigates to editor', async ({
    page,
  }) => {
    await page.goto(BASE_URL);
    await pressNewNote(page);
    await page.waitForURL(/\/edit\/.+/, { timeout: 8000 });
    const url = page.url();
    expect(url).toMatch(/\/edit\/.+/);
    // Verify an editor is visible
    await assertCodeMirrorPresent(page);
    // Extract filename from URL and register for cleanup
    const m = url.match(/\/edit\/(.+)$/);
    if (m) createdFiles.push(decodeURIComponent(m[1]));
  });

  // AC-ED-04: editor is focused after Cmd+N
  test('AC-ED-04: editor has focus after new note creation', async ({ page }) => {
    await page.goto(BASE_URL);
    await pressNewNote(page);
    await page.waitForURL(/\/edit\/.+/, { timeout: 8000 });
    await waitForEditorFocus(page);
    const m = page.url().match(/\/edit\/(.+)$/);
    if (m) createdFiles.push(decodeURIComponent(m[1]));
  });

  // AC-ED-05 / FC-ED-04: copy button is present and copies body
  test('AC-ED-05 / FC-ED-04: copy button copies body (excluding frontmatter) to clipboard', async ({
    page,
    context,
  }) => {
    await page.goto(BASE_URL);
    const result = await tauriInvoke<{ filename: string }>(page, 'create_note');
    createdFiles.push(result.filename);
    const uniqueBody = `clipboard_test_body_${Date.now()}`;
    await tauriInvoke(page, 'save_note', {
      filename: result.filename,
      frontmatter: { tags: ['copy-test'] },
      body: uniqueBody,
    });
    await gotoEditor(page, result.filename);
    await clickCopyButton(page);

    // Read clipboard via evaluate
    const clipContent = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipContent).toContain(uniqueBody);
    // Frontmatter YAML separator must not be in the copied text
    expect(clipContent).not.toMatch(/^---/);
  });

  // AC-ED-05: copy button shows visual feedback
  test('AC-ED-05: copy button shows "✓" / copied feedback after click', async ({ page }) => {
    await page.goto(BASE_URL);
    const result = await tauriInvoke<{ filename: string }>(page, 'create_note');
    createdFiles.push(result.filename);
    await gotoEditor(page, result.filename);
    const btn = page
      .locator('button[aria-label*="コピー"], button:has-text("コピー"), button[aria-label*="copy" i]')
      .first();
    await btn.click();
    // Button text should change to indicate success
    await expect(btn).toContainText(/✓|コピー済み|copied/i, { timeout: 2000 });
  });

  // AC-ED-06 / FC-ST-02: auto-save persists body without explicit save
  test('AC-ED-06 / FC-ST-02: auto-save persists changes after debounce', async ({ page }) => {
    await page.goto(BASE_URL);
    const result = await tauriInvoke<{ filename: string }>(page, 'create_note');
    createdFiles.push(result.filename);
    await gotoEditor(page, result.filename);

    const uniqueText = `autosave_${Date.now()}`;
    await typeInEditor(page, uniqueText);
    // Wait for auto-save debounce (750ms default) + write time
    await page.waitForTimeout(2000);

    const saved = await tauriInvoke<{ frontmatter: { tags: string[] }; body: string }>(
      page,
      'read_note',
      { filename: result.filename },
    );
    expect(saved.body).toContain(uniqueText);
  });

  // /new route redirects to /edit/:filename
  test('/new route creates note and redirects to editor', async ({ page }) => {
    await gotoNew(page);
    await page.waitForURL(/\/edit\/.+/, { timeout: 8000 });
    expect(page.url()).toMatch(/\/edit\/.+/);
    await assertCodeMirrorPresent(page);
    const m = page.url().match(/\/edit\/(.+)$/);
    if (m) createdFiles.push(decodeURIComponent(m[1]));
  });
});
