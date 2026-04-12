// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 54-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/design/test/acceptance_criteria.md
// @generated-by: codd propagate

import { test, expect } from '@playwright/test';
import * as path from 'path';
import { resolveTestNotesDir, setupGridTestData, teardownTestData } from './helpers/test-data';
import {
  assertFilenameFormat,
  assertNoteIdFormat,
  assertAllNotesHaveTag,
  assertNoteWithinDays,
} from './helpers/assertions';
import { tauriInvoke, navigateToGrid } from './helpers/app-launch';

// Types mirroring src/lib/types.ts
interface NoteMetadata {
  id: string;
  tags: string[];
  created_at: string;
  preview: string;
}

interface NoteFilter {
  tags?: string[];
  date_from?: string;
  date_to?: string;
}

let notesDir: string;
let testData: ReturnType<typeof setupGridTestData>;

test.beforeAll(() => {
  notesDir = resolveTestNotesDir();
  testData = setupGridTestData(notesDir);
});

test.afterAll(() => {
  teardownTestData(notesDir);
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-GRID-01 / AC-GRID-02: list_notes — default 7-day filter
// ─────────────────────────────────────────────────────────────────────────────

test('AC-GRID-02: list_notes with default 7-day filter returns only recent notes', async ({ page }) => {
  await navigateToGrid(page);

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const filter: NoteFilter = {
    date_from: sevenDaysAgo.toISOString().slice(0, 10),
    date_to: now.toISOString().slice(0, 10),
  };

  const notes = await tauriInvoke<NoteMetadata[]>(page, 'list_notes', { filter });

  expect(Array.isArray(notes), 'list_notes should return an array').toBe(true);
  for (const note of notes) {
    assertNoteIdFormat(note.id);
    assertNoteWithinDays(note.created_at, 7);
  }

  // Ensure old notes (8+ days ago) are NOT included
  const oldIds = testData.old.map(n => n.id);
  for (const note of notes) {
    expect(oldIds, `FC-GRID-02: 古いノート "${note.id}" がデフォルト 7 日間フィルタに含まれています`).not.toContain(note.id);
  }
});

test('AC-GRID-02: list_notes result is sorted by created_at descending', async ({ page }) => {
  await navigateToGrid(page);

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const notes = await tauriInvoke<NoteMetadata[]>(page, 'list_notes', {
    filter: {
      date_from: sevenDaysAgo.toISOString().slice(0, 10),
      date_to: now.toISOString().slice(0, 10),
    },
  });

  for (let i = 1; i < notes.length; i++) {
    expect(
      notes[i - 1].created_at >= notes[i].created_at,
      `list_notes result is not sorted descending at index ${i}`
    ).toBe(true);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-GRID-01: NoteMetadata shape
// ─────────────────────────────────────────────────────────────────────────────

test('AC-GRID-01: list_notes NoteMetadata has required fields', async ({ page }) => {
  await navigateToGrid(page);

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const notes = await tauriInvoke<NoteMetadata[]>(page, 'list_notes', {
    filter: {
      date_from: sevenDaysAgo.toISOString().slice(0, 10),
      date_to: now.toISOString().slice(0, 10),
    },
  });

  expect(notes.length, 'テストデータで recent ノートが存在するはず').toBeGreaterThan(0);

  for (const note of notes) {
    expect(typeof note.id).toBe('string');
    assertNoteIdFormat(note.id);
    assertFilenameFormat(`${note.id}.md`);
    expect(Array.isArray(note.tags)).toBe(true);
    expect(typeof note.created_at).toBe('string');
    expect(typeof note.preview).toBe('string');
    expect(note.preview.length, 'preview は 100 文字以内').toBeLessThanOrEqual(100);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-GRID-03: tag filter
// ─────────────────────────────────────────────────────────────────────────────

test('AC-GRID-03: list_notes with tag filter returns only matching notes', async ({ page }) => {
  await navigateToGrid(page);

  const notes = await tauriInvoke<NoteMetadata[]>(page, 'list_notes', {
    filter: { tags: ['rust'] },
  });

  expect(notes.length, 'タグ "rust" のノートが存在するはず').toBeGreaterThan(0);
  assertAllNotesHaveTag(notes, 'rust');
});

test('AC-GRID-03: list_notes with multiple tags is AND condition', async ({ page }) => {
  await navigateToGrid(page);

  const notes = await tauriInvoke<NoteMetadata[]>(page, 'list_notes', {
    filter: { tags: ['rust', 'storage'] },
  });

  // All returned notes must contain BOTH tags
  for (const note of notes) {
    expect(note.tags, `note "${note.id}" は "rust" タグを持つはず`).toContain('rust');
    expect(note.tags, `note "${note.id}" は "storage" タグを持つはず`).toContain('storage');
  }
});

test('AC-GRID-03: list_notes with non-existent tag returns empty array', async ({ page }) => {
  await navigateToGrid(page);

  const notes = await tauriInvoke<NoteMetadata[]>(page, 'list_notes', {
    filter: { tags: ['__nonexistent_tag_xyz__'] },
  });

  expect(notes).toHaveLength(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-GRID-03: date range filter
// ─────────────────────────────────────────────────────────────────────────────

test('AC-GRID-03: list_notes with date_from excludes older notes', async ({ page }) => {
  await navigateToGrid(page);

  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const dateFrom = twoDaysAgo.toISOString().slice(0, 10);

  const notes = await tauriInvoke<NoteMetadata[]>(page, 'list_notes', {
    filter: { date_from: dateFrom },
  });

  for (const note of notes) {
    expect(
      note.created_at.slice(0, 10) >= dateFrom,
      `FC-GRID-04: note "${note.id}" は date_from "${dateFrom}" より古いです`
    ).toBe(true);
  }
});

test('AC-GRID-03: list_notes with date range filter combination works', async ({ page }) => {
  await navigateToGrid(page);

  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const dateFrom = fiveDaysAgo.toISOString().slice(0, 10);
  const dateTo = twoDaysAgo.toISOString().slice(0, 10);

  const notes = await tauriInvoke<NoteMetadata[]>(page, 'list_notes', {
    filter: { date_from: dateFrom, date_to: dateTo },
  });

  for (const note of notes) {
    expect(note.created_at.slice(0, 10) >= dateFrom).toBe(true);
    expect(note.created_at.slice(0, 10) <= dateTo).toBe(true);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// AC-GRID-04: full-text search via search_notes
// ─────────────────────────────────────────────────────────────────────────────

test('AC-GRID-04: search_notes finds notes by body text', async ({ page }) => {
  await navigateToGrid(page);

  const results = await tauriInvoke<NoteMetadata[]>(page, 'search_notes', {
    query: 'UNIQUE_SEARCH_TOKEN_XYZ123',
  });

  expect(results.length, 'ユニークな検索トークンで 2 件ヒットするはず').toBe(2);
  const ids = results.map(n => n.id);
  for (const note of testData.searchable) {
    expect(ids, `search result should contain "${note.id}"`).toContain(note.id);
  }
});

test('AC-GRID-04: search_notes is case-insensitive', async ({ page }) => {
  await navigateToGrid(page);

  const lowerResults = await tauriInvoke<NoteMetadata[]>(page, 'search_notes', {
    query: 'unique_search_token_xyz123',
  });
  const upperResults = await tauriInvoke<NoteMetadata[]>(page, 'search_notes', {
    query: 'UNIQUE_SEARCH_TOKEN_XYZ123',
  });

  expect(lowerResults.length).toBe(upperResults.length);
});

test('AC-GRID-04: search_notes with empty query behaves as list_notes', async ({ page }) => {
  await navigateToGrid(page);

  // Empty query: frontend should use list_notes, but if search_notes is called with empty string it should return all
  const results = await tauriInvoke<NoteMetadata[]>(page, 'search_notes', { query: '' });
  const allNotes = await tauriInvoke<NoteMetadata[]>(page, 'list_notes', {});

  // Both should return same total (no filter) — note counts must match
  expect(results.length).toBe(allNotes.length);
});

test('AC-GRID-04: search_notes with filter combines full-text and tag filter', async ({ page }) => {
  await navigateToGrid(page);

  const results = await tauriInvoke<NoteMetadata[]>(page, 'search_notes', {
    query: 'UNIQUE_SEARCH_TOKEN_XYZ123',
    filter: { tags: ['search-test'] },
  });

  // Only the searchable note with tag 'search-test' should match
  expect(results.length).toBe(1);
  expect(results[0].tags).toContain('search-test');
});

test('AC-GRID-04: search_notes returns sorted by created_at descending', async ({ page }) => {
  await navigateToGrid(page);

  const results = await tauriInvoke<NoteMetadata[]>(page, 'search_notes', {
    query: 'UNIQUE_SEARCH_TOKEN_XYZ123',
  });

  for (let i = 1; i < results.length; i++) {
    expect(results[i - 1].created_at >= results[i].created_at).toBe(true);
  }
});

test('AC-GRID-04: search_notes for non-existent term returns empty array', async ({ page }) => {
  await navigateToGrid(page);

  const results = await tauriInvoke<NoteMetadata[]>(page, 'search_notes', {
    query: '__absolutely_impossible_string_99999__',
  });

  expect(results).toHaveLength(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// FC-GRID negative: no scope-out features
// ─────────────────────────────────────────────────────────────────────────────

test('FC-SCOPE: search_notes does not call external AI or cloud APIs', async ({ page }) => {
  // Verify no outbound network calls to AI/cloud endpoints during search
  const externalRequests: string[] = [];
  page.on('request', (req) => {
    const url = req.url();
    if (!url.startsWith('http://localhost') && !url.startsWith('tauri://')) {
      externalRequests.push(url);
    }
  });

  await navigateToGrid(page);
  await tauriInvoke<NoteMetadata[]>(page, 'search_notes', { query: 'test' });

  expect(externalRequests, 'FC-SCOPE-01/02: AI やクラウド API への通信が発生しています').toHaveLength(0);
});
