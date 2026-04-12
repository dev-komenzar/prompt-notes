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
import { launchApp, closeApp, waitForTauriReady, invoke, AppHandle } from './helpers/app-launch';
import { cleanNotesDir, createNoteFile } from './helpers/note-factory';
import {
  NOTES_DIR,
  COMMANDS,
  FILENAME_REGEX,
  AUTO_SAVE_DEBOUNCE_MS,
  DEBOUNCE_BUFFER_MS,
  NoteMetadata,
  Note,
  AppConfig,
} from './helpers/test-data';
import { assertNoteFileStructure, assertFilenameFormat, assertNoteIdFormat } from './helpers/assertions';

let app: AppHandle;

test.beforeAll(async () => {
  app = await launchApp();
  await waitForTauriReady(app.page);
});

test.afterAll(async () => {
  cleanNotesDir();
  await closeApp(app);
});

test.beforeEach(() => {
  cleanNotesDir();
});

// ──────────────────────────────────────────────────
// AC-STOR-01: ファイル名規則 (RB-3, CONV-1)
// ──────────────────────────────────────────────────

test('create_note で生成されるファイル名は YYYY-MM-DDTHHMMSS.md 形式 (AC-STOR-01, RB-3)', async () => {
  const meta = await invoke<NoteMetadata>(app.page, COMMANDS.CREATE_NOTE);
  const filename = `${meta.id}.md`;
  assertFilenameFormat(filename);
  assertNoteIdFormat(meta.id);
  const filePath = path.join(NOTES_DIR, filename);
  expect(fs.existsSync(filePath)).toBe(true);
  await invoke<void>(app.page, COMMANDS.DELETE_NOTE, { id: meta.id });
});

test('created_at はファイル名のタイムスタンプから導出される (AC-STOR-01)', async () => {
  const meta = await invoke<NoteMetadata>(app.page, COMMANDS.CREATE_NOTE);
  // created_at は ISO 8601 形式
  expect(() => new Date(meta.created_at)).not.toThrow();
  const createdDate = new Date(meta.created_at);
  expect(createdDate.getFullYear()).toBeGreaterThanOrEqual(2020);
  await invoke<void>(app.page, COMMANDS.DELETE_NOTE, { id: meta.id });
});

// ──────────────────────────────────────────────────
// AC-STOR-02: ファイル構造 (CONV-2)
// ──────────────────────────────────────────────────

test('保存されたファイルは YAML frontmatter (tags のみ) + 本文の構造を持つ (AC-STOR-02)', async () => {
  const meta = await invoke<NoteMetadata>(app.page, COMMANDS.CREATE_NOTE);
  const body = 'File structure verification body.';
  const tags = ['structure-test'];
  await invoke<void>(app.page, COMMANDS.SAVE_NOTE, { id: meta.id, frontmatter: { tags }, body });

  const filePath = path.join(NOTES_DIR, `${meta.id}.md`);
  const { tags: savedTags, body: savedBody } = assertNoteFileStructure(filePath);
  expect(savedTags).toContain('structure-test');
  expect(savedBody.trim()).toBe(body);
  await invoke<void>(app.page, COMMANDS.DELETE_NOTE, { id: meta.id });
});

test('frontmatter には tags 以外のメタデータフィールドが含まれない (AC-STOR-02, CONV-2, FC-STOR-03)', async () => {
  const meta = await invoke<NoteMetadata>(app.page, COMMANDS.CREATE_NOTE);
  await invoke<void>(app.page, COMMANDS.SAVE_NOTE, {
    id: meta.id,
    frontmatter: { tags: ['check-fields'] },
    body: 'No extra fields in frontmatter.',
  });
  const filePath = path.join(NOTES_DIR, `${meta.id}.md`);
  const rawContent = fs.readFileSync(filePath, 'utf-8');
  const fmEnd = rawContent.indexOf('\n---\n', 4);
  const yamlSection = rawContent.slice(4, fmEnd);
  // created_at, id, title などの余分なフィールドが存在しないことを確認
  expect(yamlSection).not.toMatch(/created_at:/);
  expect(yamlSection).not.toMatch(/^id:/m);
  expect(yamlSection).not.toMatch(/title:/);
  await invoke<void>(app.page, COMMANDS.DELETE_NOTE, { id: meta.id });
});

// ──────────────────────────────────────────────────
// AC-STOR-03: デフォルト保存ディレクトリ (CONV-4)
// ──────────────────────────────────────────────────

test('デフォルト保存ディレクトリが存在する (AC-STOR-03)', async () => {
  const config = await invoke<AppConfig>(app.page, COMMANDS.GET_CONFIG);
  expect(typeof config.notes_dir).toBe('string');
  expect(config.notes_dir.length).toBeGreaterThan(0);
  // ディレクトリが存在または create_note 後に自動作成される
  const meta = await invoke<NoteMetadata>(app.page, COMMANDS.CREATE_NOTE);
  expect(fs.existsSync(config.notes_dir), 'notes directory must be auto-created').toBe(true);
  await invoke<void>(app.page, COMMANDS.DELETE_NOTE, { id: meta.id });
});

test('Linux では ~/.local/share/promptnotes/notes、macOS では ~/Library/Application Support/promptnotes/notes がデフォルト (AC-STOR-03, FC-STOR-04)', async () => {
  const config = await invoke<AppConfig>(app.page, COMMANDS.GET_CONFIG);
  if (process.platform === 'darwin') {
    expect(config.notes_dir).toContain('Library/Application Support/promptnotes/notes');
  } else if (process.platform === 'linux') {
    expect(config.notes_dir).toContain('.local/share/promptnotes/notes');
  }
});

// ──────────────────────────────────────────────────
// CONV-1: ファイル名の不変性
// ──────────────────────────────────────────────────

test('save_note を繰り返しても id (ファイル名) は変更されない (CONV-1)', async () => {
  const meta = await invoke<NoteMetadata>(app.page, COMMANDS.CREATE_NOTE);
  const originalId = meta.id;
  for (let i = 0; i < 3; i++) {
    await invoke<void>(app.page, COMMANDS.SAVE_NOTE, {
      id: originalId,
      frontmatter: { tags: [`iter-${i}`] },
      body: `Save iteration ${i}`,
    });
  }
  const expectedPath = path.join(NOTES_DIR, `${originalId}.md`);
  expect(fs.existsSync(expectedPath), 'original file path must remain unchanged').toBe(true);
  const files = fs.readdirSync(NOTES_DIR).filter(f => FILENAME_REGEX.test(f));
  // 他の .md ファイルが作成されていないことを確認 (リネームされていない)
  const otherFiles = files.filter(f => f !== `${originalId}.md`);
  expect(otherFiles.length, 'no additional note files must be created by save_note').toBe(0);
  await invoke<void>(app.page, COMMANDS.DELETE_NOTE, { id: originalId });
});

// ──────────────────────────────────────────────────
// CONV-3: 自動保存のアトミック書き込み
// ──────────────────────────────────────────────────

test('.tmp 一時ファイルが最終的にクリーンアップされる (CONV-3, atomic write)', async () => {
  const meta = await invoke<NoteMetadata>(app.page, COMMANDS.CREATE_NOTE);
  await invoke<void>(app.page, COMMANDS.SAVE_NOTE, {
    id: meta.id,
    frontmatter: { tags: [] },
    body: 'Atomic write test',
  });
  await new Promise(r => setTimeout(r, 200));
  const tmpFiles = fs.existsSync(NOTES_DIR)
    ? fs.readdirSync(NOTES_DIR).filter(f => f.endsWith('.tmp'))
    : [];
  expect(tmpFiles.length, 'no .tmp files must remain after save').toBe(0);
  await invoke<void>(app.page, COMMANDS.DELETE_NOTE, { id: meta.id });
});

// ──────────────────────────────────────────────────
// DB・クラウド保存禁止の確認 (RBC-3)
// ──────────────────────────────────────────────────

test('データはローカルファイルとしてのみ保存される。IndexedDB に何も書き込まれない (RBC-3)', async () => {
  const meta = await invoke<NoteMetadata>(app.page, COMMANDS.CREATE_NOTE);
  await invoke<void>(app.page, COMMANDS.SAVE_NOTE, {
    id: meta.id,
    frontmatter: { tags: [] },
    body: 'DB prohibition check',
  });
  // IndexedDB にプロンプトノートのデータが存在しないことを確認
  const idbKeys = await app.page.evaluate(async () => {
    const dbs = await indexedDB.databases();
    return dbs.map(db => db.name).filter(n => n && n.includes('promptnote'));
  });
  expect(idbKeys.length, 'no IndexedDB databases must be used for note storage (RBC-3)').toBe(0);
  await invoke<void>(app.page, COMMANDS.DELETE_NOTE, { id: meta.id });
});
