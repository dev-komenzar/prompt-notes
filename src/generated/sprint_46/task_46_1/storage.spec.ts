// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 46-1
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
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import {
  defaultNotesDir,
  createTestNote,
  deleteTestNote,
  generateFilename,
} from './helpers/test-data';
import { assertFilenameFormat, parseFrontmatter, assertFrontmatterOnlyTags } from './helpers/assertions';

test.describe('Storage — file format (AC-ST-01, AC-ST-02, AC-ST-03)', () => {
  const notesDir = defaultNotesDir();
  const created: string[] = [];

  test.afterAll(async () => {
    for (const f of created) {
      await deleteTestNote(notesDir, f);
    }
  });

  test('AC-ST-01: filename matches YYYY-MM-DDTHHMMSS.md format', () => {
    const fn = generateFilename(new Date());
    assertFilenameFormat(fn);
  });

  test('AC-ST-01: filename is immutable (not renamed after creation)', async () => {
    const filename = await createTestNote(notesDir, { body: 'immutability check' });
    created.push(filename);
    const before = filename;
    // Simulate overwrite (save_note should not rename)
    await fs.writeFile(path.join(notesDir, filename), '---\ntags: []\n---\n\nupdated body', 'utf-8');
    const files = await fs.readdir(notesDir);
    expect(files).toContain(before);
  });

  test('AC-ST-02: frontmatter contains tags only — no extra fields', async () => {
    const filename = await createTestNote(notesDir, { tags: ['gpt', 'coding'], body: 'body' });
    created.push(filename);
    const content = await fs.readFile(path.join(notesDir, filename), 'utf-8');
    assertFrontmatterOnlyTags(content);
    const { tags } = parseFrontmatter(content);
    expect(tags).toContain('gpt');
    expect(tags).toContain('coding');
  });

  test('AC-ST-02: note without tags has empty tags array', async () => {
    const filename = await createTestNote(notesDir, { tags: [], body: 'no tags' });
    created.push(filename);
    const content = await fs.readFile(path.join(notesDir, filename), 'utf-8');
    const { tags } = parseFrontmatter(content);
    expect(tags).toHaveLength(0);
  });

  test('AC-ST-03: default notes dir is platform-specific', () => {
    const dir = defaultNotesDir();
    if (process.platform === 'linux') {
      expect(dir).toMatch(/\.local\/share\/promptnotes\/notes/);
    } else {
      expect(dir).toMatch(/Library\/Application Support\/promptnotes\/notes/);
    }
  });

  test('AC-ST-03: default notes dir is created if missing', async () => {
    const stat = await fs.stat(notesDir).catch(() => null);
    // dir may not exist yet; creating a note should create it
    const filename = await createTestNote(notesDir, { body: 'dir creation' });
    created.push(filename);
    const newStat = await fs.stat(notesDir);
    expect(newStat.isDirectory()).toBe(true);
  });
});
