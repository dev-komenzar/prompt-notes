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
import * as path from 'path';
import * as fs from 'fs';
import { APP_URL, waitForAppReady, invokeTauriCommand } from './helpers/app-launch';
import { getDefaultNotesDir, createNoteViaIpc, deleteNoteViaIpc, makeCleanup } from './helpers/test-data';
import { assertValidFilename, assertFrontmatterTagsOnly } from './helpers/assertions';

test.describe('editor – API integration', () => {
  let notesDir: string;

  test.beforeEach(async ({ page }) => {
    notesDir = getDefaultNotesDir();
    await waitForAppReady(page);
  });

  // AC-ST-01 / AC-ED-06: create_note returns YYYY-MM-DDTHHMMSS.md filename
  test('create_note returns valid YYYY-MM-DDTHHMMSS.md filename', async ({ page }) => {
    const result = await invokeTauriCommand<{ filename: string }>(page, 'create_note');
    assertValidFilename(result.filename);
    const fullPath = path.join(notesDir, result.filename);
    expect(fs.existsSync(fullPath), `File ${fullPath} must exist after create_note`).toBe(true);
    await invokeTauriCommand(page, 'delete_note', { filename: result.filename });
  });

  // AC-ED-06 / AC-ST-02: save_note writes correct frontmatter + body
  test('save_note writes YAML frontmatter with tags only + body', async ({ page }) => {
    const { filename } = await invokeTauriCommand<{ filename: string }>(page, 'create_note');
    const tags = ['prompt', 'e2e-test'];
    const body = 'E2E auto-save test body content';
    const result = await invokeTauriCommand<{ success: boolean }>(page, 'save_note', {
      filename,
      frontmatter: { tags },
      body,
    });
    expect(result.success).toBe(true);
    const filePath = path.join(notesDir, filename);
    assertFrontmatterTagsOnly(filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain(body);
    await invokeTauriCommand(page, 'delete_note', { filename });
  });

  // AC-ED-06: read_note returns frontmatter + body correctly
  test('read_note returns correct frontmatter and body', async ({ page }) => {
    const { filename } = await invokeTauriCommand<{ filename: string }>(page, 'create_note');
    const tags = ['reading-test'];
    const body = 'Body for read_note test';
    await invokeTauriCommand(page, 'save_note', { filename, frontmatter: { tags }, body });
    const data = await invokeTauriCommand<{ frontmatter: { tags: string[] }; body: string }>(
      page, 'read_note', { filename }
    );
    expect(data.frontmatter.tags).toEqual(tags);
    expect(data.body.trim()).toBe(body.trim());
    await invokeTauriCommand(page, 'delete_note', { filename });
  });

  // FC-ST-03: save_note must NOT add extra frontmatter fields
  test('save_note must not inject extra frontmatter fields (FC-ST-03)', async ({ page }) => {
    const { filename } = await invokeTauriCommand<{ filename: string }>(page, 'create_note');
    await invokeTauriCommand(page, 'save_note', {
      filename,
      frontmatter: { tags: ['guard'] },
      body: 'Guard test',
    });
    const filePath = path.join(notesDir, filename);
    assertFrontmatterTagsOnly(filePath);
    await invokeTauriCommand(page, 'delete_note', { filename });
  });

  // FC-ST-01: filename must be YYYY-MM-DDTHHMMSS.md (negative: ensure UUID / sequential names not used)
  test('create_note filename must NOT be UUID or sequential (FC-ST-01)', async ({ page }) => {
    const { filename } = await invokeTauriCommand<{ filename: string }>(page, 'create_note');
    expect(filename, 'Filename must not be a UUID').not.toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.md$/
    );
    expect(filename, 'Filename must not be a sequential number').not.toMatch(/^\d+\.md$/);
    assertValidFilename(filename);
    await invokeTauriCommand(page, 'delete_note', { filename });
  });

  // AC-ST-03: default notes dir exists on this platform
  test('get_settings returns platform-appropriate default notes_dir (AC-ST-03)', async ({ page }) => {
    const settings = await invokeTauriCommand<{ notes_dir: string }>(page, 'get_settings');
    expect(typeof settings.notes_dir).toBe('string');
    expect(settings.notes_dir.length).toBeGreaterThan(0);
    if (process.platform === 'linux') {
      expect(settings.notes_dir).toContain('promptnotes/notes');
    } else if (process.platform === 'darwin') {
      expect(settings.notes_dir).toContain('promptnotes/notes');
    }
  });
});
