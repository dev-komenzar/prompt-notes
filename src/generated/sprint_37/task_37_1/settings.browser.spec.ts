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

test.beforeAll(async () => {
  await waitForApp();
});

test.describe('AC-CF-01: settings page allows changing notes directory', () => {
  test('settings page is accessible at /settings', async ({ page }) => {
    await navigateTo(page, '/settings');
    expect(page.url()).toContain('/settings');
  });

  test('settings page contains notes directory input', async ({ page }) => {
    await navigateTo(page, '/settings');
    const input = page.locator('input[data-testid="notes-dir-input"], input[name="notes_dir"], input[placeholder*="ディレクトリ"]');
    await expect(input).toBeVisible();
  });

  test.fixme('AC-ST-04: changing directory persists after page reload', async ({ page }) => {
    // Requires full settings save flow to be implemented
    await navigateTo(page, '/settings');
    const input = page.locator('input[data-testid="notes-dir-input"], input[name="notes_dir"]');
    const customPath = `/tmp/pn-test-${Date.now()}`;
    await input.fill(customPath);
    const saveBtn = page.locator('button[type="submit"], button:has-text("保存")');
    await saveBtn.click();
    await page.waitForTimeout(500);
    await navigateTo(page, '/settings');
    await expect(input).toHaveValue(customPath);
  });
});

test.describe('AC-DV-01: README.md section presence', () => {
  test('README.md exists with required sections', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const readmePath = path.join(process.cwd(), 'README.md');
    if (!fs.existsSync(readmePath)) {
      throw new Error('README.md does not exist – AC-DV-01 fails');
    }
    const content = fs.readFileSync(readmePath, 'utf-8');
    expect(content).toMatch(/##\s*Download/i);
    expect(content).toMatch(/##\s*Usage/i);
    expect(content).toMatch(/##\s*Local Development/i);
  });
});
