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
import { getDefaultNotesDir, listNoteFiles, FILENAME_REGEX, createTestNote, cleanupTestNotes } from './helpers/test-data';
import { assertFilenameFormat } from './helpers/assertions';
import { pressNewNote } from './helpers/editor';

test.beforeAll(async () => {
  await waitForApp();
});

test.describe('AC-ST-01: filename format via browser new-note flow', () => {
  test('creating note via Cmd+N / Ctrl+N produces YYYY-MM-DDTHHMMSS.md filename', async ({ page }) => {
    await navigateTo(page, '/');
    const notesDir = getDefaultNotesDir();
    const before = new Set(listNoteFiles(notesDir));

    await pressNewNote(page);
    await page.waitForURL(/\/edit\//);

    const url = page.url();
    const filenameMatch = url.match(/\/edit\/([^/]+)$/);
    expect(filenameMatch).toBeTruthy();
    const filename = decodeURIComponent(filenameMatch![1]);
    assertFilenameFormat(filename);

    // File should exist on disk
    const after = listNoteFiles(notesDir);
    expect(after).toContain(filename);
  });
});

test.describe('AC-ST-04: changing notes directory in settings', () => {
  test.fixme('saving settings with custom directory persists and new notes go there', async ({ page }) => {
    // This test requires settings UI to be implemented
    await navigateTo(page, '/settings');
    const customDir = `/tmp/promptnotes-test-${Date.now()}`;
    const dirInput = page.locator('input[data-testid="notes-dir-input"], input[name="notes_dir"]');
    await dirInput.fill(customDir);
    const saveBtn = page.locator('button:has-text("保存"), button[type="submit"]');
    await saveBtn.click();
    await page.waitForTimeout(500);

    await pressNewNote(page);
    await page.waitForURL(/\/edit\//);

    const newFiles = listNoteFiles(customDir);
    expect(newFiles.length).toBeGreaterThan(0);
    cleanupTestNotes(customDir, newFiles);
  });
});
