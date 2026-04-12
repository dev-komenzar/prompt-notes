// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 49-1
// @task-title: `module:editor` + `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/editor_clipboard_design.md
// @generated-from: docs/detailed_design/storage_fileformat_design.md
// Sprint 49: Integration test — Editor ↔ Storage E2E flow

import { test, expect, type Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

const APP_URL = 'http://localhost:1420/';
const DEBOUNCE_MS = 600; // 500ms debounce + 100ms margin

function resolveDefaultNotesDir(): string {
  if (process.platform === 'darwin') {
    return path.join(
      os.homedir(),
      'Library',
      'Application Support',
      'promptnotes',
      'notes'
    );
  }
  return path.join(
    os.homedir(),
    '.local',
    'share',
    'promptnotes',
    'notes'
  );
}

function listNoteFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /^\d{4}-\d{2}-\d{2}T\d{6}\.md$/.test(f))
    .sort()
    .reverse();
}

function readNoteFile(dir: string, filename: string): string {
  return fs.readFileSync(path.join(dir, filename), 'utf-8');
}

async function waitMs(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function pressNewNote(page: Page): Promise<void> {
  if (process.platform === 'darwin') {
    await page.keyboard.press('Meta+n');
  } else {
    await page.keyboard.press('Control+n');
  }
}

test.describe('AC-EDIT-03 / AC-EDIT-05 / AC-STOR-01: Note creation and auto-save', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL);
    await page.waitForSelector('[data-testid="editor-layout"]', { timeout: 5000 });
  });

  test('Cmd+N/Ctrl+N creates note, editor receives focus', async ({ page }) => {
    await pressNewNote(page);
    const cmContent = page.locator('.cm-editor .cm-content');
    await expect(cmContent).toBeFocused({ timeout: 2000 });
  });

  test('New note on already-empty editor still creates new note (AC-EDIT-03)', async ({
    page,
  }) => {
    const notesDir = resolveDefaultNotesDir();
    const beforeCount = listNoteFiles(notesDir).length;

    await pressNewNote(page);
    await waitMs(200);
    await pressNewNote(page);
    await waitMs(200);

    const afterCount = listNoteFiles(notesDir).length;
    expect(afterCount).toBeGreaterThanOrEqual(beforeCount + 2);
  });

  test('Typing auto-saves body with correct filename format (AC-STOR-01, AC-EDIT-05)', async ({
    page,
  }) => {
    const notesDir = resolveDefaultNotesDir();

    await pressNewNote(page);
    await page.locator('.cm-editor .cm-content').fill('auto-save integration test body');
    await waitMs(DEBOUNCE_MS);

    const files = listNoteFiles(notesDir);
    expect(files.length).toBeGreaterThan(0);

    const latest = files[0];
    expect(latest).toMatch(/^\d{4}-\d{2}-\d{2}T\d{6}\.md$/);

    const content = readNoteFile(notesDir, latest);
    expect(content).toContain('auto-save integration test body');
  });

  test('Saved file has correct frontmatter structure (AC-STOR-02)', async ({ page }) => {
    const notesDir = resolveDefaultNotesDir();

    await pressNewNote(page);
    await page.locator('.cm-editor .cm-content').fill('frontmatter structure test');
    await waitMs(DEBOUNCE_MS);

    const files = listNoteFiles(notesDir);
    const latest = files[0];
    const content = readNoteFile(notesDir, latest);

    expect(content).toMatch(/^---\n/);
    expect(content).toContain('tags:');
    expect(content).not.toMatch(/title:/);
    expect(content).not.toMatch(/created_at:/);
  });
});

test.describe('AC-EDIT-02: Note list and reload', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL);
    await page.waitForSelector('[data-testid="editor-layout"]', { timeout: 5000 });
  });

  test('Note list shows created note after creation', async ({ page }) => {
    await pressNewNote(page);
    await page.locator('.cm-editor .cm-content').fill('visible in note list');
    await waitMs(DEBOUNCE_MS);

    await page.reload();
    await page.waitForSelector('[data-testid="note-list"]', { timeout: 5000 });

    const noteItems = page.locator('[data-testid="note-list"] [role="button"]');
    await expect(noteItems).not.toHaveCount(0);
  });

  test('Clicking note in list loads it into editor (AC-EDIT-02)', async ({ page }) => {
    // Create a note with known content
    await pressNewNote(page);
    const testBody = 'reload test content ' + Date.now();
    await page.locator('.cm-editor .cm-content').fill(testBody);
    await waitMs(DEBOUNCE_MS);

    // Create another note so we can navigate back
    await pressNewNote(page);
    await waitMs(200);

    // Reload to refresh note list
    await page.reload();
    await page.waitForSelector('[data-testid="note-list"]', { timeout: 5000 });

    const firstNote = page.locator('[data-testid="note-list"] [role="button"]').nth(1);
    await firstNote.click();

    const cmContent = page.locator('.cm-editor .cm-content');
    await expect(cmContent).toContainText(testBody.split(' ')[0], { timeout: 3000 });
  });
});

test.describe('AC-EDIT-04: Copy button', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(APP_URL);
    await page.waitForSelector('[data-testid="editor-layout"]', { timeout: 5000 });
  });

  test('Copy button copies editor body without frontmatter', async ({ page }) => {
    await pressNewNote(page);
    const bodyText = 'clipboard copy test ' + Date.now();
    await page.locator('.cm-editor .cm-content').fill(bodyText);

    await page.locator('[data-testid="copy-button"]').click();

    const clipContent = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipContent).toBe(bodyText);
    expect(clipContent).not.toContain('---');
    expect(clipContent).not.toContain('tags:');
  });

  test('Copy button shows success feedback for 1.5s', async ({ page }) => {
    await pressNewNote(page);
    await page.locator('.cm-editor .cm-content').fill('feedback test');

    await page.locator('[data-testid="copy-button"]').click();
    await expect(page.locator('[data-testid="copy-button"]')).toHaveClass(/copied/);

    await waitMs(1600);
    await expect(page.locator('[data-testid="copy-button"]')).not.toHaveClass(/copied/);
  });
});

test.describe('AC-EDIT-06: Frontmatter tag editing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL);
    await page.waitForSelector('[data-testid="editor-layout"]', { timeout: 5000 });
  });

  test('Adding a tag triggers auto-save with tag in frontmatter', async ({ page }) => {
    const notesDir = resolveDefaultNotesDir();

    await pressNewNote(page);
    await page.locator('.cm-editor .cm-content').fill('tag save test');

    const tagInput = page.locator('[data-testid="frontmatter-bar"] input[type="text"]');
    await tagInput.fill('testtag');
    await tagInput.press('Enter');
    await waitMs(DEBOUNCE_MS);

    const files = listNoteFiles(notesDir);
    const latest = files[0];
    const content = readNoteFile(notesDir, latest);
    expect(content).toContain('testtag');
  });
});

test.describe('FC-EDIT-05 / FC-EDIT-06: Scope guards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL);
    await page.waitForSelector('[data-testid="editor-layout"]', { timeout: 5000 });
  });

  test('No title input element exists in editor (RB-2)', async ({ page }) => {
    const titleInput = page.locator(
      'input[placeholder*="タイトル"], input[name="title"], [data-testid="title-input"]'
    );
    await expect(titleInput).toHaveCount(0);
  });

  test('No markdown preview/render element exists (RB-2)', async ({ page }) => {
    const preview = page.locator(
      '[data-testid="markdown-preview"], .markdown-preview, .markdown-rendered'
    );
    await expect(preview).toHaveCount(0);
  });
});
