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

// @generated Sprint-23 Task-23-1 — Unit tests for mock-invoke infrastructure
import { describe, it, expect, beforeEach } from 'vitest';
import { createMockInvoke } from './mock-invoke';
import type { MockInvokeResult } from './mock-invoke';

describe('createMockInvoke — initialization', () => {
  it('creates with default empty state', () => {
    const mock = createMockInvoke();
    expect(mock.getNoteCount()).toBe(0);
    expect(mock.getConfig().notes_dir).toBe('/mock/data/promptnotes/notes/');
  });

  it('initializes with provided notes', () => {
    const mock = createMockInvoke({
      initialNotes: [
        { filename: '2026-04-04T143052.md', content: 'content' },
      ],
    });
    expect(mock.getNoteCount()).toBe(1);
  });

  it('initializes with custom config', () => {
    const mock = createMockInvoke({
      initialConfig: { notes_dir: '/custom/' },
    });
    expect(mock.getConfig().notes_dir).toBe('/custom/');
  });
});

describe('createMockInvoke — invocation tracking', () => {
  let mock: MockInvokeResult;

  beforeEach(() => {
    mock = createMockInvoke({
      nowFn: () => new Date(2026, 3, 4, 14, 30, 52),
    });
  });

  it('records all invocations', async () => {
    await mock.invoke('create_note');
    await mock.invoke('get_config');
    expect(mock.getInvocations()).toHaveLength(2);
    expect(mock.getInvocations()[0].cmd).toBe('create_note');
    expect(mock.getInvocations()[1].cmd).toBe('get_config');
  });

  it('clears invocation history', async () => {
    await mock.invoke('create_note');
    mock.clearInvocations();
    expect(mock.getInvocations()).toHaveLength(0);
  });

  it('records args for each invocation', async () => {
    await mock.invoke('save_note', {
      filename: '2026-04-04T143052.md',
      content: 'test',
    });
    // Need to create the note first
    mock.setNote('2026-04-04T143052.md', 'old');
    mock.clearInvocations();
    await mock.invoke('save_note', {
      filename: '2026-04-04T143052.md',
      content: 'test',
    });
    expect(mock.getInvocations()[0].args).toEqual({
      filename: '2026-04-04T143052.md',
      content: 'test',
    });
  });
});

describe('createMockInvoke — helper methods', () => {
  it('setNote adds a note bypassing IPC', () => {
    const mock = createMockInvoke();
    mock.setNote('2026-04-04T143052.md', 'direct content');
    expect(mock.getNoteCount()).toBe(1);
    expect(mock.getNotes().get('2026-04-04T143052.md')).toBe('direct content');
  });

  it('removeNote deletes a note', () => {
    const mock = createMockInvoke({
      initialNotes: [
        { filename: '2026-04-04T143052.md', content: 'content' },
      ],
    });
    expect(mock.removeNote('2026-04-04T143052.md')).toBe(true);
    expect(mock.getNoteCount()).toBe(0);
  });

  it('removeNote returns false for non-existent note', () => {
    const mock = createMockInvoke();
    expect(mock.removeNote('2099-01-01T000000.md')).toBe(false);
  });

  it('getNotes returns a copy', () => {
    const mock = createMockInvoke({
      initialNotes: [
        { filename: '2026-04-04T143052.md', content: 'content' },
      ],
    });
    const notes = mock.getNotes();
    notes.delete('2026-04-04T143052.md');
    expect(mock.getNoteCount()).toBe(1);
  });
});

describe('createMockInvoke — unknown command', () => {
  it('throws for unknown IPC commands', async () => {
    const mock = createMockInvoke();
    await expect(mock.invoke('unknown_command')).rejects.toThrow(
      'Unknown IPC command',
    );
  });
});

describe('createMockInvoke — frontmatter parsing', () => {
  it('parses tags from standard frontmatter', async () => {
    const mock = createMockInvoke({
      initialNotes: [
        {
          filename: '2026-04-04T143052.md',
          content: '---\ntags: [gpt, coding]\n---\n\nBody',
        },
      ],
    });

    const results = await mock.invoke<
      Array<{ tags: string[] }>
    >('list_notes', {});
    expect(results[0].tags).toEqual(['gpt', 'coding']);
  });

  it('returns empty tags when no frontmatter', async () => {
    const mock = createMockInvoke({
      initialNotes: [
        { filename: '2026-04-04T143052.md', content: 'No frontmatter' },
      ],
    });

    const results = await mock.invoke<
      Array<{ tags: string[] }>
    >('list_notes', {});
    expect(results[0].tags).toEqual([]);
  });

  it('returns empty tags for empty tags array', async () => {
    const mock = createMockInvoke({
      initialNotes: [
        {
          filename: '2026-04-04T143052.md',
          content: '---\ntags: []\n---\n\nBody',
        },
      ],
    });

    const results = await mock.invoke<
      Array<{ tags: string[] }>
    >('list_notes', {});
    expect(results[0].tags).toEqual([]);
  });
});

describe('createMockInvoke — body preview extraction', () => {
  it('extracts body preview excluding frontmatter', async () => {
    const mock = createMockInvoke({
      initialNotes: [
        {
          filename: '2026-04-04T143052.md',
          content: '---\ntags: []\n---\n\nThis is the body text',
        },
      ],
    });

    const results = await mock.invoke<
      Array<{ body_preview: string }>
    >('list_notes', {});
    expect(results[0].body_preview).toBe('This is the body text');
  });

  it('truncates body preview to 200 characters', async () => {
    const longBody = 'A'.repeat(300);
    const mock = createMockInvoke({
      initialNotes: [
        {
          filename: '2026-04-04T143052.md',
          content: `---\ntags: []\n---\n\n${longBody}`,
        },
      ],
    });

    const results = await mock.invoke<
      Array<{ body_preview: string }>
    >('list_notes', {});
    expect(results[0].body_preview).toHaveLength(200);
  });
});
