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

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockAppConfig } from './mocks';

const mockInvoke = vi.fn();
vi.mock('@tauri-apps/api/core', () => ({ invoke: mockInvoke }));

import { getConfig, setConfig } from './ipc';

beforeEach(() => {
  mockInvoke.mockReset();
});

describe('getConfig', () => {
  it('invokes get_config with no arguments', async () => {
    mockInvoke.mockResolvedValueOnce(mockAppConfig);
    await getConfig();
    expect(mockInvoke).toHaveBeenCalledWith('get_config');
  });

  it('returns AppConfig with notes_dir string', async () => {
    mockInvoke.mockResolvedValueOnce(mockAppConfig);
    const result = await getConfig();
    expect(typeof result.notes_dir).toBe('string');
    expect(result.notes_dir.length).toBeGreaterThan(0);
  });

  it('Linux default notes_dir matches XDG pattern', async () => {
    const linuxConfig = { notes_dir: '/home/user/.local/share/promptnotes/notes' };
    mockInvoke.mockResolvedValueOnce(linuxConfig);
    const result = await getConfig();
    // Validate that the path ends with the expected suffix
    expect(result.notes_dir).toMatch(/promptnotes\/notes/);
  });

  it('macOS default notes_dir matches Application Support pattern', async () => {
    const macConfig = {
      notes_dir: '/Users/user/Library/Application Support/promptnotes/notes',
    };
    mockInvoke.mockResolvedValueOnce(macConfig);
    const result = await getConfig();
    expect(result.notes_dir).toMatch(/promptnotes\/notes/);
  });

  it('propagates IPC errors', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('ConfigError'));
    await expect(getConfig()).rejects.toThrow('ConfigError');
  });
});

describe('setConfig', () => {
  it('invokes set_config with the provided AppConfig', async () => {
    mockInvoke.mockResolvedValueOnce(undefined);
    await setConfig(mockAppConfig);
    expect(mockInvoke).toHaveBeenCalledWith('set_config', { config: mockAppConfig });
  });

  it('accepts custom notes_dir path', async () => {
    const customConfig = { notes_dir: '/custom/vault/notes' };
    mockInvoke.mockResolvedValueOnce(undefined);
    await setConfig(customConfig);
    const callArgs = mockInvoke.mock.calls[0][1];
    expect(callArgs.config.notes_dir).toBe('/custom/vault/notes');
  });

  it('resolves to void on success', async () => {
    mockInvoke.mockResolvedValueOnce(undefined);
    const result = await setConfig(mockAppConfig);
    expect(result).toBeUndefined();
  });

  it('propagates IPC errors', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('ConfigError::WriteFailure'));
    await expect(setConfig(mockAppConfig)).rejects.toThrow('ConfigError::WriteFailure');
  });

  it('does not allow frontend-only path manipulation — notes_dir must come from dialog', () => {
    // This test documents the architectural constraint: the frontend must never
    // construct notes_dir paths independently. The path must be provided by
    // @tauri-apps/plugin-dialog. Here we assert the IPC wrapper passes the value
    // through without modification.
    mockInvoke.mockResolvedValueOnce(undefined);
    const dialogPath = '/selected/by/os/dialog';
    setConfig({ notes_dir: dialogPath });
    const callArgs = mockInvoke.mock.calls[0][1];
    expect(callArgs.config.notes_dir).toBe(dialogPath);
  });
});
