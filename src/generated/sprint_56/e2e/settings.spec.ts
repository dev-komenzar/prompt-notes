// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 56-2
// @task-title: 全 E2E テスト通過
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/test/acceptance_criteria.md
// @generated-by: codd propagate
import { test, expect } from '@playwright/test';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { waitForAppReady, invokeTauriCommand } from './helpers/app-launch';
import { getDefaultNotesDir } from './helpers/test-data';

test.describe('settings – API integration', () => {
  let originalNotesDir: string;

  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
    const settings = await invokeTauriCommand<{ notes_dir: string }>(page, 'get_settings');
    originalNotesDir = settings.notes_dir;
  });

  test.afterEach(async ({ page }) => {
    // restore original directory after each test
    await invokeTauriCommand(page, 'update_settings', { notes_dir: originalNotesDir });
  });

  // AC-CF-01: get_settings returns current notes_dir
  test('AC-CF-01: get_settings returns non-empty notes_dir', async ({ page }) => {
    const { notes_dir } = await invokeTauriCommand<{ notes_dir: string }>(page, 'get_settings');
    expect(typeof notes_dir).toBe('string');
    expect(notes_dir.length).toBeGreaterThan(0);
  });

  // AC-ST-04: update_settings changes notes_dir; new notes appear in new dir
  test('AC-ST-04: update_settings persists new directory and new notes use it', async ({ page }) => {
    const tmpDir = path.join(os.tmpdir(), `promptnotes-test-${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });

    try {
      const result = await invokeTauriCommand<{ success: boolean }>(
        page, 'update_settings', { notes_dir: tmpDir }
      );
      expect(result.success).toBe(true);

      const verify = await invokeTauriCommand<{ notes_dir: string }>(page, 'get_settings');
      expect(verify.notes_dir).toBe(tmpDir);

      const { filename } = await invokeTauriCommand<{ filename: string }>(page, 'create_note');
      const filePath = path.join(tmpDir, filename);
      expect(fs.existsSync(filePath), `New note must be in new dir ${tmpDir}`).toBe(true);
      await invokeTauriCommand(page, 'delete_note', { filename });
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  // Platform default path validation
  test('AC-ST-03: default path conforms to platform-specific convention', async ({ page }) => {
    const { notes_dir } = await invokeTauriCommand<{ notes_dir: string }>(page, 'get_settings');
    if (process.platform === 'linux') {
      expect(notes_dir).toContain(path.join('.local', 'share', 'promptnotes', 'notes'));
    } else if (process.platform === 'darwin') {
      expect(notes_dir).toContain(path.join('Library', 'Application Support', 'promptnotes', 'notes'));
    }
  });

  // update_settings with non-existent directory should still succeed (auto-creates)
  test('update_settings with new non-existent directory should work (auto-create)', async ({ page }) => {
    const tmpDir = path.join(os.tmpdir(), `promptnotes-autocreate-${Date.now()}`, 'subdir');
    expect(fs.existsSync(tmpDir)).toBe(false);

    try {
      const result = await invokeTauriCommand<{ success: boolean }>(
        page, 'update_settings', { notes_dir: tmpDir }
      );
      expect(result.success).toBe(true);
      const { filename } = await invokeTauriCommand<{ filename: string }>(page, 'create_note');
      expect(fs.existsSync(path.join(tmpDir, filename))).toBe(true);
      await invokeTauriCommand(page, 'delete_note', { filename });
    } finally {
      fs.rmSync(path.dirname(tmpDir), { recursive: true, force: true });
    }
  });
});
