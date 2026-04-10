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
import { BASE_URL, tauriInvoke, waitForAppReady } from './helpers/app-launch';
import {
  getDefaultNotesDir,
  createNoteFile,
  cleanupNoteFiles,
  generateFilenameForDaysAgo,
  generateFilename,
} from './helpers/test-data';

const notesDir = getDefaultNotesDir();

test.beforeAll(async () => {
  await waitForAppReady();
});

test.describe('grid — API integration', () => {
  let createdFiles: string[] = [];

  test.afterEach(() => {
    cleanupNoteFiles(notesDir, createdFiles);
    createdFiles = [];
  });

  // AC-GR-02: default 7-day filter — IPC level
  test('AC-GR-02: list_notes days=7 returns notes from the last 7 days', async ({ page }) => {
    await page.goto(BASE_URL);
    const recentFilename = generateFilename();
    createNoteFile(notesDir, recentFilename, [], 'recent note body');
    createdFiles.push(recentFilename);

    const result = await tauriInvoke<{ notes: Array<{ filename: string }> }>(
      page,
      'list_notes',
      { days: 7 },
    );
    expect(result.notes.map((n) => n.filename)).toContain(recentFilename);
  });

  // AC-GR-02 boundary: note from exactly 7 days ago is included
  test('AC-GR-02 boundary: note 7 days ago is included in list_notes days=7', async ({ page }) => {
    await page.goto(BASE_URL);
    const sevenDaysAgo = generateFilenameForDaysAgo(7);
    createNoteFile(notesDir, sevenDaysAgo, [], '7 days ago note');
    createdFiles.push(sevenDaysAgo);

    const result = await tauriInvoke<{ notes: Array<{ filename: string }> }>(
      page,
      'list_notes',
      { days: 7 },
    );
    expect(result.notes.map((n) => n.filename)).toContain(sevenDaysAgo);
  });

  // AC-GR-02 boundary: note from 8 days ago is excluded
  test('AC-GR-02 boundary: note 8 days ago is excluded from list_notes days=7', async ({
    page,
  }) => {
    await page.goto(BASE_URL);
    const eightDaysAgo = generateFilenameForDaysAgo(8);
    createNoteFile(notesDir, eightDaysAgo, [], '8 days ago note');
    createdFiles.push(eightDaysAgo);

    const result = await tauriInvoke<{ notes: Array<{ filename: string }> }>(
      page,
      'list_notes',
      { days: 7 },
    );
    expect(result.notes.map((n) => n.filename)).not.toContain(eightDaysAgo);
  });

  // AC-GR-03: tag filter
  test('AC-GR-03: search_notes filters by tag', async ({ page }) => {
    await page.goto(BASE_URL);
    const taggedFile = generateFilename();
    const untaggedFile = generateFilename(new Date(Date.now() + 1000));
    createNoteFile(notesDir, taggedFile, ['unique-tag-xyz'], 'tagged note body');
    createNoteFile(notesDir, untaggedFile, ['other-tag'], 'untagged note body');
    createdFiles.push(taggedFile, untaggedFile);

    const result = await tauriInvoke<{ notes: Array<{ filename: string }> }>(
      page,
      'search_notes',
      { tags: ['unique-tag-xyz'] },
    );
    const filenames = result.notes.map((n) => n.filename);
    expect(filenames).toContain(taggedFile);
    expect(filenames).not.toContain(untaggedFile);
  });

  // AC-GR-03: date filter
  test('AC-GR-03: search_notes filters by date_from / date_to', async ({ page }) => {
    await page.goto(BASE_URL);
    const todayFile = generateFilename();
    const oldFile = generateFilenameForDaysAgo(10);
    createNoteFile(notesDir, todayFile, [], 'today note');
    createNoteFile(notesDir, oldFile, [], 'old note');
    createdFiles.push(todayFile, oldFile);

    const today = new Date().toISOString().slice(0, 10);
    const result = await tauriInvoke<{ notes: Array<{ filename: string }> }>(
      page,
      'search_notes',
      { date_from: today, date_to: today },
    );
    const filenames = result.notes.map((n) => n.filename);
    expect(filenames).toContain(todayFile);
    expect(filenames).not.toContain(oldFile);
  });

  // AC-GR-04: full-text search
  test('AC-GR-04: search_notes full-text search returns matching note', async ({ page }) => {
    await page.goto(BASE_URL);
    const token = `grid_search_token_${Date.now()}`;
    const matchingFile = generateFilename();
    const nonMatchingFile = generateFilename(new Date(Date.now() + 1000));
    createNoteFile(notesDir, matchingFile, [], `Contains ${token} in body`);
    createNoteFile(notesDir, nonMatchingFile, [], 'Does not match anything');
    createdFiles.push(matchingFile, nonMatchingFile);

    const result = await tauriInvoke<{ notes: Array<{ filename: string }> }>(
      page,
      'search_notes',
      { query: token },
    );
    const filenames = result.notes.map((n) => n.filename);
    expect(filenames).toContain(matchingFile);
    expect(filenames).not.toContain(nonMatchingFile);
  });

  // NoteMetadata has expected shape
  test('NoteMetadata includes filename, tags, created_at, body_preview', async ({ page }) => {
    await page.goto(BASE_URL);
    const result = await tauriInvoke<{ filename: string }>(page, 'create_note');
    createdFiles.push(result.filename);
    await tauriInvoke(page, 'save_note', {
      filename: result.filename,
      frontmatter: { tags: ['meta-test'] },
      body: 'metadata body preview',
    });

    const list = await tauriInvoke<{ notes: Array<Record<string, unknown>> }>(
      page,
      'list_notes',
      { days: 1 },
    );
    const note = list.notes.find((n) => n.filename === result.filename);
    expect(note).toBeDefined();
    expect(typeof note!.filename).toBe('string');
    expect(Array.isArray(note!.tags)).toBe(true);
    expect(typeof note!.created_at).toBe('string');
    expect(typeof note!.body_preview).toBe('string');
  });
});
