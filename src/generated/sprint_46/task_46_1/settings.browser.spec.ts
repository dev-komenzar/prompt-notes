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

const APP_URL = 'http://localhost:1420';

test.describe('Settings screen — browser tests (AC-CF-01)', () => {
  test('AC-CF-01: settings screen is accessible and shows notes dir input', async ({ page }) => {
    await page.goto(`${APP_URL}/settings`);
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/settings/);

    const dirInput = page.locator('input[name="notes_dir"], input[placeholder*="ディレクトリ"], input[type="text"]').first();
    await expect(dirInput).toBeVisible();
  });

  test('AC-CF-01: settings change is persisted across navigation', async ({ page }) => {
    await page.goto(`${APP_URL}/settings`);
    await page.waitForLoadState('networkidle');

    const dirInput = page.locator('input[name="notes_dir"], input[type="text"]').first();
    const originalValue = await dirInput.inputValue();

    // Change value
    const testValue = originalValue + '_persist_test';
    await dirInput.fill(testValue);
    await page.locator('button[type="submit"], button:text("保存"), button:text("Save")').first().click();
    await page.waitForTimeout(500);

    // Navigate away and back
    await page.goto(APP_URL);
    await page.goto(`${APP_URL}/settings`);
    await page.waitForLoadState('networkidle');

    const afterInput = page.locator('input[name="notes_dir"], input[type="text"]').first();
    const afterValue = await afterInput.inputValue();
    expect(afterValue).toBe(testValue);

    // Restore original
    await afterInput.fill(originalValue);
    await page.locator('button[type="submit"], button:text("保存")').first().click();
  });
});
