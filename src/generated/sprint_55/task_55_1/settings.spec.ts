// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 55-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/test/acceptance_criteria.md
// @generated-by: codd implement --sprint 55

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import {
  setupTestDirs,
  teardownTestDirs,
  TEST_NOTES_DIR_A,
  TEST_NOTES_DIR_B,
  listMdFiles,
} from './helpers/test-data';
import { createRecentNote } from './helpers/note-factory';
import { launchApp, closeApp, invokeCommand, AppContext } from './helpers/app-launch';
import { assertFilenameFormat, assertNoteInDir } from './helpers/assertions';

interface AppConfig {
  notes_dir: string;
}

interface NoteMetadata {
  id: string;
  tags: string[];
  created_at: string;
  preview: string;
}

let appCtx: AppContext;

test.beforeAll(async () => {
  setupTestDirs();
  appCtx = await launchApp();
});

test.afterAll(async () => {
  await closeApp(appCtx);
  teardownTestDirs();
});

test.beforeEach(async () => {
  // Reset to dir A before each test
  await invokeCommand(appCtx.page, 'set_config', { config: { notes_dir: TEST_NOTES_DIR_A } });
});

// AC-SET-01: get_config returns current directory
test('get_config returns the configured notes_dir', async () => {
  const config = await invokeCommand<AppConfig>(appCtx.page, 'get_config');
  expect(config).toHaveProperty('notes_dir');
  expect(typeof config.notes_dir).toBe('string');
  expect(config.notes_dir.length).toBeGreaterThan(0);
});

// AC-SET-01: set_config persists new directory
test('set_config persists new notes_dir and get_config reflects it', async () => {
  await invokeCommand(appCtx.page, 'set_config', { config: { notes_dir: TEST_NOTES_DIR_B } });
  const config = await invokeCommand<AppConfig>(appCtx.page, 'get_config');
  expect(config.notes_dir).toBe(TEST_NOTES_DIR_B);
});

// AC-SET-01 / FC-SET-02: after directory change, create_note writes to new dir
test('create_note after directory change writes file to new directory', async () => {
  await invokeCommand(appCtx.page, 'set_config', { config: { notes_dir: TEST_NOTES_DIR_B } });

  const metadata = await invokeCommand<NoteMetadata>(appCtx.page, 'create_note');
  expect(metadata).toHaveProperty('id');
  assertFilenameFormat(`${metadata.id}.md`);

  assertNoteInDir(TEST_NOTES_DIR_B, metadata.id);

  const filesInA = listMdFiles(TEST_NOTES_DIR_A);
  expect(filesInA).not.toContain(`${metadata.id}.md`);
});

// After directory change, list_notes returns notes from new directory only
test('list_notes after directory change returns notes from new directory', async () => {
  createRecentNote(TEST_NOTES_DIR_A, ['dir-a'], 'note in dir A', 0);
  createRecentNote(TEST_NOTES_DIR_B, ['dir-b'], 'note in dir B', 0);

  await invokeCommand(appCtx.page, 'set_config', { config: { notes_dir: TEST_NOTES_DIR_B } });

  const notes = await invokeCommand<NoteMetadata[]>(appCtx.page, 'list_notes', { filter: null });
  const ids = notes.map(n => n.id);

  const dirBFiles = listMdFiles(TEST_NOTES_DIR_B).map(f => f.replace('.md', ''));
  const dirAFiles = listMdFiles(TEST_NOTES_DIR_A).map(f => f.replace('.md', ''));

  for (const id of ids) {
    expect(dirBFiles).toContain(id);
  }
  for (const aId of dirAFiles) {
    expect(ids).not.toContain(aId);
  }
});

// Existing notes in old directory are NOT moved
test('existing notes in old directory remain after directory change', async () => {
  createRecentNote(TEST_NOTES_DIR_A, [], 'stays in A', 0);
  const filesBefore = listMdFiles(TEST_NOTES_DIR_A);

  await invokeCommand(appCtx.page, 'set_config', { config: { notes_dir: TEST_NOTES_DIR_B } });

  const filesAfter = listMdFiles(TEST_NOTES_DIR_A);
  expect(filesAfter).toEqual(filesBefore);
});

// save_note in new directory writes to correct location
test('save_note after directory change writes to new directory', async () => {
  await invokeCommand(appCtx.page, 'set_config', { config: { notes_dir: TEST_NOTES_DIR_B } });

  const metadata = await invokeCommand<NoteMetadata>(appCtx.page, 'create_note');
  await invokeCommand(appCtx.page, 'save_note', {
    id: metadata.id,
    frontmatter: { tags: ['sprint55'] },
    body: 'body written after directory change',
  });

  const savedPath = path.join(TEST_NOTES_DIR_B, `${metadata.id}.md`);
  expect(fs.existsSync(savedPath)).toBe(true);
  const content = fs.readFileSync(savedPath, 'utf-8');
  expect(content).toContain('body written after directory change');
  expect(content).toContain('sprint55');
});

// Non-existent new directory is auto-created on first write
test('new directory is auto-created if it does not exist when create_note is called', async () => {
  const freshDir = path.join(require('os').tmpdir(), `promptnotes-fresh-${Date.now()}`);
  expect(fs.existsSync(freshDir)).toBe(false);

  try {
    await invokeCommand(appCtx.page, 'set_config', { config: { notes_dir: freshDir } });
    const metadata = await invokeCommand<NoteMetadata>(appCtx.page, 'create_note');
    expect(fs.existsSync(freshDir)).toBe(true);
    assertNoteInDir(freshDir, metadata.id);
  } finally {
    if (fs.existsSync(freshDir)) fs.rmSync(freshDir, { recursive: true, force: true });
  }
});

// FC-SET-01: set_config must not silently fail
test('set_config does not throw for a valid directory path', async () => {
  await expect(
    invokeCommand(appCtx.page, 'set_config', { config: { notes_dir: TEST_NOTES_DIR_B } }),
  ).resolves.not.toThrow();
});
