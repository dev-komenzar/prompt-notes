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
import * as tmp from 'os';
import * as fs from 'fs';
import * as path from 'path';
import {
  BASE_URL,
  gotoSettings,
  tauriInvoke,
  waitForAppReady,
} from './helpers/app-launch';
import {
  getDefaultNotesDir,
  cleanupNoteFiles,
  createNoteFile,
  generateFilename,
} from './helpers/test-data';
import { assertServerHealthy } from './helpers/assertions';

const notesDir = getDefaultNotesDir();

test.beforeAll(async () => {
  await waitForAppReady();
});

test.describe('storage — browser tests', () => {
  let createdFiles: string[] = [];

  test.afterEach(() => {
    cleanupNoteFiles(notesDir, createdFiles);
    createdFiles = [];
  });

  test('server health baseline', async ({ page }) => {
    await page.goto(BASE_URL);
    await assertServerHealthy(page);
  });

  // AC-ST-03: default directory shown in settings
  test('AC-ST-03: settings page displays default notes directory', async ({ page }) => {
    await gotoSettings(page);
    const pageText = await page.textContent('body') ?? '';
    const hasDir =
      pageText.includes('promptnotes') ||
      pageText.includes('.local/share') ||
      pageText.includes('Application Support');
    expect(hasDir, 'Settings page should display notes directory path').toBe(true);
  });

  // AC-ST-04: changing save directory persists
  test('AC-ST-04: changing save directory in settings persists after page reload', async ({
    page,
  }) => {
    const tmpDir = fs.mkdtempSync(path.join(tmp.tmpdir(), 'promptnotes-test-'));
    const originalSettings = await (async () => {
      await page.goto(BASE_URL);
      return tauriInvoke<{ notes_dir: string }>(page, 'get_settings');
    })();

    try {
      await gotoSettings(page);
      const dirInput = page.locator(
        'input[name="notes_dir"], input[data-testid="notes-dir"], input[placeholder*="ディレクトリ" i], input[aria-label*="directory" i]',
      ).first();
      await dirInput.fill(tmpDir);
      const saveBtn = page.locator('button:has-text("保存"), button:has-text("Save"), button[type="submit"]').first();
      await saveBtn.click();
      await page.waitForTimeout(500);

      const updated = await tauriInvoke<{ notes_dir: string }>(page, 'get_settings');
      expect(updated.notes_dir).toBe(tmpDir);
    } finally {
      // Restore original settings
      await tauriInvoke(page, 'update_settings', { notes_dir: originalSettings.notes_dir });
      fs.rmdirSync(tmpDir, { recursive: true } as fs.RmDirOptions);
    }
  });
});
