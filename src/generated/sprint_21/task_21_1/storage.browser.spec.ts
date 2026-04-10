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
import * as path from 'path';
import * as fs from 'fs';
import { waitForAppReady, openPage } from './helpers/app-launch';
import { pressNewNote } from './helpers/editor';
import {
  getDefaultNotesDir,
  listNotesInDir,
  parseNoteContent,
} from './helpers/test-data';
import { assertFilenameFormat } from './helpers/assertions';

test.beforeAll(async () => {
  await waitForAppReady();
});

test.describe('AC-ST-01 browser: new note file has correct filename format', () => {
  test('Cmd+N creates file with YYYY-MM-DDTHHMMSS.md format', async ({ page }) => {
    await openPage(page, '/');
    const notesDir = getDefaultNotesDir();
    const before = new Set(listNotesInDir(notesDir));

    await pressNewNote(page);
    await page.waitForURL(/\/edit\/.+/, { timeout: 5000 });

    await page.waitForTimeout(500);
    const after = listNotesInDir(notesDir);
    const newFiles = after.filter((f) => !before.has(f));
    expect(newFiles.length).toBeGreaterThanOrEqual(1);
    for (const f of newFiles) {
      assertFilenameFormat(f);
    }
  });
});

test.describe('AC-ST-02 browser: saved note has correct structure', () => {
  test('saved note contains YAML frontmatter with tags key only', async ({ page }) => {
    await openPage(page, '/');
    await pressNewNote(page);
    await page.waitForURL(/\/edit\/.+/);

    const url = page.url();
    const filename = decodeURIComponent(url.split('/edit/')[1]);

    const editor = page.locator('.cm-editor .cm-content');
    await editor.click();
    await editor.type('Hello storage test');
    await page.waitForTimeout(1500);

    const notesDir = getDefaultNotesDir();
    const filepath = path.join(notesDir, filename);
    expect(fs.existsSync(filepath)).toBe(true);
    const content = fs.readFileSync(filepath, 'utf-8');
    expect(content.startsWith('---\n')).toBe(true);
    const { frontmatter } = parseNoteContent(content);
    expect(frontmatter).toHaveProperty('tags');
    const forbiddenKeys = Object.keys(frontmatter).filter((k) => k !== 'tags');
    expect(forbiddenKeys).toHaveLength(0);
  });
});

test.describe('AC-ST-04 browser: settings directory change persists', () => {
  test.fixme('settings page allows changing notes directory and new notes use it', async ({ page }) => {
    await openPage(page, '/settings');
    // Implementation pending: settings UI interaction
  });
});

test.describe('FC-ST-01 browser: filename format enforcement', () => {
  test('URL param for edit page matches filename format', async ({ page }) => {
    await openPage(page, '/');
    await pressNewNote(page);
    await page.waitForURL(/\/edit\/.+/, { timeout: 5000 });
    const url = page.url();
    const filename = decodeURIComponent(url.split('/edit/')[1]);
    assertFilenameFormat(filename);
  });
});

test.describe('FC-ST-02 browser: auto-save works without explicit save', () => {
  test('text input is persisted to disk after debounce without user save action', async ({ page }) => {
    await openPage(page, '/');
    await pressNewNote(page);
    await page.waitForURL(/\/edit\/.+/);
    const url = page.url();
    const filename = decodeURIComponent(url.split('/edit/')[1]);

    const uniqueStr = `nosave-${Date.now()}`;
    const editor = page.locator('.cm-editor .cm-content');
    await editor.click();
    await editor.type(uniqueStr);

    // No explicit save — just wait
    await page.waitForTimeout(1500);

    const notesDir = getDefaultNotesDir();
    const filepath = path.join(notesDir, filename);
    const raw = fs.readFileSync(filepath, 'utf-8');
    expect(raw).toContain(uniqueStr);
  });
});
