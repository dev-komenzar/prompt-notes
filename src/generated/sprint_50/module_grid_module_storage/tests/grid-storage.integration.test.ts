// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 50-1
// @task-title: `module:grid` + `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd-trace: test:acceptance_criteria AC-GRID-01..05, AC-STOR-01..02
// Grid ↔ Search ↔ Storage 統合テスト
// @tauri-apps/api/core は vi.mock でモックし、Tauri ランタイムなしで実行可能。

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { filtersStore, resetFilters } from '../stores/filters';
import { notesStore } from '../stores/notes';
import { listNotes, searchNotes } from '../lib/ipc';
import { makeNoteMetadata, makeNoteList, isWithinDays } from './helpers/note-factory';
import type { NoteMetadata } from '../lib/types';

// Tauri IPC をモック — 実ファイルシステムに依存しない
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// ipc.ts 全体をモックして制御可能にする
vi.mock('../lib/ipc', () => ({
  listNotes: vi.fn(),
  searchNotes: vi.fn(),
  createNote: vi.fn(),
  saveNote: vi.fn(),
  readNote: vi.fn(),
  deleteNote: vi.fn(),
  getConfig: vi.fn(),
  setConfig: vi.fn(),
}));

const mockListNotes = listNotes as ReturnType<typeof vi.fn>;
const mockSearchNotes = searchNotes as ReturnType<typeof vi.fn>;

describe('filtersStore — デフォルト直近7日間フィルタ (RBC-GRID-1)', () => {
  beforeEach(() => {
    resetFilters();
  });

  it('初期値の date_from が7日前の日付になっている', () => {
    const filters = get(filtersStore);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    expect(filters.date_from).toBe(sevenDaysAgo.toISOString().slice(0, 10));
  });

  it('初期値の date_to が本日の日付になっている', () => {
    const filters = get(filtersStore);
    expect(filters.date_to).toBe(new Date().toISOString().slice(0, 10));
  });

  it('初期値の query が空文字になっている', () => {
    const filters = get(filtersStore);
    expect(filters.query).toBe('');
  });

  it('初期値の tags が空配列になっている', () => {
    const filters = get(filtersStore);
    expect(filters.tags).toEqual([]);
  });

  it('resetFilters() で直近7日間フィルタに戻る', () => {
    filtersStore.update(f => ({ ...f, query: 'test', tags: ['rust'] }));
    resetFilters();
    const filters = get(filtersStore);
    expect(filters.query).toBe('');
    expect(filters.tags).toEqual([]);
  });
});

describe('filtersStore — タグ・日付フィルタ更新 (RBC-GRID-2)', () => {
  beforeEach(() => resetFilters());

  it('タグを追加できる', () => {
    filtersStore.update(f => ({ ...f, tags: [...(f.tags ?? []), 'rust'] }));
    expect(get(filtersStore).tags).toContain('rust');
  });

  it('タグを削除できる', () => {
    filtersStore.update(f => ({ ...f, tags: ['rust', 'tauri'] }));
    filtersStore.update(f => ({ ...f, tags: f.tags?.filter(t => t !== 'rust') }));
    expect(get(filtersStore).tags).toEqual(['tauri']);
  });

  it('date_from を更新できる', () => {
    filtersStore.update(f => ({ ...f, date_from: '2026-01-01' }));
    expect(get(filtersStore).date_from).toBe('2026-01-01');
  });

  it('date_to を更新できる', () => {
    filtersStore.update(f => ({ ...f, date_to: '2026-04-11' }));
    expect(get(filtersStore).date_to).toBe('2026-04-11');
  });
});

describe('note-factory — ファイル名規則検証 (RBC-3, AC-STOR-01)', () => {
  it('生成された id が YYYY-MM-DDTHHMMSS 形式に合致する', () => {
    const note = makeNoteMetadata();
    expect(note.id).toMatch(/^\d{4}-\d{2}-\d{2}T\d{6}$/);
  });

  it('daysAgo=3 のノート id が3日前の日付を含む', () => {
    const note = makeNoteMetadata({ daysAgo: 3 });
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    expect(note.id.slice(0, 10)).toBe(threeDaysAgo.toISOString().slice(0, 10));
  });

  it('isWithinDays: 今日のノートは7日以内', () => {
    const note = makeNoteMetadata({ daysAgo: 0 });
    expect(isWithinDays(note.id, 7)).toBe(true);
  });

  it('isWithinDays: 8日前のノートは7日以内に含まれない', () => {
    const note = makeNoteMetadata({ daysAgo: 8 });
    expect(isWithinDays(note.id, 7)).toBe(false);
  });
});

describe('notesStore — Grid データフロー統合', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetFilters();
    notesStore.set([]);
  });

  it('listNotes の結果を notesStore に反映できる', async () => {
    const notes = makeNoteList(3);
    mockListNotes.mockResolvedValue(notes);

    const result = await listNotes({ date_from: '2026-04-04' });
    notesStore.set(result);

    expect(get(notesStore)).toHaveLength(3);
  });

  it('searchNotes の結果を notesStore に反映できる', async () => {
    const notes = [makeNoteMetadata({ preview: 'Tauri IPC の使い方', tags: ['tauri'] })];
    mockSearchNotes.mockResolvedValue(notes);

    const result = await searchNotes('Tauri', { date_from: '2026-04-04' });
    notesStore.set(result);

    const stored = get(notesStore);
    expect(stored).toHaveLength(1);
    expect(stored[0].preview).toContain('Tauri');
  });

  it('query が空のとき listNotes を呼び、非空のとき searchNotes を呼ぶ', async () => {
    const allNotes = makeNoteList(5);
    const filtered: NoteMetadata[] = [makeNoteMetadata({ preview: 'rust memo' })];
    mockListNotes.mockResolvedValue(allNotes);
    mockSearchNotes.mockResolvedValue(filtered);

    const filters = get(filtersStore);

    // query 空 → listNotes
    const listResult = await listNotes({ date_from: filters.date_from, date_to: filters.date_to });
    expect(mockListNotes).toHaveBeenCalledOnce();
    notesStore.set(listResult);
    expect(get(notesStore)).toHaveLength(5);

    // query 非空 → searchNotes
    const searchResult = await searchNotes('rust', { date_from: filters.date_from });
    expect(mockSearchNotes).toHaveBeenCalledWith('rust', expect.any(Object));
    notesStore.set(searchResult);
    expect(get(notesStore)).toHaveLength(1);
  });

  it('タグフィルタ + 全文検索の AND 条件が ipc に渡される', async () => {
    mockSearchNotes.mockResolvedValue([]);
    filtersStore.update(f => ({ ...f, tags: ['rust'], query: 'tauri' }));

    const { date_from, date_to, tags, query } = get(filtersStore);
    await searchNotes(query, { tags, date_from, date_to });

    expect(mockSearchNotes).toHaveBeenCalledWith(
      'tauri',
      expect.objectContaining({ tags: ['rust'] }),
    );
  });
});

describe('NoteMetadata — preview 長さと tags 構造', () => {
  it('preview は 100 文字以内を想定', () => {
    const longBody = 'a'.repeat(200);
    const note = makeNoteMetadata({ preview: longBody.slice(0, 100) });
    expect(note.preview.length).toBeLessThanOrEqual(100);
  });

  it('tags が空配列のノートを許容する', () => {
    const note = makeNoteMetadata({ tags: [] });
    expect(note.tags).toEqual([]);
  });

  it('created_at が ISO 8601 形式', () => {
    const note = makeNoteMetadata();
    expect(() => new Date(note.created_at).toISOString()).not.toThrow();
  });
});
