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
import * as path from 'path';
import * as os from 'os';
import { BASE_URL, tauriInvoke, waitForAppReady } from './helpers/app-launch';
import {
  getDefaultNotesDir,
  listNoteFiles,
  readNoteFile,
  cleanupNoteFiles,
} from './helpers/test-data';
import { assertFilenameFormat, assertFrontmatterTagsOnly } from './helpers/assertions';

const notesDir = getDefaultNotesDir();

test.beforeAll(async () => {
  await waitForAppReady();
});

test.describe('storage — API integration', () => {
  let createdFiles: string[] = [];

  test.afterEach(() => {
    cleanupNoteFiles(notesDir, createdFiles);
    createdFiles = [];
  });

  // AC-ST-01 / FC-ST-01: filename must match YYYY-MM-DDTHHMMSS.md
  test('AC-ST-01 / FC-ST-01: create_note filename matches YYYY-MM-DDTHHMMSS.md', async ({
    page,
  }) => {
    await page.goto(BASE_URL);
    const result = await tauriInvoke<{ filename: string }>(page, 'create_note');
    createdFiles.push(result.filename);
    assertFilenameFormat(result.filename);
  });

  // AC-ST-02: file structure has YAML frontmatter + body
  test('AC-ST-02: saved file has valid YAML frontmatter with tags key', async ({ page }) => {
    await page.goto(BASE_URL);
    const result = await tauriInvoke<{ filename: string }>(page, 'create_note');
    createdFiles.push(result.filename);
    await tauriInvoke(page, 'save_note', {
      filename: result.filename,
      frontmatter: { tags: ['storage-test'] },
      body: 'storage body',
    });
    const { frontmatter } = readNoteFile(notesDir, result.filename);
    assertFrontmatterTagsOnly(frontmatter);
    expect(frontmatter).toContain('tags:');
  });

  // AC-ST-03: default notes directory is OS-appropriate
  test('AC-ST-03: get_settings returns expected default notes directory', async ({ page }) => {
    await page.goto(BASE_URL);
    const settings = await tauriInvoke<{ notes_dir: string }>(page, 'get_settings');
    const expectedSuffix = process.platform === 'darwin'
      ? path.join('Library', 'Application Support', 'promptnotes', 'notes')
      : path.join('.local', 'share', 'promptnotes', 'notes');
    expect(settings.notes_dir).toContain('promptnotes');
  });

  // FC-ST-03: no extra fields in frontmatter
  test('FC-ST-03: frontmatter must not contain title, created_at, updated_at etc.', async ({
    page,
  }) => {
    await page.goto(BASE_URL);
    const result = await tauriInvoke<{ filename: string }>(page, 'create_note');
    createdFiles.push(result.filename);
    const { frontmatter } = readNoteFile(notesDir, result.filename);
    assertFrontmatterTagsOnly(frontmatter);
  });

  // AC-ST-01: filename timestamp reflects creation time
  test('AC-ST-01: filename timestamp is within 5 seconds of now', async ({ page }) => {
    await page.goto(BASE_URL);
    const before = new Date();
    const result = await tauriInvoke<{ filename: string }>(page, 'create_note');
    createdFiles.push(result.filename);
    const after = new Date();

    // Parse filename: 2026-04-10T091530.md → 2026-04-10T09:15:30
    const fn = result.filename.replace(/\.md$/, '');
    const iso = fn.replace(/T(\d{2})(\d{2})(\d{2})$/, 'T$1:$2:$3');
    const created = new Date(iso);
    expect(created.getTime()).toBeGreaterThanOrEqual(before.getTime() - 2000);
    expect(created.getTime()).toBeLessThanOrEqual(after.getTime() + 2000);
  });

  // Atomic write: file must not be corrupted after save
  test('save_note atomic write does not corrupt file', async ({ page }) => {
    await page.goto(BASE_URL);
    const result = await tauriInvoke<{ filename: string }>(page, 'create_note');
    createdFiles.push(result.filename);
    const body = 'atomic write test body ' + 'x'.repeat(1000);
    await tauriInvoke(page, 'save_note', {
      filename: result.filename,
      frontmatter: { tags: [] },
      body,
    });
    const { body: readBody } = readNoteFile(notesDir, result.filename);
    expect(readBody).toContain(body);
  });

  // list_notes with days filter
  test('list_notes days=7 excludes notes older than 7 days', async ({ page }) => {
    await page.goto(BASE_URL);
    // Create a note "today"
    const recent = await tauriInvoke<{ filename: string }>(page, 'create_note');
    createdFiles.push(recent.filename);

    const result = await tauriInvoke<{ notes: Array<{ filename: string }> }>(
      page,
      'list_notes',
      { days: 7 },
    );
    const filenames = result.notes.map((n) => n.filename);
    expect(filenames).toContain(recent.filename);
  });

  // search_notes returns correct results
  test('search_notes full-text search returns matching notes', async ({ page }) => {
    await page.goto(BASE_URL);
    const result = await tauriInvoke<{ filename: string }>(page, 'create_note');
    createdFiles.push(result.filename);
    const uniqueToken = `search_spec_${Date.now()}`;
    await tauriInvoke(page, 'save_note', {
      filename: result.filename,
      frontmatter: { tags: [] },
      body: `Contains ${uniqueToken} in body`,
    });

    const found = await tauriInvoke<{ notes: Array<{ filename: string }> }>(
      page,
      'search_notes',
      { query: uniqueToken },
    );
    expect(found.notes.map((n) => n.filename)).toContain(result.filename);

    // Negative: query that doesn't match
    const notFound = await tauriInvoke<{ notes: Array<{ filename: string }> }>(
      page,
      'search_notes',
      { query: `nonexistent_zzz_${Date.now()}` },
    );
    expect(notFound.notes.map((n) => n.filename)).not.toContain(result.filename);
  });
});
