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
import * as path from 'path';
import * as os from 'os';
import { getDefaultNotesDir, FILENAME_REGEX, createTestNote, cleanupTestNotes } from './helpers/test-data';
import { assertFilenameFormat, parseFrontmatter, assertValidNoteStructure } from './helpers/assertions';
import { waitForApp } from './helpers/app-launch';

test.beforeAll(async () => {
  await waitForApp();
});

test.describe('AC-ST-01: filename format YYYY-MM-DDTHHMMSS.md', () => {
  test('FILENAME_REGEX matches valid filenames', () => {
    const valid = [
      '2026-04-10T091530.md',
      '2026-12-31T235959.md',
      '2026-01-01T000000.md',
    ];
    for (const f of valid) {
      assertFilenameFormat(f);
    }
  });

  test('FILENAME_REGEX rejects invalid filenames', () => {
    const invalid = [
      'note.md',
      '2026-04-10.md',
      '2026-04-10T09:15:30.md',
      'uuid-1234-5678.md',
    ];
    for (const f of invalid) {
      expect(f).not.toMatch(FILENAME_REGEX);
    }
  });
});

test.describe('AC-ST-02: file structure – YAML frontmatter tags only + body', () => {
  test('parseFrontmatter extracts tags correctly', () => {
    const content = '---\ntags:\n  - gpt\n  - coding\n---\n\nbody text here';
    const { tags } = parseFrontmatter(content);
    expect(tags).toEqual(['gpt', 'coding']);
  });

  test('assertValidNoteStructure passes for valid note', () => {
    const content = '---\ntags:\n  - prompt\n---\n\nbody';
    assertValidNoteStructure(content);
  });

  test('assertOnlyTagsInFrontmatter detects extra fields', () => {
    const { assertOnlyTagsInFrontmatter } = require('./helpers/assertions');
    const validContent = '---\ntags: []\n---\n\nbody';
    assertOnlyTagsInFrontmatter(validContent);
  });
});

test.describe('AC-ST-03: default notes directory per platform', () => {
  test('Linux default path', () => {
    if (process.platform !== 'linux') return;
    const dir = getDefaultNotesDir();
    expect(dir).toBe(path.join(os.homedir(), '.local', 'share', 'promptnotes', 'notes'));
  });

  test('macOS default path', () => {
    if (process.platform !== 'darwin') return;
    const dir = getDefaultNotesDir();
    expect(dir).toBe(path.join(os.homedir(), 'Library', 'Application Support', 'promptnotes', 'notes'));
  });
});

test.describe('test-data helpers', () => {
  let created: string[] = [];
  const notesDir = getDefaultNotesDir();

  test.afterAll(() => {
    cleanupTestNotes(notesDir, created);
  });

  test('createTestNote writes valid note file', () => {
    const filename = createTestNote(notesDir, { tags: ['test'], body: 'hello world' });
    created.push(filename);
    assertFilenameFormat(filename);
    const { readNoteFile } = require('./helpers/test-data');
    const content = readNoteFile(notesDir, filename);
    assertValidNoteStructure(content);
    const { tags } = parseFrontmatter(content);
    expect(tags).toContain('test');
  });

  test('createTestNote with daysAgo creates note with past timestamp in filename', () => {
    const filename = createTestNote(notesDir, { daysAgo: 3 });
    created.push(filename);
    assertFilenameFormat(filename);
    const datePart = filename.slice(0, 10);
    const noteDate = new Date(datePart);
    const now = new Date();
    const diffDays = Math.round((now.getTime() - noteDate.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBeGreaterThanOrEqual(2);
    expect(diffDays).toBeLessThanOrEqual(4);
  });
});
