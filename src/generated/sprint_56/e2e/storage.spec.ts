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
import * as path from 'path';
import * as fs from 'fs';
import { waitForAppReady, invokeTauriCommand } from './helpers/app-launch';
import {
  getDefaultNotesDir,
  FILENAME_REGEX,
  writeTestNote,
  daysAgoFilename,
  makeCleanup,
} from './helpers/test-data';
import { assertValidFilename, assertFrontmatterTagsOnly } from './helpers/assertions';

test.describe('storage – API integration', () => {
  let notesDir: string;

  test.beforeEach(async ({ page }) => {
    notesDir = getDefaultNotesDir();
    await waitForAppReady(page);
  });

  // AC-ST-01: filename conforms to YYYY-MM-DDTHHMMSS.md
  test('AC-ST-01: create_note produces YYYY-MM-DDTHHMMSS.md filename', async ({ page }) => {
    const { filename } = await invokeTauriCommand<{ filename: string }>(page, 'create_note');
    assertValidFilename(filename);
    const filePath = path.join(notesDir, filename);
    expect(fs.existsSync(filePath)).toBe(true);
    await invokeTauriCommand(page, 'delete_note', { filename });
  });

  // AC-ST-02: file structure is YAML frontmatter (tags only) + body
  test('AC-ST-02: saved file has YAML frontmatter with tags only + body', async ({ page }) => {
    const { filename } = await invokeTauriCommand<{ filename: string }>(page, 'create_note');
    await invokeTauriCommand(page, 'save_note', {
      filename,
      frontmatter: { tags: ['a', 'b'] },
      body: 'Storage structure test',
    });
    const filePath = path.join(notesDir, filename);
    assertFrontmatterTagsOnly(filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toMatch(/^---\n/);
    expect(content).toContain('Storage structure test');
    await invokeTauriCommand(page, 'delete_note', { filename });
  });

  // AC-ST-03: default notes directory matches platform convention
  test('AC-ST-03: default notes_dir matches platform convention', async ({ page }) => {
    const { notes_dir } = await invokeTauriCommand<{ notes_dir: string }>(page, 'get_settings');
    if (process.platform === 'linux') {
      expect(notes_dir).toMatch(/\.local\/share\/promptnotes\/notes/);
    } else if (process.platform === 'darwin') {
      expect(notes_dir).toMatch(/Library\/Application Support\/promptnotes\/notes/);
    }
  });

  // list_notes returns created_at derived from filename
  test('list_notes includes created_at parsed from filename', async ({ page }) => {
    const { filename } = await invokeTauriCommand<{ filename: string }>(page, 'create_note');
    const { notes } = await invokeTauriCommand<{ notes: Array<{ filename: string; created_at: string }> }>(
      page, 'list_notes', { days: 1 }
    );
    const found = notes.find((n) => n.filename === filename);
    expect(found, 'Newly created note must appear in list_notes').toBeTruthy();
    expect(typeof found?.created_at).toBe('string');
    expect(found!.created_at.length).toBeGreaterThan(0);
    await invokeTauriCommand(page, 'delete_note', { filename });
  });

  // delete_note removes file from disk
  test('delete_note removes file from filesystem', async ({ page }) => {
    const { filename } = await invokeTauriCommand<{ filename: string }>(page, 'create_note');
    const filePath = path.join(notesDir, filename);
    expect(fs.existsSync(filePath)).toBe(true);
    const result = await invokeTauriCommand<{ success: boolean }>(page, 'delete_note', { filename });
    expect(result.success).toBe(true);
    expect(fs.existsSync(filePath)).toBe(false);
  });

  // FC-ST-01: filename is immutable after creation (no rename API)
  test('FC-ST-01: filename stays YYYY-MM-DDTHHMMSS.md on subsequent saves', async ({ page }) => {
    const { filename } = await invokeTauriCommand<{ filename: string }>(page, 'create_note');
    await invokeTauriCommand(page, 'save_note', {
      filename,
      frontmatter: { tags: ['immutable-test'] },
      body: 'Immutability check',
    });
    assertValidFilename(filename);
    const filePath = path.join(notesDir, filename);
    expect(fs.existsSync(filePath)).toBe(true);
    await invokeTauriCommand(page, 'delete_note', { filename });
  });

  // Path traversal guard: filename with path separators must be rejected
  test('delete_note rejects path traversal filenames', async ({ page }) => {
    await expect(
      invokeTauriCommand(page, 'delete_note', { filename: '../sensitive-file.md' })
    ).rejects.toThrow();
  });

  // list_notes sorted by created_at descending
  test('list_notes returns notes in descending created_at order', async ({ page }) => {
    const cleanup = makeCleanup(notesDir);
    const fn1 = daysAgoFilename(2);
    const fn2 = daysAgoFilename(1);
    writeTestNote(notesDir, fn1, [], 'Older note');
    writeTestNote(notesDir, fn2, [], 'Newer note');
    cleanup.filenames.push(fn1, fn2);

    try {
      const { notes } = await invokeTauriCommand<{ notes: Array<{ filename: string; created_at: string }> }>(
        page, 'list_notes', { days: 7 }
      );
      const ours = notes.filter((n) => [fn1, fn2].includes(n.filename));
      expect(ours.length).toBeGreaterThanOrEqual(2);
      const idx1 = notes.findIndex((n) => n.filename === fn2);
      const idx2 = notes.findIndex((n) => n.filename === fn1);
      expect(idx1, 'Newer note must appear before older note').toBeLessThan(idx2);
    } finally {
      cleanup.cleanup();
    }
  });
});
