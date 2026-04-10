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
import { waitForAppReady, invokeTauriCommand } from './helpers/app-launch';
import { getDefaultNotesDir, daysAgoFilename, writeTestNote, makeCleanup } from './helpers/test-data';

test.describe('grid – API integration', () => {
  let notesDir: string;

  test.beforeEach(async ({ page }) => {
    notesDir = getDefaultNotesDir();
    await waitForAppReady(page);
  });

  // AC-GR-02: default 7-day filter — 7-day-old note included, 8-day-old excluded
  test('AC-GR-02: list_notes days=7 includes note from 6 days ago but excludes 8 days ago', async ({ page }) => {
    const cleanup = makeCleanup(notesDir);
    const fn6 = daysAgoFilename(6);
    const fn8 = daysAgoFilename(8);
    writeTestNote(notesDir, fn6, ['recent'], 'Recent note body');
    writeTestNote(notesDir, fn8, ['old'], 'Old note body');
    cleanup.filenames.push(fn6, fn8);

    try {
      const { notes } = await invokeTauriCommand<{ notes: Array<{ filename: string }> }>(
        page, 'list_notes', { days: 7 }
      );
      const filenames = notes.map((n) => n.filename);
      expect(filenames, 'Note from 6 days ago must be included').toContain(fn6);
      expect(filenames, 'Note from 8 days ago must be excluded').not.toContain(fn8);
    } finally {
      cleanup.cleanup();
    }
  });

  // boundary: exactly 7 days ago (inclusive)
  test('AC-GR-02 boundary: note exactly 7 days ago is included in default filter', async ({ page }) => {
    const cleanup = makeCleanup(notesDir);
    const fn7 = daysAgoFilename(7);
    writeTestNote(notesDir, fn7, [], 'Boundary note');
    cleanup.filenames.push(fn7);

    try {
      const { notes } = await invokeTauriCommand<{ notes: Array<{ filename: string }> }>(
        page, 'list_notes', { days: 7 }
      );
      expect(notes.map((n) => n.filename), '7-day-old note must be included').toContain(fn7);
    } finally {
      cleanup.cleanup();
    }
  });

  // AC-GR-03: tag filter returns only matching notes
  test('AC-GR-03: search_notes with tags filters correctly', async ({ page }) => {
    const cleanup = makeCleanup(notesDir);
    const fn1 = daysAgoFilename(1);
    const fn2 = daysAgoFilename(2);
    writeTestNote(notesDir, fn1, ['tag-alpha'], 'Has alpha tag');
    writeTestNote(notesDir, fn2, ['tag-beta'], 'Has beta tag only');
    cleanup.filenames.push(fn1, fn2);

    try {
      const { notes } = await invokeTauriCommand<{ notes: Array<{ filename: string }> }>(
        page, 'search_notes', { tags: ['tag-alpha'], days: 7 }
      );
      const filenames = notes.map((n) => n.filename);
      expect(filenames).toContain(fn1);
      expect(filenames).not.toContain(fn2);
    } finally {
      cleanup.cleanup();
    }
  });

  // AC-GR-03: date range filter
  test('AC-GR-03: search_notes with date_from/date_to filters by date range', async ({ page }) => {
    const cleanup = makeCleanup(notesDir);
    const fn3 = daysAgoFilename(3);
    const fn5 = daysAgoFilename(5);
    writeTestNote(notesDir, fn3, [], 'Three days ago');
    writeTestNote(notesDir, fn5, [], 'Five days ago');
    cleanup.filenames.push(fn3, fn5);

    const dateTo = new Date();
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - 4);

    try {
      const { notes } = await invokeTauriCommand<{ notes: Array<{ filename: string }> }>(
        page, 'search_notes', {
          date_from: dateFrom.toISOString().slice(0, 10),
          date_to: dateTo.toISOString().slice(0, 10),
        }
      );
      const filenames = notes.map((n) => n.filename);
      expect(filenames, 'Note from 3 days ago must be in range').toContain(fn3);
      expect(filenames, 'Note from 5 days ago must be outside range').not.toContain(fn5);
    } finally {
      cleanup.cleanup();
    }
  });

  // AC-GR-04: full-text search
  test('AC-GR-04: search_notes full-text search finds note by body content', async ({ page }) => {
    const cleanup = makeCleanup(notesDir);
    const uniqueQuery = `FullTextSearch_${Date.now()}`;
    const fn = daysAgoFilename(1);
    writeTestNote(notesDir, fn, [], `This body contains ${uniqueQuery} marker`);
    cleanup.filenames.push(fn);

    try {
      const { notes } = await invokeTauriCommand<{ notes: Array<{ filename: string }> }>(
        page, 'search_notes', { query: uniqueQuery, days: 7 }
      );
      expect(notes.map((n) => n.filename), 'Full-text match must return the note').toContain(fn);
    } finally {
      cleanup.cleanup();
    }
  });

  // Full-text search must be case-insensitive
  test('AC-GR-04: full-text search is case-insensitive', async ({ page }) => {
    const cleanup = makeCleanup(notesDir);
    const fn = daysAgoFilename(1);
    writeTestNote(notesDir, fn, [], 'The password is HelloWorld');
    cleanup.filenames.push(fn);

    try {
      const { notes } = await invokeTauriCommand<{ notes: Array<{ filename: string }> }>(
        page, 'search_notes', { query: 'helloworld', days: 7 }
      );
      expect(notes.map((n) => n.filename), 'Case-insensitive search must find the note').toContain(fn);
    } finally {
      cleanup.cleanup();
    }
  });

  // search_notes returns body_preview
  test('NoteMetadata includes non-empty body_preview', async ({ page }) => {
    const cleanup = makeCleanup(notesDir);
    const fn = daysAgoFilename(1);
    writeTestNote(notesDir, fn, [], 'Preview text for the card display');
    cleanup.filenames.push(fn);

    try {
      const { notes } = await invokeTauriCommand<{ notes: Array<{ filename: string; body_preview: string }> }>(
        page, 'list_notes', { days: 7 }
      );
      const found = notes.find((n) => n.filename === fn);
      expect(found, 'Note must appear in list').toBeTruthy();
      expect(found!.body_preview.length, 'body_preview must be non-empty').toBeGreaterThan(0);
    } finally {
      cleanup.cleanup();
    }
  });

  // FC-GR-03: search must NOT be missing (ensured by command existing)
  test('FC-GR-03: search_notes command is available', async ({ page }) => {
    const result = await invokeTauriCommand<{ notes: unknown[] }>(
      page, 'search_notes', { query: 'doesnotexist_xyz_' + Date.now() }
    );
    expect(Array.isArray(result.notes)).toBe(true);
  });
});
