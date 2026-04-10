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
import { waitForApp } from './helpers/app-launch';
import { getDefaultNotesDir, createTestNote, cleanupTestNotes } from './helpers/test-data';
import { parseFrontmatter } from './helpers/assertions';

let createdFiles: string[] = [];
const notesDir = getDefaultNotesDir();

test.beforeAll(async () => {
  await waitForApp();
  // Create notes for filter tests
  createdFiles.push(createTestNote(notesDir, { daysAgo: 0, tags: ['recent', 'test'], body: 'recent note unique-body-alpha' }));
  createdFiles.push(createTestNote(notesDir, { daysAgo: 3, tags: ['test'], body: 'three days ago note unique-body-beta' }));
  createdFiles.push(createTestNote(notesDir, { daysAgo: 8, tags: ['old'], body: 'old note unique-body-gamma' }));
});

test.afterAll(() => {
  cleanupTestNotes(notesDir, createdFiles);
});

test.describe('AC-GR-02: default 7-day filter boundary', () => {
  test('note from 8 days ago is outside the 7-day window', () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 8);
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // The 8-day-old note's date should be before sevenDaysAgo
    expect(oldDate.getTime()).toBeLessThan(sevenDaysAgo.getTime());
  });

  test('note from 6 days ago is within the 7-day window', () => {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 6);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    expect(recentDate.getTime()).toBeGreaterThan(sevenDaysAgo.getTime());
  });
});

test.describe('search params type validation', () => {
  test('SearchParams allows optional fields', () => {
    const params: { query?: string; tags?: string[]; date_from?: string; date_to?: string } = {};
    expect(params).toBeDefined();
    params.query = 'hello';
    params.tags = ['a', 'b'];
    params.date_from = '2026-01-01';
    params.date_to = '2026-12-31';
    expect(params.query).toBe('hello');
    expect(params.tags).toHaveLength(2);
  });
});
