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
import { navigateToEditor, typeInEditor, waitForAutoSave } from './helpers/editor';
import { getDefaultNotesDir, daysAgoFilename, writeTestNote } from './helpers/test-data';
import * as path from 'path';
import * as fs from 'fs';

test.describe('storage – browser tests', () => {
  let notesDir: string;

  test.beforeEach(async ({ page }) => {
    notesDir = getDefaultNotesDir();
    await waitForAppReady(page);
  });

  // AC-ST-04: settings page allows changing notes directory
  test('AC-ST-04: settings page renders directory change input', async ({ page }) => {
    await page.goto(`${APP_URL}/settings`);
    await expect(page).not.toHaveURL(/5\d{2}/, { timeout: 3000 });
    const dirInput = page.locator('input[type="text"][name*="dir"], input[type="text"][aria-label*="directory" i], input[type="text"][aria-label*="ディレクトリ"]');
    await expect(dirInput, 'Directory input must exist on settings page').toBeVisible();
  });

  // AC-ST-01 via browser: creating note navigates to correct YYYY-MM-DDTHHMMSS.md URL
  test('AC-ST-01: new note URL matches YYYY-MM-DDTHHMMSS.md pattern', async ({ page }) => {
    await page.goto(`${APP_URL}/new`);
    await expect(page).toHaveURL(/\/edit\/\d{4}-\d{2}-\d{2}T\d{6}\.md/, { timeout: 8000 });

    const url = page.url();
    const filenameMatch = url.match(/\/edit\/(.+)$/);
    if (filenameMatch) {
      await invokeTauriCommand(page, 'delete_note', { filename: decodeURIComponent(filenameMatch[1]) });
    }
  });

  // AC-ED-06 / FC-ST-02: auto-save persists without manual save action
  test('FC-ST-02: auto-save must work without manual save (no Ctrl+S needed)', async ({ page }) => {
    const { filename } = await invokeTauriCommand<{ filename: string }>(page, 'create_note');
    await navigateToEditor(page, filename);

    const marker = `AutoSaveMarker_${Date.now()}`;
    await typeInEditor(page, marker);
    await waitForAutoSave(page, 1500);

    const filePath = path.join(notesDir, filename);
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content, 'Auto-save must persist text to disk').toContain(marker);

    await invokeTauriCommand(page, 'delete_note', { filename });
  });

  // Default notes directory is auto-created on first note creation
  test('default notes directory is created automatically', async ({ page }) => {
    const before = fs.existsSync(notesDir);
    const { filename } = await invokeTauriCommand<{ filename: string }>(page, 'create_note');
    expect(fs.existsSync(notesDir), 'Notes directory must be auto-created').toBe(true);
    await invokeTauriCommand(page, 'delete_note', { filename });
  });
});
