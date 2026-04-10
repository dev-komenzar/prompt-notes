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
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { waitForAppReady, APP_URL, invokeTauriCommand } from './helpers/app-launch';

test.describe('settings – browser tests', () => {
  let originalNotesDir: string;

  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
    const settings = await invokeTauriCommand<{ notes_dir: string }>(page, 'get_settings');
    originalNotesDir = settings.notes_dir;
  });

  test.afterEach(async ({ page }) => {
    await invokeTauriCommand(page, 'update_settings', { notes_dir: originalNotesDir });
  });

  // AC-CF-01: settings page renders and shows directory input
  test('AC-CF-01: settings page renders with directory change input', async ({ page }) => {
    const response = await page.goto(`${APP_URL}/settings`);
    expect(response?.status() ?? 200, '/settings must not return 5xx').toBeLessThan(500);

    const dirInput = page.locator(
      'input[type="text"][name*="dir"], input[aria-label*="directory" i], input[aria-label*="ディレクトリ"], input[placeholder*="dir" i]'
    );
    await expect(dirInput, 'Directory input must be visible on settings page').toBeVisible();
  });

  // AC-CF-01: save button exists
  test('AC-CF-01: settings page has a save/apply button', async ({ page }) => {
    await page.goto(`${APP_URL}/settings`);
    const saveBtn = page.locator('button[type="submit"], button:has-text("保存"), button:has-text("Save"), button:has-text("Apply")');
    await expect(saveBtn, 'Save button must exist on settings page').toBeVisible();
  });

  // AC-ST-04: changing directory in UI updates settings
  test('AC-ST-04: changing directory via settings UI persists the change', async ({ page }) => {
    const tmpDir = path.join(os.tmpdir(), `promptnotes-ui-test-${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });

    try {
      await page.goto(`${APP_URL}/settings`);
      const dirInput = page.locator(
        'input[type="text"][name*="dir"], input[aria-label*="directory" i], input[aria-label*="ディレクトリ"]'
      ).first();
      await dirInput.fill(tmpDir);

      const saveBtn = page.locator('button[type="submit"], button:has-text("保存"), button:has-text("Save"), button:has-text("Apply")').first();
      await saveBtn.click();
      await page.waitForTimeout(500);

      const settings = await invokeTauriCommand<{ notes_dir: string }>(page, 'get_settings');
      expect(settings.notes_dir, 'Updated directory must be persisted').toBe(tmpDir);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  // Settings page is reachable from main nav
  test('settings icon / nav link is accessible from grid view', async ({ page }) => {
    await page.goto(APP_URL);
    const settingsNav = page.locator('a[href="/settings"], [aria-label*="settings" i], [aria-label*="設定"]');
    await expect(settingsNav, 'Settings navigation link must exist in grid view').toBeVisible();
    await settingsNav.click();
    await expect(page).toHaveURL(/\/settings/, { timeout: 5000 });
  });
});
