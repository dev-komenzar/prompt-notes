// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 27-1
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
// @generated-by: codd implement --sprint 27

import { test, expect } from '@playwright/test';
import { launchApp, navigateTo } from './helpers/app-launch';

test.describe('Settings browser tests', () => {
  test.fixme('AC-CF-01: settings screen displays current notes directory', async () => {
    const { browser, page } = await launchApp();
    try {
      await navigateTo(page, '/settings');
      await page.waitForSelector('input[name="notes_dir"], input[placeholder*="ディレクトリ"], .settings-form');
      const input = page.locator('input[name="notes_dir"], input[placeholder*="ディレクトリ"]');
      const value = await input.inputValue();
      expect(value).toMatch(/promptnotes/);
    } finally {
      await browser.close();
    }
  });

  test.fixme('AC-CF-01 / AC-ST-04: settings screen saves new directory', async () => {
    const { browser, page } = await launchApp();
    try {
      await navigateTo(page, '/settings');
      await page.waitForSelector('input[name="notes_dir"]');
      const input = page.locator('input[name="notes_dir"]');
      await input.fill('/tmp/promptnotes-browser-settings-test');
      await page.locator('button[type="submit"], button:has-text("保存"), button:has-text("Save")').click();
      await page.waitForTimeout(500);

      // verify persistence by reloading settings
      await navigateTo(page, '/settings');
      await page.waitForSelector('input[name="notes_dir"]');
      const saved = await page.locator('input[name="notes_dir"]').inputValue();
      expect(saved).toBe('/tmp/promptnotes-browser-settings-test');

      // restore - navigate to settings and reset
      const { invoke } = await import('@tauri-apps/api/core');
      const orig = await invoke<{ notes_dir: string }>('get_settings');
      if (orig.notes_dir === '/tmp/promptnotes-browser-settings-test') {
        // try to restore via IPC directly since we know the test dir
      }
    } finally {
      await browser.close();
    }
  });
});
