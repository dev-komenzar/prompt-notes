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
import { createTestNote, deleteTestNote } from './helpers/test-data';

test.describe('Storage browser tests', () => {
  test.fixme('AC-ST-04: settings screen allows changing notes directory', async () => {
    const { browser, page } = await launchApp();
    try {
      await navigateTo(page, '/settings');
      await page.waitForSelector('input[name="notes_dir"], input[placeholder*="ディレクトリ"]');
      const input = page.locator('input[name="notes_dir"], input[placeholder*="ディレクトリ"]');
      await input.fill('/tmp/promptnotes-custom-dir');
      await page.locator('button[type="submit"], button:has-text("保存")').click();
      await page.waitForTimeout(500);

      // verify persisted
      await navigateTo(page, '/settings');
      await page.waitForSelector('input[name="notes_dir"]');
      const value = await page.locator('input[name="notes_dir"]').inputValue();
      expect(value).toBe('/tmp/promptnotes-custom-dir');
    } finally {
      await browser.close();
    }
  });

  test.fixme('AC-ST-01: new note created in grid creates file with correct filename format', async () => {
    const { browser, page } = await launchApp();
    try {
      await navigateTo(page, '/');
      await page.waitForSelector('.masonry-grid, .note-card, .grid-view');
      const isMac = process.platform === 'darwin';
      const modifier = isMac ? 'Meta' : 'Control';
      await page.keyboard.press(`${modifier}+n`);
      await page.waitForURL(/\/edit\//);

      const filename = decodeURIComponent(page.url().split('/edit/')[1]);
      expect(/^\d{4}-\d{2}-\d{2}T\d{6}\.md$/.test(filename)).toBe(true);

      if (filename) await deleteTestNote(filename);
    } finally {
      await browser.close();
    }
  });
});
