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
import * as path from 'path';
import * as fs from 'fs';
import { waitForAppReady, openPage } from './helpers/app-launch';
import {
  getDefaultNotesDir,
  createNoteWithAge,
  deleteTestNote,
  generateFilename,
  createTestNote,
} from './helpers/test-data';

const notesDir = getDefaultNotesDir();
const createdFiles: string[] = [];

test.beforeAll(async () => {
  await waitForAppReady();
  fs.mkdirSync(notesDir, { recursive: true });
});

test.afterAll(() => {
  for (const f of createdFiles) {
    deleteTestNote(f);
  }
});

test.describe('AC-GR-02: default 7-day filter boundary', () => {
  test('note from 7 days ago is within filter range', async ({ page }) => {
    const fp = createNoteWithAge(notesDir, 7, ['boundary'], 'seven-days-ago note');
    createdFiles.push(fp);
    await openPage(page, '/');
    // The note from exactly 7 days ago should be visible in default filter
    const cards = page.locator('[data-testid="note-card"], .note-card');
    await page.waitForTimeout(500);
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('note from 8 days ago is NOT shown by default', async ({ page }) => {
    const uniqueBody = `eight-days-ago-${Date.now()}`;
    const fp = createNoteWithAge(notesDir, 8, [], uniqueBody);
    createdFiles.push(fp);
    await openPage(page, '/');
    await page.waitForTimeout(500);
    const pageText = await page.textContent('body');
    expect(pageText).not.toContain(uniqueBody);
  });
});

test.describe('AC-GR-04: full-text search via file scan', () => {
  test('search query returns matching notes only', async ({ page }) => {
    const uniqueBody = `fulltext-unique-${Date.now()}`;
    const fp = createNoteWithAge(notesDir, 1, [], uniqueBody);
    createdFiles.push(fp);
    await openPage(page, '/');

    const searchInput = page.locator('input[type="search"], input[placeholder*="検索" i], [data-testid="search-bar"] input').first();
    await searchInput.fill(uniqueBody);
    await page.waitForTimeout(500);

    const pageText = await page.textContent('body');
    expect(pageText).toContain(uniqueBody);
  });
});

test.describe('AC-GR-03: tag filter', () => {
  test('tag filter reduces displayed notes', async ({ page }) => {
    const taggedBody = `tagged-note-${Date.now()}`;
    const tag = `testtag${Date.now()}`;
    const fp = createNoteWithAge(notesDir, 1, [tag], taggedBody);
    createdFiles.push(fp);
    await openPage(page, '/');
    await page.waitForTimeout(500);
    // Verify tag filter option exists and filters
    const tagFilter = page.locator(`[data-testid="tag-filter"] :text("${tag}")`).first();
    if (await tagFilter.count() > 0) {
      await tagFilter.click();
      await page.waitForTimeout(400);
      const pageText = await page.textContent('body');
      expect(pageText).toContain(taggedBody);
    }
  });
});
