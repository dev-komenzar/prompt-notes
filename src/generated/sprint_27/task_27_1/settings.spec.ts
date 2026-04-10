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

test.describe('Settings API integration', () => {
  let originalNotesDir: string;

  test.beforeAll(async () => {
    const settings = await invoke<{ notes_dir: string }>('get_settings');
    originalNotesDir = settings.notes_dir;
  });

  test.afterAll(async () => {
    await invoke('update_settings', { notes_dir: originalNotesDir });
  });

  test('AC-CF-01: get_settings returns notes_dir', async () => {
    const settings = await invoke<{ notes_dir: string }>('get_settings');
    expect(typeof settings.notes_dir).toBe('string');
    expect(settings.notes_dir.length).toBeGreaterThan(0);
  });

  test('AC-CF-01 / AC-ST-04: update_settings persists notes_dir change', async () => {
    const newDir = '/tmp/promptnotes-settings-test';
    const result = await invoke<{ success: boolean }>('update_settings', { notes_dir: newDir });
    expect(result.success).toBe(true);

    const updated = await invoke<{ notes_dir: string }>('get_settings');
    expect(updated.notes_dir).toBe(newDir);
  });

  test('settings are persisted across get_settings calls', async () => {
    const dir1 = '/tmp/pn-settings-persist-1';
    await invoke('update_settings', { notes_dir: dir1 });
    const r1 = await invoke<{ notes_dir: string }>('get_settings');
    expect(r1.notes_dir).toBe(dir1);

    const r2 = await invoke<{ notes_dir: string }>('get_settings');
    expect(r2.notes_dir).toBe(dir1);
  });
});
