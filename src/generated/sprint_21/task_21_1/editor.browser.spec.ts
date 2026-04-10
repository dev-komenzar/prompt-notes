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
import { test, expect } from '@playwright/test';
import { waitForAppReady, openPage } from './helpers/app-launch';
import {
  typeIntoCodeMirror,
  clickCopyButton,
  assertCopyButtonShowsCopied,
  pressNewNote,
  assertEditorFocused,
  assertFrontmatterBackgroundDistinct,
} from './helpers/editor';
import { assertNoTitleInput, assertNoMarkdownRendering, assertFilenameFormat } from './helpers/assertions';

test.beforeAll(async () => {
  await waitForAppReady();
});

test.describe('AC-ED-01: CodeMirror 6 editor with Markdown highlight, no rendering', () => {
  test('editor uses CodeMirror 6 and shows syntax highlight classes', async ({ page }) => {
    await openPage(page, '/');
    await pressNewNote(page);
    await page.waitForURL(/\/edit\/.+/);

    await typeIntoCodeMirror(page, '# Heading\n**bold**\n- list');

    const cmEditor = page.locator('.cm-editor');
    await expect(cmEditor).toBeVisible();

    // Highlight classes exist (CodeMirror adds these)
    const hasHighlight = await page.locator('.cm-editor [class*="tok-"]').count();
    expect(hasHighlight).toBeGreaterThan(0);
  });

  test('AC-ED-01: no rendered HTML elements in editor body', async ({ page }) => {
    await openPage(page, '/');
    await pressNewNote(page);
    await page.waitForURL(/\/edit\/.+/);
    await typeIntoCodeMirror(page, '# Heading\n**bold**');
    await assertNoMarkdownRendering(page);
  });
});

test.describe('AC-ED-02: no title input field', () => {
  test('editor screen has no title-specific input or textarea', async ({ page }) => {
    await openPage(page, '/');
    await pressNewNote(page);
    await page.waitForURL(/\/edit\/.+/);
    await assertNoTitleInput(page);
  });
});

test.describe('AC-ED-03: frontmatter area visually distinct', () => {
  test('frontmatter lines have different background color than body', async ({ page }) => {
    await openPage(page, '/');
    await pressNewNote(page);
    await page.waitForURL(/\/edit\/.+/);
    await assertFrontmatterBackgroundDistinct(page);
  });
});

test.describe('AC-ED-04: Cmd+N / Ctrl+N creates new note and focuses editor', () => {
  test('keyboard shortcut creates new note file and routes to editor', async ({ page }) => {
    await openPage(page, '/');
    const beforeUrl = page.url();
    await pressNewNote(page);
    await page.waitForURL(/\/edit\/.+/, { timeout: 5000 });
    const afterUrl = page.url();
    expect(afterUrl).not.toBe(beforeUrl);
    expect(afterUrl).toMatch(/\/edit\//);

    const filename = decodeURIComponent(afterUrl.split('/edit/')[1]);
    assertFilenameFormat(filename);
  });

  test('after Cmd+N editor receives focus', async ({ page }) => {
    await openPage(page, '/');
    await pressNewNote(page);
    await page.waitForURL(/\/edit\/.+/, { timeout: 5000 });
    await page.waitForTimeout(300);
    await assertEditorFocused(page);
  });

  test('Cmd+N works from grid view', async ({ page }) => {
    await openPage(page, '/');
    await pressNewNote(page);
    await page.waitForURL(/\/edit\/.+/, { timeout: 5000 });
    expect(page.url()).toMatch(/\/edit\//);
  });
});

test.describe('AC-ED-05: 1-click copy button copies body without frontmatter', () => {
  test('copy button is visible', async ({ page }) => {
    await openPage(page, '/');
    await pressNewNote(page);
    await page.waitForURL(/\/edit\/.+/);
    const btn = page.getByRole('button', { name: /コピー|copy/i });
    await expect(btn).toBeVisible();
  });

  test('copy button shows copied feedback', async ({ page }) => {
    await openPage(page, '/');
    await pressNewNote(page);
    await page.waitForURL(/\/edit\/.+/);

    await typeIntoCodeMirror(page, 'test body content');
    await clickCopyButton(page);
    await assertCopyButtonShowsCopied(page);
  });

  test('copied text excludes frontmatter', async ({ page }) => {
    await openPage(page, '/');
    await pressNewNote(page);
    await page.waitForURL(/\/edit\/.+/);

    const bodyText = `unique-body-${Date.now()}`;
    await typeIntoCodeMirror(page, bodyText);
    await clickCopyButton(page);

    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toContain(bodyText);
    expect(clipboard).not.toContain('---');
    expect(clipboard).not.toContain('tags:');
  });
});

test.describe('FC-ED-01, FC-ED-02: scope guard — no forbidden implementations', () => {
  test('FC-ED-01: CodeMirror 6 is used (cm-editor present)', async ({ page }) => {
    await openPage(page, '/');
    await pressNewNote(page);
    await page.waitForURL(/\/edit\/.+/);
    await expect(page.locator('.cm-editor')).toBeVisible();
  });

  test('FC-ED-02: no title input', async ({ page }) => {
    await openPage(page, '/');
    await pressNewNote(page);
    await page.waitForURL(/\/edit\/.+/);
    await assertNoTitleInput(page);
  });

  test('FC-ED-02: no Markdown preview rendered elements', async ({ page }) => {
    await openPage(page, '/');
    await pressNewNote(page);
    await page.waitForURL(/\/edit\/.+/);
    await typeIntoCodeMirror(page, '# Test\n**bold**');
    await assertNoMarkdownRendering(page);
  });

  test('FC-ED-05: frontmatter background is visible', async ({ page }) => {
    await openPage(page, '/');
    await pressNewNote(page);
    await page.waitForURL(/\/edit\/.+/);
    const fmLines = await page.locator('.cm-frontmatter-bg').count();
    expect(fmLines).toBeGreaterThan(0);
  });
});
