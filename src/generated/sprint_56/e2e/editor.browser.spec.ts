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
import { test, expect } from '@playwright/test';
import { waitForAppReady, APP_URL, invokeTauriCommand } from './helpers/app-launch';
import {
  assertCodeMirror6Present,
  assertNoTitleInput,
  assertNoMarkdownRendering,
  assertFrontmatterBackground,
} from './helpers/assertions';
import {
  typeInEditor,
  clickCopyButton,
  assertCopyButtonFeedback,
  pressNewNote,
  waitForEditorFocus,
  navigateToEditor,
  waitForAutoSave,
  getClipboardText,
} from './helpers/editor';
import { getDefaultNotesDir } from './helpers/test-data';
import * as fs from 'fs';
import * as path from 'path';

test.describe('editor – browser tests', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
  });

  // AC-ED-01: CodeMirror 6 is used, Markdown highlighting present, no HTML rendering
  test('AC-ED-01: CodeMirror 6 editor with Markdown highlight, no rendered HTML', async ({ page }) => {
    const { filename } = await invokeTauriCommand<{ filename: string }>(page, 'create_note');
    await navigateToEditor(page, filename);
    await assertCodeMirror6Present(page);
    await typeInEditor(page, '# Heading\n**bold text**\n- list item');
    await expect(page.locator('.cm-content')).toBeVisible();
    await assertNoMarkdownRendering(page);
    await invokeTauriCommand(page, 'delete_note', { filename });
  });

  // FC-ED-01: Editor must be CodeMirror 6 (not textarea / contenteditable alone)
  test('FC-ED-01: Editor engine is CodeMirror 6, not plain textarea', async ({ page }) => {
    const { filename } = await invokeTauriCommand<{ filename: string }>(page, 'create_note');
    await navigateToEditor(page, filename);
    const cmEditor = page.locator('.cm-editor');
    await expect(cmEditor, 'CodeMirror 6 .cm-editor must be in DOM').toBeVisible();
    const standaloneTextareas = await page.locator('textarea:not(.cm-content *)').count();
    expect(standaloneTextareas, 'No standalone textarea outside CM editor').toBe(0);
    await invokeTauriCommand(page, 'delete_note', { filename });
  });

  // AC-ED-02 / FC-ED-02: No title input field
  test('AC-ED-02: No title-specific input or textarea on editor screen', async ({ page }) => {
    const { filename } = await invokeTauriCommand<{ filename: string }>(page, 'create_note');
    await navigateToEditor(page, filename);
    await assertNoTitleInput(page);
    await invokeTauriCommand(page, 'delete_note', { filename });
  });

  // AC-ED-03 / FC-ED-05: Frontmatter region has distinct background color
  test('AC-ED-03: frontmatter region has .cm-frontmatter-bg class', async ({ page }) => {
    const { filename } = await invokeTauriCommand<{ filename: string }>(page, 'create_note');
    await navigateToEditor(page, filename);
    await assertFrontmatterBackground(page);
    await invokeTauriCommand(page, 'delete_note', { filename });
  });

  // AC-ED-04 / FC-ED-03: Cmd+N / Ctrl+N creates new note and focuses editor
  test('AC-ED-04: Cmd+N / Ctrl+N creates new note and focuses editor', async ({ page }) => {
    const notesDir = getDefaultNotesDir();
    const before = fs.existsSync(notesDir) ? fs.readdirSync(notesDir).filter((f) => f.endsWith('.md')).length : 0;

    await page.goto(APP_URL);
    await pressNewNote(page);

    await expect(page).toHaveURL(/\/edit\/\d{4}-\d{2}-\d{2}T\d{6}\.md/, { timeout: 5000 });
    await assertCodeMirror6Present(page);
    await waitForEditorFocus(page);

    const after = fs.existsSync(notesDir) ? fs.readdirSync(notesDir).filter((f) => f.endsWith('.md')).length : 0;
    expect(after, 'A new .md file must be created after Cmd+N/Ctrl+N').toBeGreaterThan(before);

    // cleanup: extract filename from URL and delete
    const url = page.url();
    const filenameMatch = url.match(/\/edit\/(.+)$/);
    if (filenameMatch) {
      await invokeTauriCommand(page, 'delete_note', { filename: decodeURIComponent(filenameMatch[1]) });
    }
  });

  // AC-ED-05 / FC-ED-04: 1-click copy button copies body to clipboard
  test('AC-ED-05: copy button copies body text (excluding frontmatter) to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const { filename } = await invokeTauriCommand<{ filename: string }>(page, 'create_note');
    await navigateToEditor(page, filename);

    const uniqueBody = `Unique clipboard test ${Date.now()}`;
    await invokeTauriCommand(page, 'save_note', {
      filename,
      frontmatter: { tags: ['copy-test'] },
      body: uniqueBody,
    });
    await page.reload();
    await assertCodeMirror6Present(page);

    await clickCopyButton(page);
    await assertCopyButtonFeedback(page);

    const clipText = await getClipboardText(page);
    expect(clipText.trim(), 'Clipboard must contain the body text').toContain(uniqueBody.trim());
    expect(clipText, 'Clipboard must NOT contain YAML frontmatter delimiters').not.toContain('---\ntags');

    await invokeTauriCommand(page, 'delete_note', { filename });
  });

  // Copy button feedback disappears after 2 seconds
  test('AC-ED-05: copy button shows feedback for ~2 seconds then reverts', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const { filename } = await invokeTauriCommand<{ filename: string }>(page, 'create_note');
    await navigateToEditor(page, filename);

    await clickCopyButton(page);
    const feedback = page.locator('button:has-text("✓"), button:has-text("コピー済み"), button:has-text("Copied")');
    await expect(feedback).toBeVisible({ timeout: 2000 });
    await expect(feedback).not.toBeVisible({ timeout: 4000 });

    await invokeTauriCommand(page, 'delete_note', { filename });
  });

  // AC-ED-06 / FC-ST-02: Auto-save after debounce
  test('AC-ED-06: text is auto-saved after debounce without explicit save action', async ({ page }) => {
    const { filename } = await invokeTauriCommand<{ filename: string }>(page, 'create_note');
    await navigateToEditor(page, filename);

    const uniqueText = `Autosave test ${Date.now()}`;
    await typeInEditor(page, uniqueText);
    await waitForAutoSave(page, 1500);

    const data = await invokeTauriCommand<{ frontmatter: unknown; body: string }>(
      page, 'read_note', { filename }
    );
    expect(data.body, 'Auto-saved body must contain typed text').toContain(uniqueText);

    await invokeTauriCommand(page, 'delete_note', { filename });
  });

  // FC-ED-02: No Markdown preview rendering
  test('FC-ED-02: Markdown preview rendering is absent from editor', async ({ page }) => {
    const { filename } = await invokeTauriCommand<{ filename: string }>(page, 'create_note');
    await navigateToEditor(page, filename);

    await typeInEditor(page, '# Heading\n**bold**\n_italic_');
    await assertNoMarkdownRendering(page);

    await invokeTauriCommand(page, 'delete_note', { filename });
  });

  // Cmd+N from editor screen creates another note
  test('AC-ED-04: Cmd+N from editor creates new note (not just from grid)', async ({ page }) => {
    const { filename: fn1 } = await invokeTauriCommand<{ filename: string }>(page, 'create_note');
    await navigateToEditor(page, fn1);

    await pressNewNote(page);
    await expect(page).toHaveURL(/\/edit\/\d{4}-\d{2}-\d{2}T\d{6}\.md/, { timeout: 5000 });

    const url = page.url();
    const match = url.match(/\/edit\/(.+)$/);
    const fn2 = match ? decodeURIComponent(match[1]) : null;
    expect(fn2, 'New filename must be different from original').not.toBe(fn1);

    await invokeTauriCommand(page, 'delete_note', { filename: fn1 });
    if (fn2) await invokeTauriCommand(page, 'delete_note', { filename: fn2 });
  });
});
