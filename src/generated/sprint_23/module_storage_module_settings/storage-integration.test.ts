// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 23-1
// @task-title: `module:storage`, `module:settings`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated Sprint-23 Task-23-1 — Integration tests for module:storage end-to-end flows
import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNote,
  saveNote,
  readNote,
  deleteNote,
  listNotes,
  searchNotes,
  setInvoke,
} from './api';
import { createMockInvoke } from './mock-invoke';
import { createFrontmatterTemplate, buildNoteContent } from './frontmatter-utils';
import { getDefaultDateRange } from './date-utils';
import { isValidNoteFilename, extractIsoDatetime } from './filename-utils';
import type { MockInvokeResult } from './mock-invoke';

describe('storage integration — full note lifecycle', () => {
  let mock: MockInvokeResult;

  beforeEach(() => {
    mock = createMockInvoke({
      nowFn: () => new Date(2026, 3, 4, 14, 30, 52),
    });
    setInvoke(mock.invoke);
  });

  it('create → save → read → delete', async () => {
    // Step 1: Create
    const created = await createNote();
    expect(isValidNoteFilename(created.filename)).toBe(true);
    expect(mock.getNoteCount()).toBe(1);

    // Step 2: Save with content
    const content = buildNoteContent(['gpt', 'test'], 'Integration test body');
    await saveNote({ filename: created.filename, content });

    // Step 3: Read back
    const read = await readNote({ filename: created.filename });
    expect(read.content).toBe(content);

    // Step 4: Delete
    await deleteNote({ filename: created.filename });
    expect(mock.getNoteCount()).toBe(0);
  });

  it('create → edit multiple times → read returns latest', async () => {
    const created = await createNote();

    await saveNote({
      filename: created.filename,
      content: buildNoteContent([], 'Version 1'),
    });
    await saveNote({
      filename: created.filename,
      content: buildNoteContent([], 'Version 2'),
    });
    await saveNote({
      filename: created.filename,
      content: buildNoteContent(['final'], 'Version 3'),
    });

    const read = await readNote({ filename: created.filename });
    expect(read.content).toContain('Version 3');
    expect(read.content).toContain('final');
  });
});

describe('storage integration — grid view default filter', () => {
  let mock: MockInvokeResult;

  beforeEach(() => {
    mock = createMockInvoke({
      initialNotes: [
        {
          filename: '2026-04-04T100000.md',
          content: buildNoteContent(['recent'], 'Today note'),
        },
        {
          filename: '2026-04-01T100000.md',
          content: buildNoteContent(['recent'], 'Three days ago'),
        },
        {
          filename: '2026-03-20T100000.md',
          content: buildNoteContent(['old'], 'Fifteen days ago'),
        },
      ],
    });
    setInvoke(mock.invoke);
  });

  it('default 7-day range filters correctly', async () => {
    const range = getDefaultDateRange(new Date(2026, 3, 5));
    const notes = await listNotes({
      from_date: range.from_date,
      to_date: range.to_date,
    });

    expect(notes).toHaveLength(2);
    expect(notes.some((n) => n.filename === '2026-04-04T100000.md')).toBe(true);
    expect(notes.some((n) => n.filename === '2026-04-01T100000.md')).toBe(true);
    expect(notes.some((n) => n.filename === '2026-03-20T100000.md')).toBe(false);
  });
});

describe('storage integration — search with filters', () => {
  let mock: MockInvokeResult;

  beforeEach(() => {
    mock = createMockInvoke({
      initialNotes: [
        {
          filename: '2026-04-01T090000.md',
          content: buildNoteContent(['gpt'], 'Using GPT for code review'),
        },
        {
          filename: '2026-04-02T100000.md',
          content: buildNoteContent(['rust'], 'Rust ownership model explained'),
        },
        {
          filename: '2026-04-03T110000.md',
          content: buildNoteContent(['gpt', 'rust'], 'GPT helping with Rust code'),
        },
      ],
    });
    setInvoke(mock.invoke);
  });

  it('search + tag filter narrows results', async () => {
    const results = await searchNotes({ query: 'code', tag: 'gpt' });
    expect(results).toHaveLength(2);
  });

  it('search + date filter narrows results', async () => {
    const results = await searchNotes({
      query: 'Rust',
      from_date: '2026-04-02',
      to_date: '2026-04-02',
    });
    expect(results).toHaveLength(1);
    expect(results[0].filename).toBe('2026-04-02T100000.md');
  });

  it('search + tag + date filter narrows results', async () => {
    const results = await searchNotes({
      query: 'code',
      tag: 'rust',
      from_date: '2026-04-03',
      to_date: '2026-04-03',
    });
    expect(results).toHaveLength(1);
    expect(results[0].filename).toBe('2026-04-03T110000.md');
  });
});

describe('storage integration — filename immutability', () => {
  let mock: MockInvokeResult;

  beforeEach(() => {
    mock = createMockInvoke({
      nowFn: () => new Date(2026, 3, 4, 14, 30, 52),
    });
    setInvoke(mock.invoke);
  });

  it('filename does not change after save operations', async () => {
    const created = await createNote();
    const originalFilename = created.filename;

    await saveNote({
      filename: originalFilename,
      content: buildNoteContent(['edited'], 'Updated content'),
    });

    const notes = mock.getNotes();
    expect(notes.has(originalFilename)).toBe(true);
    expect(notes.size).toBe(1);
  });

  it('created_at in NoteEntry matches filename timestamp', async () => {
    const created = await createNote();
    const notes = await listNotes();
    const entry = notes[0];

    const expectedIso = extractIsoDatetime(created.filename);
    expect(entry.created_at).toBe(expectedIso);
  });
});

describe('storage integration — frontmatter template roundtrip', () => {
  let mock: MockInvokeResult;

  beforeEach(() => {
    mock = createMockInvoke({
      nowFn: () => new Date(2026, 3, 4, 14, 30, 52),
    });
    setInvoke(mock.invoke);
  });

  it('new note starts with correct frontmatter template', async () => {
    const created = await createNote();
    const read = await readNote({ filename: created.filename });
    expect(read.content).toBe(createFrontmatterTemplate());
  });

  it('tags are preserved through save and list', async () => {
    const created = await createNote();
    const content = buildNoteContent(['gpt', 'memo'], 'Tagged note');
    await saveNote({ filename: created.filename, content });

    const notes = await listNotes();
    expect(notes[0].tags).toEqual(['gpt', 'memo']);
  });
});

describe('storage integration — error resilience', () => {
  let mock: MockInvokeResult;

  beforeEach(() => {
    mock = createMockInvoke();
    setInvoke(mock.invoke);
  });

  it('reading deleted note throws', async () => {
    mock.setNote('2026-04-04T143052.md', 'content');
    await deleteNote({ filename: '2026-04-04T143052.md' });
    await expect(
      readNote({ filename: '2026-04-04T143052.md' }),
    ).rejects.toThrow('File not found');
  });

  it('saving with path traversal filename is rejected', async () => {
    await expect(
      saveNote({ filename: '../../../etc/shadow', content: 'hack' }),
    ).rejects.toThrow('Invalid filename');
  });

  it('deleting with invalid filename is rejected', async () => {
    await expect(
      deleteNote({ filename: 'not-a-valid-name.txt' }),
    ).rejects.toThrow('Invalid filename');
  });
});
