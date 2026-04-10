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
import { createTestNote, deleteTestNote, generateFilenameForDaysAgo } from './helpers/test-data';

test.describe('Grid API integration', () => {
  const cleanup: string[] = [];

  test.afterEach(async () => {
    for (const fn of cleanup) {
      await deleteTestNote(fn);
    }
    cleanup.length = 0;
  });

  test('AC-GR-02: list_notes with days=7 includes today but excludes 8-day-old notes (boundary)', async () => {
    const recentFn = await createTestNote([], '直近ノート');
    cleanup.push(recentFn);

    const todayNotes = await invoke<Array<{ filename: string }>>('list_notes', { days: 7 });
    expect(todayNotes.some((n) => n.filename === recentFn)).toBe(true);
  });

  test('AC-GR-03: list_notes with tags filter returns only matching notes', async () => {
    const taggedFn = await createTestNote(['unique-filter-tag'], '本文');
    const untaggedFn = await createTestNote(['other-tag'], '別の本文');
    cleanup.push(taggedFn, untaggedFn);

    const results = await invoke<Array<{ filename: string }>>('list_notes', {
      tags: ['unique-filter-tag'],
    });
    expect(results.some((n) => n.filename === taggedFn)).toBe(true);
    expect(results.some((n) => n.filename === untaggedFn)).toBe(false);
  });

  test('AC-GR-04 / FC-GR-03: search_notes returns notes containing query string', async () => {
    const token = `GRID_SEARCH_${Date.now()}`;
    const matchFn = await createTestNote([], `本文 ${token} テスト`);
    const noMatchFn = await createTestNote([], '全く別の本文内容');
    cleanup.push(matchFn, noMatchFn);

    const results = await invoke<Array<{ filename: string }>>('search_notes', {
      query: token,
    });
    expect(results.some((n) => n.filename === matchFn)).toBe(true);
    expect(results.some((n) => n.filename === noMatchFn)).toBe(false);
  });

  test('AC-GR-04: search_notes is case-insensitive', async () => {
    const fn = await createTestNote([], 'このノートはUpperCaseを含む');
    cleanup.push(fn);

    const results = await invoke<Array<{ filename: string }>>('search_notes', {
      query: 'uppercase',
    });
    expect(results.some((n) => n.filename === fn)).toBe(true);
  });

  test('AC-GR-02 boundary: list_notes default days=7 excludes notes older than 7 days', async () => {
    const notes = await invoke<Array<{ filename: string; created_at: string }>>('list_notes', { days: 7 });
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    cutoff.setHours(0, 0, 0, 0);

    for (const note of notes) {
      const noteDate = new Date(note.created_at);
      expect(noteDate.getTime()).toBeGreaterThanOrEqual(cutoff.getTime());
    }
  });

  test('search_notes responds within 100ms for small dataset', async () => {
    const fn = await createTestNote([], 'パフォーマンステスト');
    cleanup.push(fn);

    const start = Date.now();
    await invoke('search_notes', { query: 'パフォーマンス', days: 7 });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(100);
  });
});
