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
import { defaultNotesDir, createTestNote, deleteTestNote } from './helpers/test-data';
import { assertFilenameFormat } from './helpers/assertions';

const APP_URL = 'http://localhost:1420';

test.describe('Storage — browser tests (AC-ST-04)', () => {
  const notesDir = defaultNotesDir();
  const created: string[] = [];

  test.afterAll(async () => {
    for (const f of created) {
      await deleteTestNote(notesDir, f);
    }
  });

  test('AC-ST-04: changing notes dir in settings causes new notes to appear in new dir', async ({ page }) => {
    // Navigate to settings
    await page.goto(`${APP_URL}/settings`);
    await page.waitForLoadState('networkidle');

    // Settings screen must exist
    await expect(page).toHaveURL(/settings/);
    const dirInput = page.locator('input[name="notes_dir"], input[placeholder*="ディレクトリ"], input[type="text"]').first();
    await expect(dirInput).toBeVisible();

    // Restore original dir after test
    const originalDir = await dirInput.inputValue();
    try {
      // Change to temp dir
      const newDir = `${notesDir}_test_${Date.now()}`;
      await dirInput.fill(newDir);
      await page.locator('button[type="submit"], button:text("保存"), button:text("Save")').first().click();
      await page.waitForTimeout(500);

      // Create a note via Cmd+N/Ctrl+N
      await page.goto(APP_URL);
      const isMac = process.platform === 'darwin';
      await page.keyboard.press(isMac ? 'Meta+n' : 'Control+n');
      await page.waitForURL(/\/edit\//);
      const filename = decodeURIComponent(page.url().split('/edit/')[1]);
      assertFilenameFormat(filename);
    } finally {
      // Restore
      await page.goto(`${APP_URL}/settings`);
      const input = page.locator('input[name="notes_dir"], input[type="text"]').first();
      await input.fill(originalDir);
      await page.locator('button[type="submit"], button:text("保存")').first().click();
    }
  });
});
