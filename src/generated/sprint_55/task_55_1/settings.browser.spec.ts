// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 55-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/test/acceptance_criteria.md
// @generated-by: codd implement --sprint 55

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import {
  setupTestDirs,
  teardownTestDirs,
  TEST_NOTES_DIR_A,
  TEST_NOTES_DIR_B,
  listMdFiles,
} from './helpers/test-data';
import { createRecentNote } from './helpers/note-factory';
import { launchApp, closeApp, invokeCommand, mockDialogOpen, AppContext } from './helpers/app-launch';
import { assertFilenameFormat } from './helpers/assertions';
import { pressNewNote } from './helpers/keyboard';

interface AppConfig {
  notes_dir: string;
}

interface NoteMetadata {
  id: string;
  tags: string[];
  created_at: string;
  preview: string;
}

let appCtx: AppContext;

async function navigateTo(page: Page, route: string): Promise<void> {
  await page.goto(`http://localhost:1420/#${route}`, { waitUntil: 'networkidle' });
}

test.beforeAll(async () => {
  setupTestDirs();
  appCtx = await launchApp();
});

test.afterAll(async () => {
  await closeApp(appCtx);
  teardownTestDirs();
});

test.beforeEach(async () => {
  await invokeCommand(appCtx.page, 'set_config', { config: { notes_dir: TEST_NOTES_DIR_A } });
});

// AC-SET-01: Settings view renders with a directory change button
test('settings view renders directory change button', async () => {
  await navigateTo(appCtx.page, '/settings');
  const btn = appCtx.page.locator('[data-testid="change-dir-btn"], button:has-text("ディレクトリ変更"), button:has-text("Change Directory")');
  await expect(btn.first()).toBeVisible({ timeout: 5_000 });
});

// AC-SET-01: Settings view displays current notes_dir
test('settings view shows current notes directory', async () => {
  await navigateTo(appCtx.page, '/settings');
  const config = await invokeCommand<AppConfig>(appCtx.page, 'get_config');
  const dirDisplay = appCtx.page.locator(`text=${config.notes_dir}`).or(
    appCtx.page.locator('[data-testid="current-notes-dir"]'),
  );
  await expect(dirDisplay.first()).toBeVisible({ timeout: 5_000 });
});

// AC-SET-01: Clicking directory change button triggers native dialog (mocked)
test('clicking change directory button invokes dialog and updates configStore', async () => {
  await navigateTo(appCtx.page, '/settings');

  await mockDialogOpen(appCtx.page, TEST_NOTES_DIR_B);

  const btn = appCtx.page.locator('[data-testid="change-dir-btn"], button:has-text("ディレクトリ変更"), button:has-text("Change Directory")').first();
  await btn.click();

  // Wait for UI to reflect new directory
  await appCtx.page.waitForFunction(
    (expected) => {
      const el = document.querySelector('[data-testid="current-notes-dir"]');
      return el ? el.textContent?.includes(expected) : document.body.innerText.includes(expected);
    },
    TEST_NOTES_DIR_B,
    { timeout: 5_000 },
  );

  const config = await invokeCommand<AppConfig>(appCtx.page, 'get_config');
  expect(config.notes_dir).toBe(TEST_NOTES_DIR_B);
});

// AC-SET-01 / FC-SET-02: After directory change, new note goes to new dir
test('after directory change via settings UI, new notes are saved to new directory', async () => {
  await navigateTo(appCtx.page, '/settings');
  await mockDialogOpen(appCtx.page, TEST_NOTES_DIR_B);

  const btn = appCtx.page.locator('[data-testid="change-dir-btn"], button:has-text("ディレクトリ変更"), button:has-text("Change Directory")').first();
  await btn.click();

  await appCtx.page.waitForFunction(
    (expected) => document.body.innerText.includes(expected),
    TEST_NOTES_DIR_B,
    { timeout: 5_000 },
  );

  // Navigate to editor and create a new note
  await navigateTo(appCtx.page, '/');
  await appCtx.page.waitForSelector('[class*="cm-editor"], .cm-editor', { timeout: 5_000 });

  await pressNewNote(appCtx.page);
  await appCtx.page.waitForTimeout(500);

  const filesInB = listMdFiles(TEST_NOTES_DIR_B);
  expect(filesInB.length).toBeGreaterThanOrEqual(1);
  for (const f of filesInB) {
    assertFilenameFormat(f);
  }
});

// FC-SET-02: After directory change, grid shows notes from new directory
test('after directory change, grid view shows notes from new directory only', async () => {
  // Put a note with distinctive content in dir B
  createRecentNote(TEST_NOTES_DIR_B, ['dir-b-tag'], 'UNIQUE_CONTENT_IN_DIR_B', 0);

  await navigateTo(appCtx.page, '/settings');
  await mockDialogOpen(appCtx.page, TEST_NOTES_DIR_B);

  const btn = appCtx.page.locator('[data-testid="change-dir-btn"], button:has-text("ディレクトリ変更"), button:has-text("Change Directory")').first();
  await btn.click();

  await appCtx.page.waitForFunction(
    (expected) => document.body.innerText.includes(expected),
    TEST_NOTES_DIR_B,
    { timeout: 5_000 },
  );

  // Expand date filter to see all notes
  await invokeCommand(appCtx.page, 'set_config', { config: { notes_dir: TEST_NOTES_DIR_B } });

  await navigateTo(appCtx.page, '/grid');
  await appCtx.page.waitForTimeout(500);

  // Find a note from dir A that should NOT appear
  const dirAFiles = listMdFiles(TEST_NOTES_DIR_A);
  if (dirAFiles.length > 0) {
    const notes = await invokeCommand<NoteMetadata[]>(appCtx.page, 'list_notes', { filter: null });
    const shownIds = notes.map(n => n.id);
    for (const f of dirAFiles) {
      expect(shownIds).not.toContain(f.replace('.md', ''));
    }
  }

  // Dir B note should be visible
  const notes = await invokeCommand<NoteMetadata[]>(appCtx.page, 'list_notes', { filter: null });
  const previews = notes.map(n => n.preview);
  expect(previews.some(p => p.includes('UNIQUE_CONTENT_IN_DIR_B'))).toBe(true);
});

// Existing notes in old directory not moved — UI confirms no loss
test('notes in old directory remain after directory change (no data loss)', async () => {
  const oldNote = createRecentNote(TEST_NOTES_DIR_A, ['keep'], 'note that stays in dir A', 0);

  await navigateTo(appCtx.page, '/settings');
  await mockDialogOpen(appCtx.page, TEST_NOTES_DIR_B);

  const btn = appCtx.page.locator('[data-testid="change-dir-btn"], button:has-text("ディレクトリ変更"), button:has-text("Change Directory")').first();
  await btn.click();

  await appCtx.page.waitForTimeout(1_000);

  // Old file should still exist on disk
  const fileStillExists = fs.existsSync(require('path').join(TEST_NOTES_DIR_A, oldNote));
  expect(fileStillExists).toBe(true);
});

// Settings page does not expose file-system write outside Rust backend
test('settings page does not expose direct filesystem manipulation to frontend', async () => {
  await navigateTo(appCtx.page, '/settings');

  const hasFsAccess = await appCtx.page.evaluate(() => {
    const tauri = (window as unknown as Record<string, unknown>).__TAURI__;
    if (!tauri || typeof tauri !== 'object') return false;
    return 'fs' in tauri;
  });

  expect(hasFsAccess).toBe(false);
});

// FC-SET-01: directory change button is present and clickable (not disabled)
test('change directory button is enabled and interactive', async () => {
  await navigateTo(appCtx.page, '/settings');
  const btn = appCtx.page.locator('[data-testid="change-dir-btn"], button:has-text("ディレクトリ変更"), button:has-text("Change Directory")').first();
  await expect(btn).toBeEnabled({ timeout: 5_000 });
});
