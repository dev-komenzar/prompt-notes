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
import * as os from 'os';
import * as path from 'path';
import { launchApp, closeApp, waitForTauriReady, invoke, AppHandle } from './helpers/app-launch';
import { cleanNotesDir, createNoteFile } from './helpers/note-factory';
import { COMMANDS, AppConfig, NoteMetadata } from './helpers/test-data';

let app: AppHandle;
let originalConfig: AppConfig;

test.beforeAll(async () => {
  app = await launchApp();
  await waitForTauriReady(app.page);
  originalConfig = await invoke<AppConfig>(app.page, COMMANDS.GET_CONFIG);
});

test.afterAll(async () => {
  // 設定を元に戻す
  await invoke<void>(app.page, COMMANDS.SET_CONFIG, { config: originalConfig });
  cleanNotesDir();
  await closeApp(app);
});

// ──────────────────────────────────────────────────
// AC-SET-01: 保存ディレクトリの変更
// ──────────────────────────────────────────────────

test('get_config は AppConfig を返す', async () => {
  const config = await invoke<AppConfig>(app.page, COMMANDS.GET_CONFIG);
  expect(typeof config.notes_dir).toBe('string');
  expect(config.notes_dir.length).toBeGreaterThan(0);
});

test('set_config で notes_dir を変更し get_config で確認できる (AC-SET-01)', async () => {
  const tmpDir = path.join(os.tmpdir(), `promptnotes-test-${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });
  try {
    await invoke<void>(app.page, COMMANDS.SET_CONFIG, { config: { notes_dir: tmpDir } });
    const updated = await invoke<AppConfig>(app.page, COMMANDS.GET_CONFIG);
    expect(updated.notes_dir).toBe(tmpDir);
  } finally {
    // 設定を元に戻す
    await invoke<void>(app.page, COMMANDS.SET_CONFIG, { config: originalConfig });
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('ディレクトリ変更後、新ディレクトリのノートのみが list_notes に返る (AC-SET-01, FC-SET-02)', async () => {
  const tmpDir = path.join(os.tmpdir(), `promptnotes-test-switch-${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });
  try {
    // 新ディレクトリにノートを直接作成
    const newNoteId = '2026-01-01T000001';
    const newNotePath = path.join(tmpDir, `${newNoteId}.md`);
    fs.writeFileSync(newNotePath, '---\ntags: []\n---\nNew dir note', 'utf-8');

    // 設定を新ディレクトリに変更
    await invoke<void>(app.page, COMMANDS.SET_CONFIG, { config: { notes_dir: tmpDir } });

    const notes = await invoke<NoteMetadata[]>(app.page, COMMANDS.LIST_NOTES, {});
    const ids = notes.map(n => n.id);
    expect(ids).toContain(newNoteId);
    // 旧ディレクトリのノートは含まれない
    const oldNotes = ids.filter(id => id !== newNoteId);
    expect(oldNotes.length, 'old dir notes must not appear after dir change').toBe(0);
  } finally {
    await invoke<void>(app.page, COMMANDS.SET_CONFIG, { config: originalConfig });
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('設定変更は config.json に永続化される (CONV-4, module:settings RBC)', async () => {
  const tmpDir = path.join(os.tmpdir(), `promptnotes-persist-${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });
  try {
    await invoke<void>(app.page, COMMANDS.SET_CONFIG, { config: { notes_dir: tmpDir } });
    // get_config で再読み込み確認
    const reread = await invoke<AppConfig>(app.page, COMMANDS.GET_CONFIG);
    expect(reread.notes_dir).toBe(tmpDir);
  } finally {
    await invoke<void>(app.page, COMMANDS.SET_CONFIG, { config: originalConfig });
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('既存ノートはディレクトリ変更時に移動されない', async () => {
  const meta = await invoke<NoteMetadata>(app.page, COMMANDS.CREATE_NOTE);
  const originalPath = path.join(originalConfig.notes_dir, `${meta.id}.md`);

  const tmpDir = path.join(os.tmpdir(), `promptnotes-no-move-${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });
  try {
    await invoke<void>(app.page, COMMANDS.SET_CONFIG, { config: { notes_dir: tmpDir } });
    // 元ファイルがまだ存在していることを確認
    expect(fs.existsSync(originalPath), 'original note file must not be moved').toBe(true);
    // 新ディレクトリには存在しない
    expect(fs.existsSync(path.join(tmpDir, `${meta.id}.md`)), 'note must not be copied to new dir').toBe(false);
  } finally {
    await invoke<void>(app.page, COMMANDS.SET_CONFIG, { config: originalConfig });
    if (fs.existsSync(originalPath)) fs.unlinkSync(originalPath);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
