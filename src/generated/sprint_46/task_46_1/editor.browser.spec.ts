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

import { test, expect } from '@playwright/test';
import {
  typeIntoEditor,
  clickCopyButton,
  pressNewNote,
  assertNoTitleInput,
  assertNoMarkdownRendering,
  assertFrontmatterBackground,
} from './helpers/editor';
import { defaultNotesDir, createTestNote, deleteTestNote, daysAgo } from './helpers/test-data';
import { parseFrontmatter } from './helpers/assertions';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

const APP_URL = 'http://localhost:1420';

test.describe('Editor — browser tests', () => {
  let notesDir: string;
  const created: string[] = [];

  test.beforeAll(() => {
    notesDir = defaultNotesDir();
  });

  test.afterAll(async () => {
    for (const f of created) {
      await deleteTestNote(notesDir, f);
    }
  });

  test('AC-ED-01: CodeMirror 6 renders Markdown highlight classes, not HTML elements', async ({ page }) => {
    const filename = await createTestNote(notesDir, { body: '# heading\n**bold**' });
    created.push(filename);
    await page.goto(`${APP_URL}/edit/${encodeURIComponent(filename)}`);
    await page.waitForSelector('.cm-editor');

    // syntax highlight spans exist
    const spans = page.locator('.cm-editor .cm-line span');
    await expect(spans.first()).toBeVisible();

    // no rendered HTML heading/strong in body area
    await assertNoMarkdownRendering(page);
  });

  test('AC-ED-02: no title input exists on editor screen', async ({ page }) => {
    const filename = await createTestNote(notesDir, { body: 'title input check' });
    created.push(filename);
    await page.goto(`${APP_URL}/edit/${encodeURIComponent(filename)}`);
    await assertNoTitleInput(page);
  });

  test('AC-ED-03: frontmatter region has distinct background', async ({ page }) => {
    const filename = await createTestNote(notesDir, { tags: ['x'], body: 'bg check' });
    created.push(filename);
    await page.goto(`${APP_URL}/edit/${encodeURIComponent(filename)}`);
    await page.waitForSelector('.cm-editor');
    await assertFrontmatterBackground(page);
  });

  test('AC-ED-04: Cmd+N / Ctrl+N creates new note and moves focus', async ({ page }) => {
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');

    await pressNewNote(page);
    await page.waitForURL(/\/edit\//);

    const url = page.url();
    expect(url).toMatch(/\/edit\//);

    const filename = url.split('/edit/')[1];
    created.push(decodeURIComponent(filename));

    const cmContent = page.locator('.cm-editor .cm-content');
    await expect(cmContent).toBeFocused({ timeout: 3000 });
  });

  test('AC-ED-05: copy button copies body (excluding frontmatter) to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const bodyText = `copy-test-${Date.now()}`;
    const filename = await createTestNote(notesDir, { tags: ['cp'], body: bodyText });
    created.push(filename);

    await page.goto(`${APP_URL}/edit/${encodeURIComponent(filename)}`);
    await page.waitForSelector('.cm-editor');

    await clickCopyButton(page);

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain(bodyText);
    expect(clipboardText).not.toContain('---');
  });

  test('AC-ED-05: copy button shows confirmation feedback', async ({ page }) => {
    const filename = await createTestNote(notesDir, { body: 'feedback test' });
    created.push(filename);
    await page.goto(`${APP_URL}/edit/${encodeURIComponent(filename)}`);
    await page.waitForSelector('.cm-editor');

    await clickCopyButton(page);
    await expect(page.locator('text=✓ コピー済み')).toBeVisible({ timeout: 1000 });
  });

  test('AC-ED-06: autosave persists text after debounce', async ({ page }) => {
    const filename = await createTestNote(notesDir, { body: '' });
    created.push(filename);
    await page.goto(`${APP_URL}/edit/${encodeURIComponent(filename)}`);
    await page.waitForSelector('.cm-editor');

    const uniqueText = `autosave-${Date.now()}`;
    await typeIntoEditor(page, uniqueText);

    // wait for debounce (max 1000ms) + I/O margin
    await page.waitForTimeout(1500);

    const content = await fs.readFile(path.join(notesDir, filename), 'utf-8');
    expect(content).toContain(uniqueText);
  });
});
