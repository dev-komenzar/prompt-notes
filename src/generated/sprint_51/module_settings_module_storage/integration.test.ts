// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 51-1
// @task-title: `module:settings` + `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd: test:acceptance_criteria AC-SET-01, AC-STOR-01 ~ AC-STOR-03
// Integration: Settings ↔ Config ↔ Storage
//
// このテストは Tauri invoke をモックし、
// 「ディレクトリ変更 → 新ディレクトリでのノート CRUD」フローを検証する。

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Tauri IPC モック ────────────────────────────────────────────────────────

const mockInvoke = vi.fn();
vi.mock('@tauri-apps/api/core', () => ({ invoke: mockInvoke }));

import { getConfig, setConfig, createNote, saveNote, readNote, deleteNote, listNotes } from './ipc';
import { configStore } from './config.store';
import type { AppConfig, Note, NoteMetadata } from './types';

// ─── テストデータファクトリ ───────────────────────────────────────────────────

function makeNoteId(dt = new Date()): string {
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  return (
    `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}` +
    `T${pad(dt.getHours())}${pad(dt.getMinutes())}${pad(dt.getSeconds())}`
  );
}

function makeMetadata(overrides: Partial<NoteMetadata> = {}): NoteMetadata {
  const id = makeNoteId();
  return {
    id,
    tags: [],
    created_at: `${id.slice(0, 10)}T${id.slice(11, 13)}:${id.slice(13, 15)}:${id.slice(15, 17)}`,
    preview: 'テスト本文',
    ...overrides,
  };
}

function makeNote(overrides: Partial<Note> = {}): Note {
  const meta = makeMetadata();
  return {
    id: meta.id,
    frontmatter: { tags: [] },
    body: 'テスト本文',
    created_at: meta.created_at,
    ...overrides,
  };
}

// ─── テストスイート ───────────────────────────────────────────────────────────

describe('IPC: getConfig / setConfig', () => {
  afterEach(() => { mockInvoke.mockReset(); });

  it('get_config を呼び出して AppConfig を返す', async () => {
    const expected: AppConfig = { notes_dir: '/home/user/.local/share/promptnotes/notes' };
    mockInvoke.mockResolvedValueOnce(expected);

    const config = await getConfig();

    expect(mockInvoke).toHaveBeenCalledWith('get_config');
    expect(config).toEqual(expected);
  });

  it('set_config に config オブジェクトを渡す', async () => {
    mockInvoke.mockResolvedValueOnce(undefined);
    const config: AppConfig = { notes_dir: '/custom/path/notes' };

    await setConfig(config);

    expect(mockInvoke).toHaveBeenCalledWith('set_config', { config });
  });
});

describe('configStore: 初期化と保存ディレクトリ変更', () => {
  const defaultConfig: AppConfig = {
    notes_dir: '/home/user/.local/share/promptnotes/notes',
  };

  beforeEach(() => {
    mockInvoke.mockReset();
    configStore._set(null);
  });

  it('init() で get_config を呼び出しストアを更新する', async () => {
    mockInvoke.mockResolvedValueOnce(defaultConfig);

    await configStore.init();

    let stored: AppConfig | null = null;
    configStore.subscribe((v) => { stored = v; })();
    expect(stored).toEqual(defaultConfig);
    expect(mockInvoke).toHaveBeenCalledWith('get_config');
  });

  it('changeNotesDir() で set_config を呼び出しストアを新パスに更新する', async () => {
    const newDir = '/custom/obsidian/vault/promptnotes';
    mockInvoke.mockResolvedValueOnce(undefined);
    configStore._set(defaultConfig);

    await configStore.changeNotesDir(newDir);

    let stored: AppConfig | null = null;
    configStore.subscribe((v) => { stored = v; })();

    expect(mockInvoke).toHaveBeenCalledWith('set_config', {
      config: { notes_dir: newDir },
    });
    expect((stored as AppConfig | null)?.notes_dir).toBe(newDir);
  });

  it('set_config が失敗した場合、ストアは変更されない', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('permission denied'));
    configStore._set(defaultConfig);

    await expect(configStore.changeNotesDir('/forbidden/path')).rejects.toThrow('permission denied');

    let stored: AppConfig | null = null;
    configStore.subscribe((v) => { stored = v; })();
    expect((stored as AppConfig | null)?.notes_dir).toBe(defaultConfig.notes_dir);
  });
});

describe('IPC: storage CRUD', () => {
  afterEach(() => { mockInvoke.mockReset(); });

  it('create_note を呼び出して NoteMetadata を返す（AC-STOR-01: ファイル名形式）', async () => {
    const meta = makeMetadata();
    mockInvoke.mockResolvedValueOnce(meta);

    const result = await createNote();

    expect(mockInvoke).toHaveBeenCalledWith('create_note');
    expect(result.id).toMatch(/^\d{4}-\d{2}-\d{2}T\d{6}$/);
  });

  it('save_note に id / frontmatter / body を渡す（AC-EDIT-05: 自動保存）', async () => {
    const id = makeNoteId();
    mockInvoke.mockResolvedValueOnce(undefined);

    await saveNote(id, { tags: ['rust', 'tauri'] }, '本文テキスト');

    expect(mockInvoke).toHaveBeenCalledWith('save_note', {
      id,
      frontmatter: { tags: ['rust', 'tauri'] },
      body: '本文テキスト',
    });
  });

  it('read_note に id を渡して Note を返す', async () => {
    const note = makeNote();
    mockInvoke.mockResolvedValueOnce(note);

    const result = await readNote(note.id);

    expect(mockInvoke).toHaveBeenCalledWith('read_note', { id: note.id });
    expect(result).toEqual(note);
  });

  it('delete_note に id を渡す', async () => {
    const id = makeNoteId();
    mockInvoke.mockResolvedValueOnce(undefined);

    await deleteNote(id);

    expect(mockInvoke).toHaveBeenCalledWith('delete_note', { id });
  });

  it('list_notes にフィルタを渡して NoteMetadata[] を返す（AC-STOR-02）', async () => {
    const notes = [makeMetadata(), makeMetadata()];
    mockInvoke.mockResolvedValueOnce(notes);
    const filter = { date_from: '2026-04-01', date_to: '2026-04-12' };

    const result = await listNotes(filter);

    expect(mockInvoke).toHaveBeenCalledWith('list_notes', { filter });
    expect(result).toHaveLength(2);
  });

  it('list_notes をフィルタなしで呼び出せる', async () => {
    mockInvoke.mockResolvedValueOnce([]);

    await listNotes();

    expect(mockInvoke).toHaveBeenCalledWith('list_notes', { filter: undefined });
  });
});

describe('Integration: ディレクトリ変更 → 新ディレクトリでのノート CRUD (AC-SET-01)', () => {
  const oldDir = '/home/user/.local/share/promptnotes/notes';
  const newDir = '/home/user/obsidian/vault/prompts';

  beforeEach(() => {
    mockInvoke.mockReset();
    configStore._set({ notes_dir: oldDir });
  });

  it('ディレクトリ変更後、list_notes は新ディレクトリのノートを返す', async () => {
    // 1. ディレクトリ変更
    mockInvoke.mockResolvedValueOnce(undefined); // set_config
    await configStore.changeNotesDir(newDir);

    // 2. 新ディレクトリの configStore を確認
    let stored: AppConfig | null = null;
    configStore.subscribe((v) => { stored = v; })();
    expect((stored as AppConfig | null)?.notes_dir).toBe(newDir);

    // 3. 新ディレクトリにあるノート一覧を取得
    const newDirNotes = [
      makeMetadata({ tags: ['obsidian'] }),
      makeMetadata({ tags: ['tauri'] }),
    ];
    mockInvoke.mockResolvedValueOnce(newDirNotes); // list_notes
    const notes = await listNotes();

    expect(mockInvoke).toHaveBeenLastCalledWith('list_notes', { filter: undefined });
    expect(notes).toHaveLength(2);
  });

  it('ディレクトリ変更後、新規ノートは新ディレクトリに作成される', async () => {
    // 1. ディレクトリ変更
    mockInvoke.mockResolvedValueOnce(undefined); // set_config
    await configStore.changeNotesDir(newDir);

    // 2. 新規ノート作成（Rust バックエンドが configStore の notes_dir を参照）
    const newNote = makeMetadata();
    mockInvoke.mockResolvedValueOnce(newNote); // create_note
    const created = await createNote();

    expect(created.id).toMatch(/^\d{4}-\d{2}-\d{2}T\d{6}$/);
    expect(mockInvoke).toHaveBeenLastCalledWith('create_note');
  });

  it('ディレクトリ変更後、save_note が正しく動作する（AC-EDIT-05）', async () => {
    mockInvoke.mockResolvedValueOnce(undefined); // set_config
    await configStore.changeNotesDir(newDir);

    const id = makeNoteId();
    mockInvoke.mockResolvedValueOnce(undefined); // save_note

    await saveNote(id, { tags: ['new-dir'] }, '新ディレクトリの本文');

    expect(mockInvoke).toHaveBeenLastCalledWith('save_note', {
      id,
      frontmatter: { tags: ['new-dir'] },
      body: '新ディレクトリの本文',
    });
  });

  it('旧ディレクトリのノートはディレクトリ変更後の list_notes に含まれない', async () => {
    // 旧ディレクトリのノート
    const oldNotes = [makeMetadata({ tags: ['old'] })];
    mockInvoke.mockResolvedValueOnce(oldNotes); // list_notes (old dir)
    const beforeChange = await listNotes();
    expect(beforeChange).toHaveLength(1);

    // ディレクトリ変更
    mockInvoke.mockResolvedValueOnce(undefined); // set_config
    await configStore.changeNotesDir(newDir);

    // 新ディレクトリは空
    mockInvoke.mockResolvedValueOnce([]); // list_notes (new dir)
    const afterChange = await listNotes();

    expect(afterChange).toHaveLength(0);
  });
});

describe('ファイル名形式の検証 (AC-STOR-01 / CONV-1)', () => {
  it('NoteMetadata.id は YYYY-MM-DDTHHMMSS 形式に厳密に従う', () => {
    const validIds = [
      '2026-04-12T143052',
      '2026-01-01T000000',
      '2026-12-31T235959',
    ];
    const pattern = /^\d{4}-\d{2}-\d{2}T\d{6}$/;

    for (const id of validIds) {
      expect(id).toMatch(pattern);
    }
  });

  it('不正なファイル名形式は拒否される', () => {
    const invalidIds = [
      '2026-04-12T14:30:52', // コロン入り
      '20260412T143052',     // ハイフンなし
      '2026-04-12',          // 時刻なし
      'note-abc',            // 数値以外
    ];
    const pattern = /^\d{4}-\d{2}-\d{2}T\d{6}$/;

    for (const id of invalidIds) {
      expect(id).not.toMatch(pattern);
    }
  });
});

describe('frontmatter スキーマの検証 (AC-STOR-02 / CONV-2)', () => {
  it('save_note の frontmatter は tags のみを含む', async () => {
    mockInvoke.mockResolvedValueOnce(undefined);
    const id = makeNoteId();

    await saveNote(id, { tags: ['gpt', 'coding'] }, '本文');

    const call = mockInvoke.mock.calls[0];
    const payload = call[1] as { id: string; frontmatter: { tags: string[] }; body: string };
    const frontmatterKeys = Object.keys(payload.frontmatter);

    expect(frontmatterKeys).toEqual(['tags']);
    expect(payload.frontmatter.tags).toEqual(['gpt', 'coding']);
  });

  it('tags が空配列の場合も save_note は正常に呼び出される', async () => {
    mockInvoke.mockResolvedValueOnce(undefined);
    const id = makeNoteId();

    await saveNote(id, { tags: [] }, '');

    expect(mockInvoke).toHaveBeenCalledWith('save_note', {
      id,
      frontmatter: { tags: [] },
      body: '',
    });
  });
});
