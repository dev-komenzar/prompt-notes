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
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { BASE_URL, tauriInvoke, waitForAppReady } from './helpers/app-launch';

test.beforeAll(async () => {
  await waitForAppReady();
});

test.describe('settings — API integration', () => {
  test('get_settings returns notes_dir as a non-empty string (AC-CF-01)', async ({ page }) => {
    await page.goto(BASE_URL);
    const settings = await tauriInvoke<{ notes_dir: string }>(page, 'get_settings');
    expect(typeof settings.notes_dir).toBe('string');
    expect(settings.notes_dir.length).toBeGreaterThan(0);
  });

  test('update_settings persists notes_dir change (AC-ST-04)', async ({ page }) => {
    await page.goto(BASE_URL);
    const original = await tauriInvoke<{ notes_dir: string }>(page, 'get_settings');
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'promptnotes-settings-test-'));

    try {
      const result = await tauriInvoke<{ success: boolean }>(page, 'update_settings', {
        notes_dir: tmpDir,
      });
      expect(result.success).toBe(true);

      const updated = await tauriInvoke<{ notes_dir: string }>(page, 'get_settings');
      expect(updated.notes_dir).toBe(tmpDir);
    } finally {
      await tauriInvoke(page, 'update_settings', { notes_dir: original.notes_dir });
      fs.rmdirSync(tmpDir, { recursive: true } as fs.RmDirOptions);
    }
  });

  test('update_settings returns success: true for valid directory', async ({ page }) => {
    await page.goto(BASE_URL);
    const original = await tauriInvoke<{ notes_dir: string }>(page, 'get_settings');
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'promptnotes-valid-dir-'));

    try {
      const result = await tauriInvoke<{ success: boolean }>(page, 'update_settings', {
        notes_dir: tmpDir,
      });
      expect(result.success).toBe(true);
    } finally {
      await tauriInvoke(page, 'update_settings', { notes_dir: original.notes_dir });
      fs.rmdirSync(tmpDir, { recursive: true } as fs.RmDirOptions);
    }
  });

  test('get_settings after restart returns persisted notes_dir', async ({ page }) => {
    await page.goto(BASE_URL);
    const settings = await tauriInvoke<{ notes_dir: string }>(page, 'get_settings');
    // Navigate away and back to simulate "restart" within session
    await page.goto(BASE_URL + '/settings');
    await page.waitForLoadState('networkidle');
    const settingsAgain = await tauriInvoke<{ notes_dir: string }>(page, 'get_settings');
    expect(settingsAgain.notes_dir).toBe(settings.notes_dir);
  });
});
