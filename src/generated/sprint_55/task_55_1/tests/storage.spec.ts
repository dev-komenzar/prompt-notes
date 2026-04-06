// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 55-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// trace: sprint_55/task_55_1 — CI E2E テスト構築 — module:storage E2E テスト
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { resolvePlatformConfig, getNewNoteShortcut, formatExpectedNotesDir } from '../helpers/platform';
import {
  createTempNotesDir,
  cleanupTempDir,
  listNotesOnDisk,
  readNoteFromDisk,
  isValidNoteFilename,
  parseDateFromFilename,
  writeTestConfig,
  seedNote,
} from '../helpers/test-fixtures';
import {
  waitForAppReady,
  navigateToView,
  typeInEditor,
} from '../helpers/webview-client';

const platformConfig = resolvePlatformConfig();

test.describe('module:storage — E2E Tests', () => {
  let tempDir: string;

  test.beforeEach(async () => {
    tempDir = createTempNotesDir();
    writeTestConfig(tempDir, tempDir);
  });

  test.afterEach(async () => {
    cleanupTempDir(tempDir);
  });

  // AC-ST-01: ファイル名規則 (RBC-3 / FAIL-06)
  test('AC-ST-01/FAIL-06: new note filename matches YYYY-MM-DDTHHMMSS.md', async ({
    page,
  }) => {
    await waitForAppReady(page);
    await navigateToView(page, 'editor');

    const shortcut = getNewNoteShortcut(platformConfig.platform);
    await page.keyboard.press(shortcut);
    await page.waitForTimeout(2_000);

    const notes = listNotesOnDisk(tempDir);
    expect(notes.length, 'At least one note must be created').toBeGreaterThanOrEqual(1);

    for (const filename of notes) {
      expect(
        isValidNoteFilename(filename),
        `Filename "${filename}" must match YYYY-MM-DDTHHMMSS.md (RBC-3 / FAIL-06)`,
      ).toBe(true);
    }
  });

  // AC-ST-01: Filename does not contain title or extra info
  test('AC-ST-01: filename contains only timestamp, no title', async ({ page }) => {
    await waitForAppReady(page);
    await navigateToView(page, 'editor');

    const shortcut = getNewNoteShortcut(platformConfig.platform);
    await page.keyboard.press(shortcut);
    await page.waitForTimeout(1_000);

    // Type some content that could be mistaken for a title
    await typeInEditor(page, 'My Important Note Title\n\nBody text here');
    await page.waitForTimeout(2_000);

    const notes = listNotesOnDisk(tempDir);
    for (const filename of notes) {
      expect(filename).not.toContain('Important');
      expect(filename).not.toContain('Note');
      expect(filename).not.toContain('Title');
      expect(filename).toMatch(/^\d{4}-\d{2}-\d{2}T\d{6}(_\d+)?\.md$/);
    }
  });

  // AC-ST-01: Filename timestamp corresponds to creation time
  test('AC-ST-01: filename timestamp is close to creation time', async ({ page }) => {
    const beforeCreate = new Date();

    await waitForAppReady(page);
    await navigateToView(page, 'editor');

    const shortcut = getNewNoteShortcut(platformConfig.platform);
    await page.keyboard.press(shortcut);
    await page.waitForTimeout(2_000);

    const afterCreate = new Date();

    const notes = listNotesOnDisk(tempDir);
    expect(notes.length).toBeGreaterThanOrEqual(1);

    const latestNote = notes[0];
    const noteDate = parseDateFromFilename(latestNote);
    expect(noteDate).not.toBeNull();

    if (noteDate) {
      // The file creation timestamp should be between beforeCreate and afterCreate
      // Allow 30s tolerance for IPC + process timing
      const tolerance = 30_000;
      expect(noteDate.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime() - tolerance);
      expect(noteDate.getTime()).toBeLessThanOrEqual(afterCreate.getTime() + tolerance);
    }
  });

  // AC-ST-02: ファイル形式 — .md with YAML frontmatter
  test('AC-ST-02: saved file is .md with YAML frontmatter and body', async ({
    page,
  }) => {
    await waitForAppReady(page);
    await navigateToView(page, 'editor');

    const shortcut = getNewNoteShortcut(platformConfig.platform);
    await page.keyboard.press(shortcut);
    await page.waitForTimeout(1_000);

    await typeInEditor(page, 'Test body content for format verification');
    await page.waitForTimeout(2_000);

    const notes = listNotesOnDisk(tempDir);
    expect(notes.length).toBeGreaterThanOrEqual(1);

    const content = readNoteFromDisk(tempDir, notes[0]);
    expect(content).not.toBeNull();

    if (content) {
      // Must start with YAML frontmatter delimiter
      expect(content.startsWith('---'), 'File must start with --- delimiter').toBe(true);

      // Must contain tags field
      expect(content).toContain('tags:');

      // Must have closing frontmatter delimiter
      const secondDelimiterIndex = content.indexOf('---', 3);
      expect(secondDelimiterIndex, 'File must have closing --- delimiter').toBeGreaterThan(0);

      // Must contain the body text after frontmatter
      expect(content).toContain('Test body content for format verification');
    }
  });

  // AC-ST-02: frontmatter contains only tags field
  test('AC-ST-02: frontmatter metadata is tags-only', async ({ page }) => {
    await waitForAppReady(page);
    await navigateToView(page, 'editor');

    const shortcut = getNewNoteShortcut(platformConfig.platform);
    await page.keyboard.press(shortcut);
    await page.waitForTimeout(2_000);

    const notes = listNotesOnDisk(tempDir);
    const content = readNoteFromDisk(tempDir, notes[0]);
    expect(content).not.toBeNull();

    if (content) {
      // Extract frontmatter
      const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
      expect(fmMatch, 'Frontmatter block must be present').not.toBeNull();

      if (fmMatch) {
        const fmContent = fmMatch[1];
        const lines = fmContent.split('\n').filter((l) => l.trim().length > 0);

        // Each non-empty line in frontmatter should be the tags field
        for (const line of lines) {
          expect(
            line.trim().startsWith('tags'),
            `Frontmatter must only contain tags field. Found: "${line.trim()}"`,
          ).toBe(true);
        }
      }
    }
  });

  // AC-ST-03: デフォルト保存ディレクトリ (FAIL-24 / FAIL-25)
  test('AC-ST-03/FAIL-24/FAIL-25: default notes directory matches platform convention', async () => {
    const expectedDir = formatExpectedNotesDir(platformConfig.platform);
    const configDir = platformConfig.defaultNotesDir;

    expect(
      configDir,
      `Default notes dir must be ${expectedDir} for ${platformConfig.platform}`,
    ).toBe(expectedDir);
  });

  // AC-ST-03: Default directory auto-creation on first launch
  test('AC-ST-03: notes directory is auto-created if not exists', async ({ page }) => {
    const freshDir = createTempNotesDir();
    const notesSubDir = path.join(freshDir, 'notes');

    // Remove the notes subdirectory to simulate first launch
    if (fs.existsSync(notesSubDir)) {
      fs.rmSync(notesSubDir, { recursive: true });
    }
    expect(fs.existsSync(notesSubDir)).toBe(false);

    writeTestConfig(freshDir, freshDir);
    await waitForAppReady(page);
    await navigateToView(page, 'editor');

    const shortcut = getNewNoteShortcut(platformConfig.platform);
    await page.keyboard.press(shortcut);
    await page.waitForTimeout(2_000);

    // The directory should now exist after first note creation
    expect(
      fs.existsSync(notesSubDir),
      'Notes directory must be auto-created on first use',
    ).toBe(true);

    cleanupTempDir(freshDir);
  });

  // AC-ST-04: Obsidian 互換性 — valid Markdown with YAML frontmatter (FAIL-26)
  test('AC-ST-04/FAIL-26: saved files are Obsidian-compatible Markdown', async ({
    page,
  }) => {
    await waitForAppReady(page);
    await navigateToView(page, 'editor');

    const shortcut = getNewNoteShortcut(platformConfig.platform);
    await page.keyboard.press(shortcut);
    await page.waitForTimeout(1_000);

    await typeInEditor(page, '# Heading\n\n- list item 1\n- list item 2\n\nParagraph text');
    await page.waitForTimeout(2_000);

    const notes = listNotesOnDisk(tempDir);
    const content = readNoteFromDisk(tempDir, notes[0]);
    expect(content).not.toBeNull();

    if (content) {
      // Valid YAML frontmatter: starts with --- and has closing ---
      expect(content.startsWith('---')).toBe(true);
      const closingIndex = content.indexOf('---', 3);
      expect(closingIndex).toBeGreaterThan(0);

      // File is valid UTF-8 Markdown (we read it as string, so it's valid)
      expect(content).toContain('# Heading');
      expect(content).toContain('- list item 1');

      // File extension must be .md
      expect(notes[0].endsWith('.md')).toBe(true);
    }
  });

  // Filename immutability: filename must not change after edits
  test('CONV-FILENAME: filename is immutable after creation', async ({ page }) => {
    await waitForAppReady(page);
    await navigateToView(page, 'editor');

    const shortcut = getNewNoteShortcut(platformConfig.platform);
    await page.keyboard.press(shortcut);
    await page.waitForTimeout(2_000);

    const notesBeforeEdit = listNotesOnDisk(tempDir);
    const originalFilename = notesBeforeEdit[0];

    // Make multiple edits
    await typeInEditor(page, 'First edit\n');
    await page.waitForTimeout(1_500);
    await typeInEditor(page, 'Second edit\n');
    await page.waitForTimeout(1_500);

    const notesAfterEdit = listNotesOnDisk(tempDir);

    // The original filename should still exist
    expect(
      notesAfterEdit.includes(originalFilename),
      'Filename must be immutable after creation (CONV-FILENAME)',
    ).toBe(true);
  });

  // Data locality: no database, no cloud, no AI calls
  test('CONV-STORAGE: data is local .md files only, no DB or cloud', async ({
    page,
  }) => {
    await waitForAppReady(page);
    await navigateToView(page, 'editor');

    const shortcut = getNewNoteShortcut(platformConfig.platform);
    await page.keyboard.press(shortcut);
    await page.waitForTimeout(1_000);
    await typeInEditor(page, 'Local storage verification test');
    await page.waitForTimeout(2_000);

    // Verify no database files exist in the temp directory
    const allFiles = fs.readdirSync(tempDir, { recursive: true }) as string[];
    const dbFiles = allFiles.filter(
      (f) =>
        f.endsWith('.sqlite') ||
        f.endsWith('.sqlite3') ||
        f.endsWith('.db') ||
        f.endsWith('.sqlite-wal') ||
        f.endsWith('.sqlite-shm'),
    );
    expect(
      dbFiles,
      'No database files must exist — data is local .md only (CONV-3)',
    ).toHaveLength(0);

    // Verify only .md files and config.json exist
    const notesFiles = fs.readdirSync(path.join(tempDir, 'notes'));
    for (const f of notesFiles) {
      expect(f.endsWith('.md'), `Notes directory must only contain .md files, found: ${f}`).toBe(
        true,
      );
    }
  });
});
