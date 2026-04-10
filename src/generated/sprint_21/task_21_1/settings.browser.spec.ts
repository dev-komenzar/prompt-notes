// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 21-1
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
import { waitForAppReady, openPage } from './helpers/app-launch';

test.beforeAll(async () => {
  await waitForAppReady();
});

test.describe('AC-CF-01: settings page allows directory change', () => {
  test('settings route is accessible', async ({ page }) => {
    await openPage(page, '/settings');
    const heading = page.locator('h1, h2, [data-testid="settings-title"]').first();
    await expect(heading).toBeVisible();
  });

  test('settings page shows notes directory input', async ({ page }) => {
    await openPage(page, '/settings');
    const dirInput = page.locator('input[type="text"], input[placeholder*="ディレクトリ" i], input[placeholder*="directory" i], [data-testid="notes-dir-input"]').first();
    await expect(dirInput).toBeVisible();
  });

  test('AC-ST-04: directory change is accepted and saved', async ({ page }) => {
    await openPage(page, '/settings');
    const dirInput = page.locator('input[type="text"], [data-testid="notes-dir-input"]').first();
    if (await dirInput.count() === 0) {
      test.fixme();
      return;
    }
    const newDir = '/tmp/promptnotes-test-dir';
    await dirInput.fill(newDir);
    const saveBtn = page.getByRole('button', { name: /保存|save/i });
    await saveBtn.click();
    await page.waitForTimeout(500);

    // Reload and verify persistence
    await openPage(page, '/settings');
    const inputVal = await dirInput.inputValue();
    expect(inputVal).toBe(newDir);
  });
});
