// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 53-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/test/acceptance_criteria.md
// @generated-by: codd implement --sprint 53
import { test, expect } from '@playwright/test';
import { launchApp, closeApp, waitForTauriReady, invoke, AppHandle } from './helpers/app-launch';
import { cleanNotesDir, createNoteFileDaysAgo, createNoteFile } from './helpers/note-factory';
import {
  COMMANDS,
  SEARCH_DEBOUNCE_MS,
  NoteMetadata,
  NoteFilter,
} from './helpers/test-data';
import { assertNoteMetadataShape } from './helpers/assertions';

let app: AppHandle;

test.beforeAll(async () => {
  app = await launchApp();
  await waitForTauriReady(app.page);
});

test.afterAll(async () => {
  cleanNotesDir();
  await closeApp(app);
});

test.beforeEach(() => cleanNotesDir());

// ──────────────────────────────────────────────────
// AC-GRID-02: デフォルト直近 7 日間フィルタ (RB-4)
// ──────────────────────────────────────────────────

test('list_notes で直近7日間のノートのみ返る (AC-GRID-02, RB-4)', async () => {
  const { id: recentId } = createNoteFileDaysAgo(3, { body: 'recent note', tags: ['recent'] });
  const { id: oldId } = createNoteFileDaysAgo(10, { body: 'old note', tags: ['old'] });

  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  const filter: NoteFilter = {
    date_from: sevenDaysAgo.toISOString().slice(0, 10),
    date_to: today.toISOString().slice(0, 10),
  };
  const notes = await invoke<NoteMetadata[]>(app.page, COMMANDS.LIST_NOTES, { filter });
  const ids = notes.map(n => n.id);
  expect(ids, 'recent note (3 days ago) must be in results').toContain(recentId);
  expect(ids, 'old note (10 days ago) must not be in results').not.toContain(oldId);
});

// ──────────────────────────────────────────────────
// AC-GRID-03: タグ・日付フィルタ (RB-4)
// ──────────────────────────────────────────────────

test('list_notes のタグフィルタが AND 条件で動作する (AC-GRID-03, RB-4)', async () => {
  createNoteFileDaysAgo(1, { tags: ['rust', 'tauri'], body: 'both tags note' });
  createNoteFileDaysAgo(2, { tags: ['rust'], body: 'only rust note' });
  createNoteFileDaysAgo(3, { tags: ['tauri'], body: 'only tauri note' });

  const filter: NoteFilter = { tags: ['rust', 'tauri'] };
  const notes = await invoke<NoteMetadata[]>(app.page, COMMANDS.LIST_NOTES, { filter });
  expect(notes.length, 'only note with both tags must be returned').toBe(1);
  expect(notes[0]!.tags).toContain('rust');
  expect(notes[0]!.tags).toContain('tauri');
});

test('list_notes の日付フィルタが機能する (AC-GRID-03, RB-4)', async () => {
  createNoteFileDaysAgo(2, { body: 'within range' });
  createNoteFileDaysAgo(8, { body: 'out of range' });

  const today = new Date();
  const fiveDaysAgo = new Date(today);
  fiveDaysAgo.setDate(today.getDate() - 5);

  const filter: NoteFilter = {
    date_from: fiveDaysAgo.toISOString().slice(0, 10),
    date_to: today.toISOString().slice(0, 10),
  };
  const notes = await invoke<NoteMetadata[]>(app.page, COMMANDS.LIST_NOTES, { filter });
  const previews = notes.map(n => n.preview);
  expect(previews.some(p => p.includes('within range'))).toBe(true);
  expect(previews.some(p => p.includes('out of range'))).toBe(false);
});

// ──────────────────────────────────────────────────
// AC-GRID-04: 全文検索 (RB-4)
// ──────────────────────────────────────────────────

test('search_notes がファイル全走査で本文を検索する (AC-GRID-04, RB-4)', async () => {
  createNoteFileDaysAgo(1, { body: 'PromptNotes全文検索テスト unique-keyword-xyz', tags: [] });
  createNoteFileDaysAgo(2, { body: 'unrelated note content', tags: [] });

  const results = await invoke<NoteMetadata[]>(app.page, COMMANDS.SEARCH_NOTES, {
    query: 'unique-keyword-xyz',
  });
  expect(results.length, 'should find exactly one matching note').toBe(1);
  expect(results[0]!.preview).toContain('unique-keyword-xyz');
});

test('search_notes はケースインセンシティブ部分一致で検索する (AC-GRID-04)', async () => {
  createNoteFileDaysAgo(1, { body: 'CaseSensitivityTestNote', tags: [] });

  const lower = await invoke<NoteMetadata[]>(app.page, COMMANDS.SEARCH_NOTES, {
    query: 'casesensitivitytestnote',
  });
  const upper = await invoke<NoteMetadata[]>(app.page, COMMANDS.SEARCH_NOTES, {
    query: 'CASESENSITIVITYTESTNOTE',
  });
  expect(lower.length).toBeGreaterThan(0);
  expect(upper.length).toBeGreaterThan(0);
});

test('search_notes にタグフィルタと全文検索を組み合わせできる (AC-GRID-04, RB-4)', async () => {
  createNoteFileDaysAgo(1, { body: 'combined search test body', tags: ['combined'] });
  createNoteFileDaysAgo(2, { body: 'combined search test body', tags: ['other'] });

  const results = await invoke<NoteMetadata[]>(app.page, COMMANDS.SEARCH_NOTES, {
    query: 'combined search',
    filter: { tags: ['combined'] },
  });
  expect(results.length).toBe(1);
  expect(results[0]!.tags).toContain('combined');
});

test('search_notes の応答は NoteMetadata[] の型契約を満たす (AC-GRID-04)', async () => {
  createNoteFileDaysAgo(1, { body: 'shape validation note', tags: [] });
  const results = await invoke<NoteMetadata[]>(app.page, COMMANDS.SEARCH_NOTES, {
    query: 'shape validation',
  });
  for (const meta of results) {
    assertNoteMetadataShape(meta);
  }
});

test('list_notes の応答は created_at 降順でソートされている', async () => {
  createNoteFileDaysAgo(1, { body: 'newest' });
  createNoteFileDaysAgo(3, { body: 'older' });
  createNoteFileDaysAgo(5, { body: 'oldest' });

  const notes = await invoke<NoteMetadata[]>(app.page, COMMANDS.LIST_NOTES, {});
  expect(notes.length).toBeGreaterThanOrEqual(3);
  for (let i = 1; i < notes.length; i++) {
    expect(notes[i - 1]!.created_at >= notes[i]!.created_at, 'notes must be sorted newest first').toBe(true);
  }
});
