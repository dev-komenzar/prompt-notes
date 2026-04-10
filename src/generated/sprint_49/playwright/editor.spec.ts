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
import { BASE_URL, gotoEditor, tauriInvoke, waitForAppReady } from './helpers/app-launch';
import {
  getDefaultNotesDir,
  listNoteFiles,
  readNoteFile,
  cleanupNoteFiles,
  generateFilename,
} from './helpers/test-data';
import { assertFilenameFormat, assertFrontmatterTagsOnly } from './helpers/assertions';

const notesDir = getDefaultNotesDir();

test.beforeAll(async () => {
  await waitForAppReady();
});

test.describe('editor — API integration', () => {
  let createdFiles: string[] = [];

  test.afterEach(() => {
    cleanupNoteFiles(notesDir, createdFiles);
    createdFiles = [];
  });

  test('create_note returns filename matching YYYY-MM-DDTHHMMSS.md (AC-ST-01)', async ({ page }) => {
    await page.goto(BASE_URL);
    const result = await tauriInvoke<{ filename: string }>(page, 'create_note');
    assertFilenameFormat(result.filename);
    createdFiles.push(result.filename);
  });

  test('create_note creates an .md file on disk (AC-ED-06)', async ({ page }) => {
    await page.goto(BASE_URL);
    const before = listNoteFiles(notesDir).length;
    const result = await tauriInvoke<{ filename: string }>(page, 'create_note');
    createdFiles.push(result.filename);
    const after = listNoteFiles(notesDir);
    expect(after.length).toBe(before + 1);
    expect(after).toContain(result.filename);
  });

  test('save_note persists frontmatter and body (AC-ST-02)', async ({ page }) => {
    await page.goto(BASE_URL);
    const created = await tauriInvoke<{ filename: string }>(page, 'create_note');
    createdFiles.push(created.filename);

    await tauriInvoke(page, 'save_note', {
      filename: created.filename,
      frontmatter: { tags: ['test', 'e2e'] },
      body: 'Hello autosave world',
    });

    const { frontmatter, body } = readNoteFile(notesDir, created.filename);
    assertFrontmatterTagsOnly(frontmatter);
    expect(frontmatter).toContain('tags:');
    expect(body).toContain('Hello autosave world');
  });

  test('frontmatter contains only tags key — no extra fields (FC-ST-03)', async ({ page }) => {
    await page.goto(BASE_URL);
    const created = await tauriInvoke<{ filename: string }>(page, 'create_note');
    createdFiles.push(created.filename);
    await tauriInvoke(page, 'save_note', {
      filename: created.filename,
      frontmatter: { tags: ['only-tags'] },
      body: 'body',
    });
    const { frontmatter } = readNoteFile(notesDir, created.filename);
    assertFrontmatterTagsOnly(frontmatter);
  });

  test('read_note returns frontmatter and body (AC-ST-02)', async ({ page }) => {
    await page.goto(BASE_URL);
    const created = await tauriInvoke<{ filename: string }>(page, 'create_note');
    createdFiles.push(created.filename);
    await tauriInvoke(page, 'save_note', {
      filename: created.filename,
      frontmatter: { tags: ['read-test'] },
      body: 'read note body',
    });

    const result = await tauriInvoke<{ frontmatter: { tags: string[] }; body: string }>(
      page,
      'read_note',
      { filename: created.filename },
    );
    expect(result.frontmatter.tags).toContain('read-test');
    expect(result.body).toContain('read note body');
  });

  test('delete_note removes the file from disk', async ({ page }) => {
    await page.goto(BASE_URL);
    const created = await tauriInvoke<{ filename: string }>(page, 'create_note');
    // Do not add to createdFiles since we're deleting manually
    await tauriInvoke(page, 'delete_note', { filename: created.filename });
    const files = listNoteFiles(notesDir);
    expect(files).not.toContain(created.filename);
  });

  test('list_notes returns notes sorted by created_at descending', async ({ page }) => {
    await page.goto(BASE_URL);
    const a = await tauriInvoke<{ filename: string }>(page, 'create_note');
    createdFiles.push(a.filename);
    await page.waitForTimeout(1100); // ensure different second
    const b = await tauriInvoke<{ filename: string }>(page, 'create_note');
    createdFiles.push(b.filename);

    const result = await tauriInvoke<{ notes: Array<{ filename: string; created_at: string }> }>(
      page,
      'list_notes',
      { days: 1 },
    );
    const filenames = result.notes.map((n) => n.filename);
    const idxA = filenames.indexOf(a.filename);
    const idxB = filenames.indexOf(b.filename);
    expect(idxB).toBeLessThan(idxA); // b is newer, should appear first
  });

  test('search_notes filters by query string', async ({ page }) => {
    await page.goto(BASE_URL);
    const created = await tauriInvoke<{ filename: string }>(page, 'create_note');
    createdFiles.push(created.filename);
    const uniqueBody = `unique_search_token_${Date.now()}`;
    await tauriInvoke(page, 'save_note', {
      filename: created.filename,
      frontmatter: { tags: [] },
      body: uniqueBody,
    });

    const result = await tauriInvoke<{ notes: Array<{ filename: string }> }>(
      page,
      'search_notes',
      { query: uniqueBody },
    );
    expect(result.notes.map((n) => n.filename)).toContain(created.filename);
  });

  test('get_settings returns notes_dir (AC-ST-03)', async ({ page }) => {
    await page.goto(BASE_URL);
    const result = await tauriInvoke<{ notes_dir: string }>(page, 'get_settings');
    expect(typeof result.notes_dir).toBe('string');
    expect(result.notes_dir.length).toBeGreaterThan(0);
  });
});
