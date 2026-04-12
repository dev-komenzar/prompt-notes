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
/**
 * Sprint 53 メインシナリオ:
 *   新規作成（Cmd+N）→ 本文入力 → 自動保存 → コピー → 削除
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { launchApp, closeApp, waitForTauriReady, invoke, AppHandle } from './helpers/app-launch';
import { cleanNotesDir } from './helpers/note-factory';
import {
  NOTES_DIR,
  COMMANDS,
  APP_BASE_URL,
  ROUTES,
  AUTO_SAVE_DEBOUNCE_MS,
  DEBOUNCE_BUFFER_MS,
  SAMPLE_BODY,
  NoteMetadata,
  NOTE_ID_REGEX,
} from './helpers/test-data';
import { assertNoTitleInput, assertNoteFileStructure } from './helpers/assertions';
import { pressNewNote, typeInEditor, getEditorContent } from './helpers/keyboard';

let app: AppHandle;

test.beforeAll(async () => {
  app = await launchApp();
  await waitForTauriReady(app.page);
});

test.beforeEach(async () => {
  cleanNotesDir();
  await app.page.goto(APP_BASE_URL + ROUTES.EDITOR, { waitUntil: 'networkidle' });
});

test.afterAll(async () => {
  cleanNotesDir();
  await closeApp(app);
});

// ──────────────────────────────────────────────────
// Sprint 53 ライフサイクル統合テスト
// ──────────────────────────────────────────────────

test('ノートライフサイクル: 新規作成(Cmd+N) → 本文入力 → 自動保存 → コピー → 削除', async () => {
  const page = app.page;

  // 1. エディタ画面が表示されている
  await expect(page.locator('.cm-editor')).toBeVisible({ timeout: 3000 });

  // 2. Cmd+N / Ctrl+N で新規ノート作成
  const beforeFiles = fs.existsSync(NOTES_DIR) ? fs.readdirSync(NOTES_DIR) : [];
  const t0 = Date.now();
  await pressNewNote(page);
  // エディタにフォーカスが移動していることを検証 (RB-1, AC-EDIT-03)
  await expect(page.locator('.cm-content')).toBeFocused({ timeout: 1000 });
  const latency = Date.now() - t0;
  expect(latency, `new note creation must be <100ms, was ${latency}ms`).toBeLessThan(100);
  // ファイルが作成されていることを確認
  const afterFiles = fs.existsSync(NOTES_DIR) ? fs.readdirSync(NOTES_DIR) : [];
  const newFiles = afterFiles.filter(f => !beforeFiles.includes(f));
  expect(newFiles.length, 'exactly one new note file must be created').toBe(1);
  const newFilename = newFiles[0];
  expect(/^\d{4}-\d{2}-\d{2}T\d{6}\.md$/.test(newFilename!), 'filename must match YYYY-MM-DDTHHMMSS.md').toBe(true);
  const createdFilePath = path.join(NOTES_DIR, newFilename!);
  const noteId = newFilename!.replace('.md', '');

  // 3. 本文を入力する
  await typeInEditor(page, SAMPLE_BODY);
  const editorContent = await getEditorContent(page);
  expect(editorContent).toContain('E2E lifecycle');

  // 4. 自動保存: デバウンス (500ms) + バッファ経過後にファイル内容を検証 (RB-3, AC-EDIT-05)
  await page.waitForTimeout(AUTO_SAVE_DEBOUNCE_MS + DEBOUNCE_BUFFER_MS);
  const { body: savedBody } = assertNoteFileStructure(createdFilePath);
  expect(savedBody.trim()).toContain('E2E lifecycle');

  // 5. コピーボタンで本文全体をクリップボードにコピーする (RB-1, AC-EDIT-04)
  // clipboard の read は secure context が必要なため、Playwright の evaluate で権限付与
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  const copyBtn = page.locator('[data-testid="copy-button"], button:has-text("Copy"), button[aria-label*="コピー"], button[aria-label*="copy"]').first();
  await expect(copyBtn, 'copy button must be visible (RB-1)').toBeVisible({ timeout: 3000 });
  await copyBtn.click();
  // コピー成功後のフィードバックを確認 (AC-EDIT-04)
  const feedbackLocator = page.locator('[data-testid="copy-feedback"], .copy-success, button:has-text("✓"), button:has-text("Copied")').first();
  await expect(feedbackLocator, 'copy feedback must appear after click').toBeVisible({ timeout: 2000 });
  // クリップボードの内容が frontmatter を含まない本文のみであることを確認
  const clipText = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipText.trim(), 'clipboard must contain note body').toContain('E2E lifecycle');
  expect(clipText.includes('---'), 'clipboard must not contain frontmatter delimiters').toBe(false);

  // 6. ノートを削除する
  // NoteList の削除ボタンかエディタ内の削除操作
  const deleteBtn = page.locator('[data-testid="delete-note"], button[aria-label*="削除"], button[aria-label*="delete"], button:has-text("Delete"), button:has-text("削除")').first();
  await expect(deleteBtn).toBeVisible({ timeout: 3000 });
  await deleteBtn.click();
  // 確認ダイアログがあれば承認
  page.once('dialog', dialog => dialog.accept());
  await page.waitForTimeout(500);
  // ファイルが削除されていることを確認
  expect(fs.existsSync(createdFilePath), 'note file must be deleted after delete action').toBe(false);
});

// ──────────────────────────────────────────────────
// AC-EDIT-03: Cmd+N の追加シナリオ
// ──────────────────────────────────────────────────

test('Cmd+N を新規ノート状態でも追加の新規ノートを作成する (AC-EDIT-03, FC-EDIT-08)', async () => {
  const page = app.page;
  await expect(page.locator('.cm-editor')).toBeVisible({ timeout: 3000 });

  // 1 回目の Cmd+N
  await pressNewNote(page);
  const files1 = fs.existsSync(NOTES_DIR) ? fs.readdirSync(NOTES_DIR).filter(f => /\.md$/.test(f)) : [];
  expect(files1.length).toBeGreaterThanOrEqual(1);

  // 2 回目の Cmd+N (新規ノート状態からさらに新規作成)
  await pressNewNote(page);
  await page.waitForTimeout(200);
  const files2 = fs.existsSync(NOTES_DIR) ? fs.readdirSync(NOTES_DIR).filter(f => /\.md$/.test(f)) : [];
  expect(files2.length, 'second Cmd+N must create another note').toBeGreaterThan(files1.length);
  await expect(page.locator('.cm-content')).toBeFocused({ timeout: 1000 });
});

// ──────────────────────────────────────────────────
// AC-EDIT-02: ノートリスト表示
// ──────────────────────────────────────────────────

test('ノートリストに過去ノートが表示され、選択すると編集可能になる (AC-EDIT-02, FC-EDIT-09)', async () => {
  const page = app.page;

  // 既存ノートを IPC 経由で作成
  const meta = await invoke<NoteMetadata>(page, COMMANDS.CREATE_NOTE);
  await invoke<void>(page, COMMANDS.SAVE_NOTE, {
    id: meta.id,
    frontmatter: { tags: ['list-display-test'] },
    body: 'Past note body for list display test.',
  });

  // ページをリロードして NoteList を更新
  await page.reload({ waitUntil: 'networkidle' });
  await waitForTauriReady(page);

  // ノートリストコンポーネントが表示されている
  const noteList = page.locator('[data-testid="note-list"], .note-list, aside').first();
  await expect(noteList).toBeVisible({ timeout: 3000 });

  // リスト内に作成したノートが表示されている
  const noteItems = page.locator('[data-testid="note-list-item"], .note-list-item, .note-card').filter({ hasText: 'Past note body' });
  await expect(noteItems.first()).toBeVisible({ timeout: 3000 });

  // ノートを選択するとエディタに表示される
  await noteItems.first().click();
  await page.waitForTimeout(300);
  const editorContent = await getEditorContent(page);
  expect(editorContent).toContain('Past note body');
});

// ──────────────────────────────────────────────────
// AC-EDIT-06: frontmatter タグ入力
// ──────────────────────────────────────────────────

test('frontmatter 領域でタグを入力・編集できる (AC-EDIT-06)', async () => {
  const page = app.page;
  await pressNewNote(page);
  await page.waitForTimeout(200);

  const frontmatterBar = page.locator('[data-testid="frontmatter-bar"], .frontmatter-bar, .frontmatter').first();
  await expect(frontmatterBar, 'frontmatter bar must be visible').toBeVisible({ timeout: 3000 });

  // タグ入力フィールドにタグを追加
  const tagInput = page.locator('[data-testid="tag-input"], input[placeholder*="タグ"], input[placeholder*="tag"]').first();
  if (await tagInput.isVisible()) {
    await tagInput.fill('newtag');
    await tagInput.press('Enter');
    await page.waitForTimeout(AUTO_SAVE_DEBOUNCE_MS + DEBOUNCE_BUFFER_MS);
    // 保存後にタグがファイルに反映される
    const noteFiles = fs.readdirSync(NOTES_DIR).filter(f => /\.md$/.test(f));
    if (noteFiles.length > 0) {
      const { tags } = assertNoteFileStructure(path.join(NOTES_DIR, noteFiles[noteFiles.length - 1]!));
      expect(tags).toContain('newtag');
    }
  } else {
    test.fixme(true, 'tag input widget not yet implemented - check FrontmatterBar.svelte');
  }
});

// ──────────────────────────────────────────────────
// AC-EDIT-01: タイトル入力欄の不在 (RB-2)
// ──────────────────────────────────────────────────

test('エディタ画面にタイトル入力欄が存在しない (AC-EDIT-01, RB-2, FC-EDIT-05)', async () => {
  await assertNoTitleInput(app.page);
});

// ──────────────────────────────────────────────────
// AC-EDIT-04: コピー成功フィードバックの時間的振る舞い
// ──────────────────────────────────────────────────

test('コピーボタンは成功フィードバックを表示し一定時間後に復帰する (AC-EDIT-04)', async () => {
  const page = app.page;
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await pressNewNote(page);
  await typeInEditor(page, 'copy feedback test note body');

  const copyBtn = page.locator('[data-testid="copy-button"], button[aria-label*="コピー"], button[aria-label*="copy"]').first();
  await expect(copyBtn).toBeVisible({ timeout: 3000 });
  const initialText = await copyBtn.textContent();
  await copyBtn.click();
  // フィードバック状態に変化
  await page.waitForTimeout(200);
  const feedbackText = await copyBtn.textContent();
  expect(feedbackText).not.toBe(initialText);
  // 復帰 (1.5秒以内)
  await page.waitForTimeout(1600);
  const restoredText = await copyBtn.textContent();
  expect(restoredText).toBe(initialText);
});
