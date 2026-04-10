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
import { assertValidFilename, parseFrontmatter } from './helpers/assertions';
import { createTestNote, deleteTestNote } from './helpers/test-data';

/**
 * AC-ED-01: CodeMirror 6 editor with Markdown syntax highlighting (API level)
 * AC-ED-06: Auto-save persists content without explicit save action
 * AC-ST-01: Filename follows YYYY-MM-DDTHHMMSS.md
 * AC-ST-02: File structure is YAML frontmatter (tags only) + body
 */

test.describe('Editor API integration', () => {
  let testFilenames: string[] = [];

  test.afterEach(async () => {
    for (const fn of testFilenames) {
      await deleteTestNote(fn);
    }
    testFilenames = [];
  });

  test('AC-ST-01 / FC-ST-01: create_note returns filename matching YYYY-MM-DDTHHMMSS.md', async () => {
    const result = await invoke<{ filename: string }>('create_note');
    testFilenames.push(result.filename);
    assertValidFilename(result.filename);
  });

  test('AC-ST-02 / FC-ST-03: save_note writes only tags in frontmatter', async () => {
    const filename = await createTestNote(['gpt', 'coding'], 'テスト本文');
    testFilenames.push(filename);

    const data = await invoke<{ frontmatter: { tags: string[] }; body: string }>('read_note', { filename });
    expect(data.frontmatter.tags).toEqual(['gpt', 'coding']);
    expect(data.body.trim()).toBe('テスト本文');
  });

  test('AC-ED-06 / FC-ST-02: auto-save stores body content via save_note IPC', async () => {
    const result = await invoke<{ filename: string }>('create_note');
    const { filename } = result;
    testFilenames.push(filename);

    await invoke('save_note', {
      filename,
      frontmatter: { tags: [] },
      body: '自動保存テスト',
    });

    const data = await invoke<{ frontmatter: { tags: string[] }; body: string }>('read_note', { filename });
    expect(data.body.trim()).toBe('自動保存テスト');
  });

  test('FC-ST-03: frontmatter must not contain fields other than tags', async () => {
    const filename = await createTestNote(['test'], 'body');
    testFilenames.push(filename);

    const data = await invoke<{ frontmatter: Record<string, unknown>; body: string }>('read_note', { filename });
    const keys = Object.keys(data.frontmatter);
    expect(keys).toEqual(['tags']);
  });

  test('AC-ST-03: default notes_dir contains platform-appropriate path', async () => {
    const settings = await invoke<{ notes_dir: string }>('get_settings');
    expect(settings.notes_dir).toMatch(/promptnotes[/\\]notes/);
  });

  test('delete_note removes the file', async () => {
    const filename = await createTestNote([], 'to be deleted');
    await invoke('delete_note', { filename });
    await expect(
      invoke('read_note', { filename })
    ).rejects.toBeTruthy();
  });
});
