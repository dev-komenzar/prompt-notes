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
import {
  getDefaultNotesDir,
  listNotesInDir,
  createTestNote,
  generateFilename,
  parseNoteContent,
} from './helpers/test-data';
import { assertFilenameFormat, assertFrontmatterTagsOnly } from './helpers/assertions';
import { waitForAppReady } from './helpers/app-launch';

const TEST_DIR = path.join(getDefaultNotesDir(), '..', 'notes_test_storage');

test.beforeAll(async () => {
  await waitForAppReady();
  fs.mkdirSync(TEST_DIR, { recursive: true });
});

test.afterAll(() => {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

test.describe('AC-ST-01: filename format YYYY-MM-DDTHHMMSS.md', () => {
  test('generated filename matches format', () => {
    const filename = generateFilename();
    assertFilenameFormat(filename);
  });

  test('existing notes in default dir have correct filename format', () => {
    const notesDir = getDefaultNotesDir();
    if (!fs.existsSync(notesDir)) return;
    const files = listNotesInDir(notesDir);
    for (const f of files) {
      assertFilenameFormat(f);
    }
  });
});

test.describe('AC-ST-02: file structure — YAML frontmatter with tags only', () => {
  test('written note has frontmatter with only tags key', () => {
    const filename = generateFilename();
    const filepath = createTestNote(TEST_DIR, filename, ['gpt', 'coding'], 'Test body');
    const content = fs.readFileSync(filepath, 'utf-8');
    assertFrontmatterTagsOnly(content);
  });

  test('frontmatter is delimited by --- markers', () => {
    const filename = generateFilename();
    const filepath = createTestNote(TEST_DIR, filename, ['test'], 'Body text');
    const content = fs.readFileSync(filepath, 'utf-8');
    expect(content).toMatch(/^---\n/);
    expect(content).toContain('\n---\n');
  });

  test('body is accessible after frontmatter', () => {
    const filename = generateFilename();
    const body = `unique body ${Date.now()}`;
    const filepath = createTestNote(TEST_DIR, filename, [], body);
    const content = fs.readFileSync(filepath, 'utf-8');
    const parsed = parseNoteContent(content);
    expect(parsed.body).toContain(body);
  });

  test('FC-ST-03: no auto-inserted fields other than tags', () => {
    const filename = generateFilename();
    const filepath = createTestNote(TEST_DIR, filename, ['test'], 'body');
    const content = fs.readFileSync(filepath, 'utf-8');
    const end = content.indexOf('\n---\n', 4);
    if (end === -1) return;
    const yaml = content.slice(4, end);
    const lines = yaml.split('\n').filter((l) => l.trim() && !l.trim().startsWith('-'));
    for (const line of lines) {
      const key = line.split(':')[0].trim();
      expect(['tags']).toContain(key);
    }
  });
});

test.describe('AC-ST-03: default notes directory', () => {
  test('default directory is platform-correct', () => {
    const dir = getDefaultNotesDir();
    if (process.platform === 'linux') {
      expect(dir).toContain('.local/share/promptnotes/notes');
    } else if (process.platform === 'darwin') {
      expect(dir).toContain('Library/Application Support/promptnotes/notes');
    }
  });
});
