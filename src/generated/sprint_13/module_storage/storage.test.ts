// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 13-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/storage_fileformat_design.md
// @generated-by: codd implement --sprint 13

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockNoteMetadata, mockNote, mockNoteFilter, VALID_NOTE_ID } from './mocks';

// Tauri invoke is mocked before importing ipc wrappers.
const mockInvoke = vi.fn();
vi.mock('@tauri-apps/api/core', () => ({ invoke: mockInvoke }));

import {
  createNote,
  saveNote,
  readNote,
  deleteNote,
  listNotes,
} from './ipc';

beforeEach(() => {
  mockInvoke.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createNote', () => {
  it('invokes create_note with no arguments and returns NoteMetadata', async () => {
    mockInvoke.mockResolvedValueOnce(mockNoteMetadata);
    const result = await createNote();
    expect(mockInvoke).toHaveBeenCalledOnce();
    expect(mockInvoke).toHaveBeenCalledWith('create_note');
    expect(result).toEqual(mockNoteMetadata);
  });

  it('returned id matches YYYY-MM-DDTHHMMSS format', async () => {
    mockInvoke.mockResolvedValueOnce(mockNoteMetadata);
    const result = await createNote();
    expect(result.id).toMatch(/^\d{4}-\d{2}-\d{2}T\d{6}$/);
  });

  it('propagates IPC errors', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('StorageError::DirectoryCreation'));
    await expect(createNote()).rejects.toThrow('StorageError::DirectoryCreation');
  });
});

describe('saveNote', () => {
  it('invokes save_note with correct arguments', async () => {
    mockInvoke.mockResolvedValueOnce(undefined);
    await saveNote(VALID_NOTE_ID, { tags: ['rust'] }, 'Body text.');
    expect(mockInvoke).toHaveBeenCalledWith('save_note', {
      id: VALID_NOTE_ID,
      frontmatter: { tags: ['rust'] },
      body: 'Body text.',
    });
  });

  it('accepts empty tags array', async () => {
    mockInvoke.mockResolvedValueOnce(undefined);
    await saveNote(VALID_NOTE_ID, { tags: [] }, '');
    expect(mockInvoke).toHaveBeenCalledWith('save_note', {
      id: VALID_NOTE_ID,
      frontmatter: { tags: [] },
      body: '',
    });
  });

  it('resolves to void on success', async () => {
    mockInvoke.mockResolvedValueOnce(undefined);
    const result = await saveNote(VALID_NOTE_ID, { tags: [] }, 'x');
    expect(result).toBeUndefined();
  });

  it('propagates StorageError::NotFound', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('StorageError::NotFound'));
    await expect(saveNote('nonexistent', { tags: [] }, 'x')).rejects.toThrow(
      'StorageError::NotFound',
    );
  });
});

describe('readNote', () => {
  it('invokes read_note with the note id', async () => {
    mockInvoke.mockResolvedValueOnce(mockNote);
    const result = await readNote(VALID_NOTE_ID);
    expect(mockInvoke).toHaveBeenCalledWith('read_note', { id: VALID_NOTE_ID });
    expect(result).toEqual(mockNote);
  });

  it('returned note contains frontmatter with tags only', async () => {
    mockInvoke.mockResolvedValueOnce(mockNote);
    const result = await readNote(VALID_NOTE_ID);
    expect(Array.isArray(result.frontmatter.tags)).toBe(true);
    expect('title' in result.frontmatter).toBe(false);
    expect('created_at' in result.frontmatter).toBe(false);
  });

  it('propagates IPC errors', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('StorageError::NotFound'));
    await expect(readNote('missing-id')).rejects.toThrow('StorageError::NotFound');
  });
});

describe('deleteNote', () => {
  it('invokes delete_note with the note id', async () => {
    mockInvoke.mockResolvedValueOnce(undefined);
    await deleteNote(VALID_NOTE_ID);
    expect(mockInvoke).toHaveBeenCalledWith('delete_note', { id: VALID_NOTE_ID });
  });

  it('resolves to void on success', async () => {
    mockInvoke.mockResolvedValueOnce(undefined);
    const result = await deleteNote(VALID_NOTE_ID);
    expect(result).toBeUndefined();
  });

  it('propagates StorageError::NotFound for missing note', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('StorageError::NotFound'));
    await expect(deleteNote('ghost-id')).rejects.toThrow('StorageError::NotFound');
  });
});

describe('listNotes', () => {
  const metadataList = [mockNoteMetadata];

  it('invokes list_notes without filter when called with no arguments', async () => {
    mockInvoke.mockResolvedValueOnce(metadataList);
    await listNotes();
    expect(mockInvoke).toHaveBeenCalledWith('list_notes', { filter: undefined });
  });

  it('invokes list_notes with provided filter', async () => {
    mockInvoke.mockResolvedValueOnce(metadataList);
    await listNotes(mockNoteFilter);
    expect(mockInvoke).toHaveBeenCalledWith('list_notes', { filter: mockNoteFilter });
  });

  it('returns an array of NoteMetadata', async () => {
    mockInvoke.mockResolvedValueOnce(metadataList);
    const result = await listNotes();
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].id).toBe(VALID_NOTE_ID);
    expect(Array.isArray(result[0].tags)).toBe(true);
    expect(typeof result[0].preview).toBe('string');
  });

  it('returns empty array when no notes match', async () => {
    mockInvoke.mockResolvedValueOnce([]);
    const result = await listNotes({ tags: ['nonexistent-tag'] });
    expect(result).toHaveLength(0);
  });

  it('filter tags use AND semantics — passes tag array as-is to backend', async () => {
    mockInvoke.mockResolvedValueOnce([]);
    await listNotes({ tags: ['rust', 'tauri'] });
    const callArgs = mockInvoke.mock.calls[0][1];
    expect(callArgs.filter.tags).toEqual(['rust', 'tauri']);
  });

  it('preview field is at most 100 characters', async () => {
    const longPreview = { ...mockNoteMetadata, preview: 'x'.repeat(100) };
    mockInvoke.mockResolvedValueOnce([longPreview]);
    const result = await listNotes();
    expect(result[0].preview.length).toBeLessThanOrEqual(100);
  });
});
