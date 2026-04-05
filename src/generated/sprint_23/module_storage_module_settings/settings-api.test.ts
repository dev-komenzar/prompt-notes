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

// @generated Sprint-23 Task-23-1 — Unit tests for module:settings IPC API layer
// CONV: Settings changes via Rust backend. No frontend file path operations.
import { describe, it, expect, beforeEach } from 'vitest';
import { getConfig, setConfig, setInvoke } from './api';
import { createMockInvoke } from './mock-invoke';
import type { MockInvokeResult } from './mock-invoke';

describe('module:settings API — getConfig', () => {
  let mock: MockInvokeResult;

  beforeEach(() => {
    mock = createMockInvoke({
      initialConfig: {
        notes_dir: '/home/user/.local/share/promptnotes/notes/',
      },
    });
    setInvoke(mock.invoke);
  });

  it('calls get_config IPC command', async () => {
    await getConfig();
    const invocations = mock.getInvocations();
    expect(invocations).toHaveLength(1);
    expect(invocations[0].cmd).toBe('get_config');
  });

  it('returns current configuration', async () => {
    const config = await getConfig();
    expect(config.notes_dir).toBe(
      '/home/user/.local/share/promptnotes/notes/',
    );
  });

  it('returns a copy (not reference) of config', async () => {
    const config1 = await getConfig();
    const config2 = await getConfig();
    expect(config1).toEqual(config2);
    expect(config1).not.toBe(config2);
  });
});

describe('module:settings API — setConfig', () => {
  let mock: MockInvokeResult;

  beforeEach(() => {
    mock = createMockInvoke({
      initialConfig: {
        notes_dir: '/home/user/.local/share/promptnotes/notes/',
      },
    });
    setInvoke(mock.invoke);
  });

  it('calls set_config IPC command with notes_dir', async () => {
    await setConfig({ notes_dir: '/new/path/notes/' });
    const invocations = mock.getInvocations();
    expect(invocations).toHaveLength(1);
    expect(invocations[0].cmd).toBe('set_config');
    expect(invocations[0].args).toEqual({ notes_dir: '/new/path/notes/' });
  });

  it('updates the stored configuration', async () => {
    await setConfig({ notes_dir: '/new/path/notes/' });
    const config = mock.getConfig();
    expect(config.notes_dir).toBe('/new/path/notes/');
  });

  it('subsequent getConfig returns updated value', async () => {
    await setConfig({ notes_dir: '/updated/path/' });
    const config = await getConfig();
    expect(config.notes_dir).toBe('/updated/path/');
  });

  it('rejects empty notes_dir', async () => {
    await expect(setConfig({ notes_dir: '' })).rejects.toThrow();
  });

  it('rejects whitespace-only notes_dir', async () => {
    await expect(setConfig({ notes_dir: '   ' })).rejects.toThrow();
  });

  it('new notes use updated directory in path', async () => {
    const customMock = createMockInvoke({
      initialConfig: { notes_dir: '/old/path/' },
      nowFn: () => new Date(2026, 3, 5, 10, 0, 0),
    });
    setInvoke(customMock.invoke);

    await setConfig({ notes_dir: '/new/vault/notes/' });

    const { createNote: createNoteFn } = await import('./api');
    const result = await createNoteFn();
    expect(result.path).toBe('/new/vault/notes/2026-04-05T100000.md');
  });
});

describe('module:settings — default directories', () => {
  it('Linux default: ~/.local/share/promptnotes/notes/', () => {
    const mock = createMockInvoke({
      initialConfig: {
        notes_dir: '/home/testuser/.local/share/promptnotes/notes/',
      },
    });
    expect(mock.getConfig().notes_dir).toBe(
      '/home/testuser/.local/share/promptnotes/notes/',
    );
  });

  it('macOS default: ~/Library/Application Support/promptnotes/notes/', () => {
    const mock = createMockInvoke({
      initialConfig: {
        notes_dir:
          '/Users/testuser/Library/Application Support/promptnotes/notes/',
      },
    });
    expect(mock.getConfig().notes_dir).toBe(
      '/Users/testuser/Library/Application Support/promptnotes/notes/',
    );
  });
});

describe('module:settings — config change does not move existing notes', () => {
  let mock: MockInvokeResult;

  beforeEach(() => {
    mock = createMockInvoke({
      initialConfig: { notes_dir: '/old/path/' },
      initialNotes: [
        {
          filename: '2026-04-04T143052.md',
          content: '---\ntags: []\n---\n\nExisting note',
        },
      ],
      nowFn: () => new Date(2026, 3, 5, 9, 0, 0),
    });
    setInvoke(mock.invoke);
  });

  it('existing notes remain accessible after config change', async () => {
    await setConfig({ notes_dir: '/new/path/' });

    const { readNote: readNoteFn } = await import('./api');
    const result = await readNoteFn({ filename: '2026-04-04T143052.md' });
    expect(result.content).toContain('Existing note');
  });

  it('note count is unchanged after config change', async () => {
    const countBefore = mock.getNoteCount();
    await setConfig({ notes_dir: '/new/path/' });
    expect(mock.getNoteCount()).toBe(countBefore);
  });
});
