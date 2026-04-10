// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 27-1
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
// @generated-by: codd implement --sprint 27

import { test, expect } from '@playwright/test';
import { invoke } from '@tauri-apps/api/core';
import { assertValidFilename } from './helpers/assertions';
import { createTestNote, deleteTestNote, FILENAME_REGEX } from './helpers/test-data';

test.describe('Storage API integration', () => {
  const cleanup: string[] = [];

  test.afterEach(async () => {
    for (const fn of cleanup) {
      await deleteTestNote(fn);
    }
    cleanup.length = 0;
  });

  test('AC-ST-01: create_note filename matches YYYY-MM-DDTHHMMSS.md', async () => {
    const { filename } = await invoke<{ filename: string }>('create_note');
    cleanup.push(filename);
    assertValidFilename(filename);
    expect(FILENAME_REGEX.test(filename)).toBe(true);
  });

  test('AC-ST-02: saved file has valid YAML frontmatter with tags only', async () => {
    const tags = ['storage', 'test'];
    const body = 'ストレージテスト本文';
    const filename = await createTestNote(tags, body);
    cleanup.push(filename);

    const data = await invoke<{ frontmatter: { tags: string[] }; body: string }>('read_note', { filename });
    expect(Array.isArray(data.frontmatter.tags)).toBe(true);
    expect(data.frontmatter.tags).toEqual(tags);
    expect(Object.keys(data.frontmatter)).toHaveLength(1);
  });

  test('AC-ST-03: default settings notes_dir is platform-appropriate', async () => {
    const settings = await invoke<{ notes_dir: string }>('get_settings');
    const platform = process.platform;
    if (platform === 'linux') {
      expect(settings.notes_dir).toMatch(/\.local\/share\/promptnotes\/notes/);
    } else if (platform === 'darwin') {
      expect(settings.notes_dir).toMatch(/Library\/Application Support\/promptnotes\/notes/);
    }
  });

  test('list_notes returns metadata sorted by created_at descending', async () => {
    const fn1 = await createTestNote(['a'], 'note 1');
    const fn2 = await createTestNote(['b'], 'note 2');
    cleanup.push(fn1, fn2);

    const notes = await invoke<Array<{ filename: string; created_at: string }>>('list_notes', { days: 1 });
    const filenames = notes.map((n) => n.filename);
    expect(filenames).toContain(fn1);
    expect(filenames).toContain(fn2);

    for (let i = 1; i < notes.length; i++) {
      expect(notes[i - 1].created_at >= notes[i].created_at).toBe(true);
    }
  });

  test('search_notes returns only notes matching query', async () => {
    const uniqueToken = `UNIQUE_${Date.now()}`;
    const fn = await createTestNote([], `This note contains ${uniqueToken}`);
    cleanup.push(fn);

    const results = await invoke<Array<{ filename: string }>>('search_notes', {
      query: uniqueToken,
    });
    expect(results.some((n) => n.filename === fn)).toBe(true);

    const noResults = await invoke<Array<{ filename: string }>>('search_notes', {
      query: `SHOULD_NOT_MATCH_${Date.now()}`,
    });
    expect(noResults.some((n) => n.filename === fn)).toBe(false);
  });

  test('FC-SF-security: delete_note with path traversal is rejected', async () => {
    await expect(
      invoke('delete_note', { filename: '../../../etc/passwd' })
    ).rejects.toBeTruthy();
  });

  test('AC-ST-04: update_settings changes notes_dir', async () => {
    const originalSettings = await invoke<{ notes_dir: string }>('get_settings');
    const newDir = '/tmp/promptnotes-test-dir';

    await invoke('update_settings', { notes_dir: newDir });
    const updated = await invoke<{ notes_dir: string }>('get_settings');
    expect(updated.notes_dir).toBe(newDir);

    // restore
    await invoke('update_settings', { notes_dir: originalSettings.notes_dir });
  });
});
