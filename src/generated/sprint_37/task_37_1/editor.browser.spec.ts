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
import { test, expect } from '@playwright/test';
import { waitForApp, navigateTo } from './helpers/app-launch';
import {
  assertCodeMirrorLoaded,
  assertNoTitleInput,
  assertFrontmatterBackground,
  assertNoMarkdownRendering,
  assertCopyButtonExists,
  clickCopyButton,
  typeIntoEditor,
  pressNewNote,
  assertEditorFocused,
} from './helpers/editor';
import { getDefaultNotesDir, listNoteFiles, FILENAME_REGEX } from './helpers/test-data';

test.beforeAll(async () => {
  await waitForApp();
});

test.describe('AC-ED-01: CodeMirror 6 with Markdown syntax highlighting, no rendering', () => {
  test('editor uses CodeMirror 6 (cm-editor present)', async ({ page }) => {
    await navigateTo(page, '/');
    // Navigate to any existing note or create one via keyboard
    await pressNewNote(page);
    await page.waitForURL(/\/edit\//);
    await assertCodeMirrorLoaded(page);
  });

  test('AC-ED-01: Markdown syntax does not render as HTML elements', async ({ page }) => {
    await navigateTo(page, '/');
    await pressNewNote(page);
    await page.waitForURL(/\/edit\//);
    await assertCodeMirrorLoaded(page);
    await typeIntoEditor(page, '# heading\n**bold**\n- item');
    await assertNoMarkdownRendering(page);
  });
});

test.describe('AC-ED-02: No title input element', () => {
  test('editor page has no title-specific input or textarea', async ({ page }) => {
    await navigateTo(page, '/');
    await pressNewNote(page);
    await page.waitForURL(/\/edit\//);
    await assertNoTitleInput(page);
  });
});

test.describe('AC-ED-03: frontmatter area visually distinct', () => {
  test('frontmatter lines have .cm-frontmatter-bg class', async ({ page }) => {
    await navigateTo(page, '/');
    await pressNewNote(page);
    await page.waitForURL(/\/edit\//);
    await assertCodeMirrorLoaded(page);
    await assertFrontmatterBackground(page);
  });
});

test.describe('AC-ED-04: Cmd+N / Ctrl+N creates new note and focuses editor', () => {
  test('keyboard shortcut creates new note and redirects to /edit/:filename', async ({ page }) => {
    await navigateTo(page, '/');
    const notesDir = getDefaultNotesDir();
    const before = listNoteFiles(notesDir);

    await pressNewNote(page);
    await page.waitForURL(/\/edit\//);

    const url = page.url();
    const filenameMatch = url.match(/\/edit\/([^/]+)$/);
    expect(filenameMatch, 'URL should contain filename').toBeTruthy();
    const filename = decodeURIComponent(filenameMatch![1]);
    expect(filename).toMatch(FILENAME_REGEX);

    await assertEditorFocused(page);

    const after = listNoteFiles(notesDir);
    expect(after.length).toBeGreaterThan(before.length);
  });
});

test.describe('AC-ED-05: 1-click copy button copies body (excluding frontmatter)', () => {
  test('copy button is visible on editor page', async ({ page }) => {
    await navigateTo(page, '/');
    await pressNewNote(page);
    await page.waitForURL(/\/edit\//);
    await assertCopyButtonExists(page);
  });

  test('clicking copy button copies body text to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await navigateTo(page, '/');
    await pressNewNote(page);
    await page.waitForURL(/\/edit\//);
    await assertCodeMirrorLoaded(page);

    const uniqueText = `copy-test-${Date.now()}`;
    await typeIntoEditor(page, uniqueText);

    await clickCopyButton(page);

    const clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });
    expect(clipboardText).toContain(uniqueText);
    // Frontmatter should not be in clipboard
    expect(clipboardText).not.toMatch(/^---/);
  });

  test('copy button shows checkmark feedback for 2 seconds', async ({ page }) => {
    await navigateTo(page, '/');
    await pressNewNote(page);
    await page.waitForURL(/\/edit\//);
    await assertCodeMirrorLoaded(page);

    await clickCopyButton(page);
    const btn = page.locator('[aria-label="本文をコピー"], button.copy-button');
    await expect(btn).toContainText('✓', { timeout: 500 });
    await expect(btn).not.toContainText('✓', { timeout: 3000 });
  });
});

test.describe('AC-ED-06: auto-save without explicit user action', () => {
  test('text entered in editor is persisted after debounce without manual save', async ({ page }) => {
    await navigateTo(page, '/');
    await pressNewNote(page);
    await page.waitForURL(/\/edit\//);
    await assertCodeMirrorLoaded(page);

    const uniqueBody = `autosave-test-${Date.now()}`;
    await typeIntoEditor(page, uniqueBody);

    // Wait for debounce (750ms) + some buffer
    await page.waitForTimeout(2000);

    const url = page.url();
    const filenameMatch = url.match(/\/edit\/([^/]+)$/);
    if (!filenameMatch) throw new Error('Not on editor page');
    const filename = decodeURIComponent(filenameMatch[1]);

    const { readNoteFile } = await import('./helpers/test-data');
    const notesDir = getDefaultNotesDir();
    const content = readNoteFile(notesDir, filename);
    expect(content).toContain(uniqueBody);
  });
});
