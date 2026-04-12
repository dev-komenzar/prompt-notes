// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 53-1
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
// @generated-by: codd implement --sprint 53
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { invoke, launchApp, closeApp, waitForTauriReady, AppHandle } from './helpers/app-launch';
import { cleanNotesDir } from './helpers/note-factory';
import {
  NOTES_DIR,
  COMMANDS,
  NOTE_ID_REGEX,
  FILENAME_REGEX,
  NoteMetadata,
  Note,
  AUTO_SAVE_DEBOUNCE_MS,
  DEBOUNCE_BUFFER_MS,
} from './helpers/test-data';
import { assertNoteMetadataShape, assertNoteFileStructure, assertNoteIdFormat } from './helpers/assertions';

let app: AppHandle;

test.beforeAll(async () => {
  app = await launchApp();
  await waitForTauriReady(app.page);
  cleanNotesDir();
});

test.afterAll(async () => {
  cleanNotesDir();
  await closeApp(app);
});

test('create_note returns NoteMetadata with valid id format (AC-STOR-01, RB-3)', async () => {
  const meta = await invoke<NoteMetadata>(app.page, COMMANDS.CREATE_NOTE);
  assertNoteMetadataShape(meta);
  assertNoteIdFormat(meta.id);
  const expectedPath = path.join(NOTES_DIR, `${meta.id}.md`);
  expect(fs.existsSync(expectedPath), 'note file must be created on disk').toBe(true);
});

test('create_note produces file with valid structure: YAML frontmatter tags-only + body (AC-STOR-02)', async () => {
  const meta = await invoke<NoteMetadata>(app.page, COMMANDS.CREATE_NOTE);
  const filePath = path.join(NOTES_DIR, `${meta.id}.md`);
  const { tags, body } = assertNoteFileStructure(filePath);
  expect(Array.isArray(tags)).toBe(true);
  expect(typeof body).toBe('string');
});

test('save_note writes frontmatter and body to file (CONV-3, AC-EDIT-05)', async () => {
  const meta = await invoke<NoteMetadata>(app.page, COMMANDS.CREATE_NOTE);
  const body = 'Test body content for save verification.';
  const tags = ['save-test'];
  await invoke<void>(app.page, COMMANDS.SAVE_NOTE, {
    id: meta.id,
    frontmatter: { tags },
    body,
  });
  const filePath = path.join(NOTES_DIR, `${meta.id}.md`);
  const result = assertNoteFileStructure(filePath);
  expect(result.body.trim()).toBe(body);
  expect(result.tags).toContain('save-test');
});

test('read_note returns Note with correct body and tags', async () => {
  const meta = await invoke<NoteMetadata>(app.page, COMMANDS.CREATE_NOTE);
  const body = 'Body for read_note test.';
  const tags = ['read-test'];
  await invoke<void>(app.page, COMMANDS.SAVE_NOTE, { id: meta.id, frontmatter: { tags }, body });
  const note = await invoke<Note>(app.page, COMMANDS.READ_NOTE, { id: meta.id });
  expect(note.id).toBe(meta.id);
  expect(note.body.trim()).toBe(body);
  expect(note.frontmatter.tags).toContain('read-test');
});

test('delete_note removes the file from disk (AC-STOR-01)', async () => {
  const meta = await invoke<NoteMetadata>(app.page, COMMANDS.CREATE_NOTE);
  const filePath = path.join(NOTES_DIR, `${meta.id}.md`);
  expect(fs.existsSync(filePath)).toBe(true);
  await invoke<void>(app.page, COMMANDS.DELETE_NOTE, { id: meta.id });
  expect(fs.existsSync(filePath), 'file must be deleted').toBe(false);
});

test('list_notes returns NoteMetadata[] with correct shapes', async () => {
  const meta = await invoke<NoteMetadata>(app.page, COMMANDS.CREATE_NOTE);
  await invoke<void>(app.page, COMMANDS.SAVE_NOTE, {
    id: meta.id,
    frontmatter: { tags: ['list-test'] },
    body: 'List notes verification body.',
  });
  const notes = await invoke<NoteMetadata[]>(app.page, COMMANDS.LIST_NOTES, {});
  expect(Array.isArray(notes)).toBe(true);
  const found = notes.find(n => n.id === meta.id);
  expect(found, 'created note must appear in list').toBeDefined();
  assertNoteMetadataShape(found!);
});

test('create_note id is immutable: save_note must not rename file (CONV-1)', async () => {
  const meta = await invoke<NoteMetadata>(app.page, COMMANDS.CREATE_NOTE);
  await invoke<void>(app.page, COMMANDS.SAVE_NOTE, {
    id: meta.id,
    frontmatter: { tags: [] },
    body: 'Immutability check.',
  });
  const filePath = path.join(NOTES_DIR, `${meta.id}.md`);
  expect(fs.existsSync(filePath), 'original filename must be unchanged').toBe(true);
});

test('create_note latency is under 100ms (AC-EDIT-03)', async () => {
  const start = Date.now();
  const meta = await invoke<NoteMetadata>(app.page, COMMANDS.CREATE_NOTE);
  const elapsed = Date.now() - start;
  expect(elapsed, `create_note must complete in <100ms, took ${elapsed}ms`).toBeLessThan(100);
  assertNoteIdFormat(meta.id);
  // cleanup
  await invoke<void>(app.page, COMMANDS.DELETE_NOTE, { id: meta.id });
});
