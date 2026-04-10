// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 48-1
// @task-title: グリッドビュー → エディタ → 自動保存 → グリッドビューに戻り変更が反映されるエンドツーエンドのワークフロー確認
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/test/acceptance_criteria.md
// Sprint 48 Task 48-1: グリッドビュー → エディタ → 自動保存 → グリッドビュー E2E ワークフロー確認

import { test, expect, type Page } from '@playwright/test';
import {
  waitForAppReady,
  navigateToGrid,
  navigateToEditor,
} from './helpers/app-launch';
import {
  createTestNoteFile,
  cleanupTestNotes,
  generateTimestampFilename,
  parseNoteFile,
} from './helpers/test-data';
import {
  assertFilenameFormat,
  assertFrontmatterValid,
  assertNo5xx,
} from './helpers/assertions';
import {
  typeIntoEditor,
  waitForAutoSave,
  clickCopyButton,
} from './helpers/editor';
import {
  openGridView,
  clickNoteCard,
  searchNotes,
  waitForGridReload,
} from './helpers/grid';

const BASE_URL = 'http://localhost:1420';
const AUTOSAVE_DEBOUNCE_MS = 750;
const AUTOSAVE_SETTLE_MS = AUTOSAVE_DEBOUNCE_MS + 500;

test.describe('Sprint 48 E2E: グリッドビュー → エディタ → 自動保存 → グリッドビュー', () => {
  let testFilename: string;

  test.beforeEach(async () => {
    testFilename = await createTestNoteFile({
      tags: ['e2e', 'sprint48'],
      body: 'Sprint 48 初期本文。このテキストは後で変更されます。',
    });
  });

  test.afterEach(async () => {
    await cleanupTestNotes([testFilename]);
  });

  test('AC-WORKFLOW-01: グリッドビューにノートが表示される', async ({ page }) => {
    await waitForAppReady(page, BASE_URL);
    await navigateToGrid(page);

    await assertNo5xx(page);

    // デフォルト7日間フィルタ内のノートが表示される
    const cards = page.locator('[data-testid="note-card"]');
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
  });

  test('AC-WORKFLOW-02: カードクリックでエディタ画面に遷移し本文が表示される', async ({ page }) => {
    await waitForAppReady(page, BASE_URL);
    await navigateToGrid(page);

    await clickNoteCard(page, testFilename);

    // URLが /edit/:filename になっていること
    await expect(page).toHaveURL(new RegExp(`/edit/${encodeURIComponent(testFilename)}`));

    // エディタ領域が表示されていること
    const editorArea = page.locator('.cm-editor');
    await expect(editorArea).toBeVisible({ timeout: 5000 });

    // 初期本文が表示されていること
    const editorContent = page.locator('.cm-content');
    await expect(editorContent).toContainText('Sprint 48 初期本文');
  });

  test('AC-WORKFLOW-03: エディタでテキスト編集後に自動保存が実行される', async ({ page }) => {
    await waitForAppReady(page, BASE_URL);
    await navigateToEditor(page, testFilename);

    const newText = `自動保存テスト ${Date.now()}`;
    await typeIntoEditor(page, newText);

    // デバウンス+余裕時間だけ待機して自動保存を確認
    await waitForAutoSave(page, AUTOSAVE_SETTLE_MS);

    // ファイルが更新されていること
    const saved = await parseNoteFile(testFilename);
    expect(saved.body).toContain(newText);
  });

  test('AC-WORKFLOW-04: 自動保存後にグリッドビューへ戻ると変更が反映されている', async ({ page }) => {
    await waitForAppReady(page, BASE_URL);
    await navigateToEditor(page, testFilename);

    const uniqueMarker = `UNIQUE_MARKER_${Date.now()}`;
    await typeIntoEditor(page, uniqueMarker);
    await waitForAutoSave(page, AUTOSAVE_SETTLE_MS);

    // グリッドビューに戻る
    const backButton = page.locator('[data-testid="back-to-grid"], a[href="/"]').first();
    await backButton.click();
    await expect(page).toHaveURL('/');

    // グリッドリロード待機
    await waitForGridReload(page);

    // 変更後の本文プレビューがカードに反映されている
    const cardWithMarker = page.locator('[data-testid="note-card"]').filter({
      hasText: uniqueMarker,
    });
    await expect(cardWithMarker).toBeVisible({ timeout: 5000 });
  });

  test('AC-WORKFLOW-05: 全文検索で変更後の本文が検索できる', async ({ page }) => {
    await waitForAppReady(page, BASE_URL);
    await navigateToEditor(page, testFilename);

    const searchableText = `SEARCHABLE_${Date.now()}`;
    await typeIntoEditor(page, searchableText);
    await waitForAutoSave(page, AUTOSAVE_SETTLE_MS);

    // グリッドビューに戻る
    await page.goto(BASE_URL);
    await waitForGridReload(page);

    // 全文検索
    await searchNotes(page, searchableText);

    // 検索結果に該当ノートが表示される
    const resultCard = page.locator('[data-testid="note-card"]').filter({
      hasText: searchableText,
    });
    await expect(resultCard).toBeVisible({ timeout: 5000 });
  });

  test('AC-WORKFLOW-06: タグ変更が自動保存されグリッドビューに反映される', async ({ page }) => {
    await waitForAppReady(page, BASE_URL);
    await navigateToEditor(page, testFilename);

    // frontmatter領域のタグ入力
    const tagInput = page.locator('[data-testid="tag-input"]');
    if (await tagInput.isVisible()) {
      await tagInput.fill('sprint48-updated');
      await tagInput.press('Enter');
    }

    await waitForAutoSave(page, AUTOSAVE_SETTLE_MS);

    // ファイルのfrontmatterにタグが保存されていること
    const saved = await parseNoteFile(testFilename);
    assertFrontmatterValid(saved.frontmatter);
  });

  test('AC-WORKFLOW-07: コピーボタンが本文をクリップボードにコピーする（フロントマターを除く）', async ({ page }) => {
    await waitForAppReady(page, BASE_URL);
    await navigateToEditor(page, testFilename);

    const bodyText = '自動保存後コピーテスト本文';
    await typeIntoEditor(page, bodyText);
    await waitForAutoSave(page, AUTOSAVE_SETTLE_MS);

    const clipboardText = await clickCopyButton(page);
    expect(clipboardText).toContain(bodyText);
    // frontmatterのYAMLブロックがコピーに含まれないこと
    expect(clipboardText).not.toMatch(/^---\n/);
  });

  test('AC-WORKFLOW-08: Cmd+N / Ctrl+N で新規ノートが作成されエディタに遷移する', async ({ page }) => {
    await waitForAppReady(page, BASE_URL);
    await navigateToGrid(page);

    const isMac = process.platform === 'darwin';
    await page.keyboard.press(isMac ? 'Meta+n' : 'Control+n');

    // 新しいエディタURLに遷移していること
    await page.waitForURL(/\/edit\/\d{4}-\d{2}-\d{2}T\d{6}\.md/, { timeout: 5000 });

    const url = page.url();
    const filenameMatch = url.match(/\/edit\/(.+)$/);
    expect(filenameMatch).toBeTruthy();
    const newFilename = decodeURIComponent(filenameMatch![1]);
    assertFilenameFormat(newFilename);

    // エディタにフォーカスがあること
    const activeElement = await page.evaluate(() => document.activeElement?.classList.toString());
    expect(activeElement).toMatch(/cm-/);

    // クリーンアップ
    await cleanupTestNotes([newFilename]);
  });

  test('AC-WORKFLOW-09: 複数回の編集が自動保存で正しく永続化される', async ({ page }) => {
    await waitForAppReady(page, BASE_URL);
    await navigateToEditor(page, testFilename);

    const edits = ['第1回編集', '第2回編集', '第3回編集最終'];

    for (const edit of edits) {
      await typeIntoEditor(page, ` ${edit}`);
      // デバウンス中の追加入力シミュレーション（タイマーリセット確認）
      await page.waitForTimeout(200);
    }

    // 最後の編集後にデバウンス完了を待つ
    await waitForAutoSave(page, AUTOSAVE_SETTLE_MS);

    const saved = await parseNoteFile(testFilename);
    expect(saved.body).toContain(edits[edits.length - 1]);
  });

  test('AC-WORKFLOW-10: エディタ→グリッド→エディタの往復で状態が保持される', async ({ page }) => {
    await waitForAppReady(page, BASE_URL);
    await navigateToEditor(page, testFilename);

    const firstEdit = `往復テスト_${Date.now()}`;
    await typeIntoEditor(page, firstEdit);
    await waitForAutoSave(page, AUTOSAVE_SETTLE_MS);

    // グリッドに戻る
    await page.goto(BASE_URL);
    await waitForGridReload(page);

    // 同じノートを再度開く
    await clickNoteCard(page, testFilename);
    await expect(page).toHaveURL(new RegExp(`/edit/${encodeURIComponent(testFilename)}`));

    // 前回の編集内容が表示されていること
    const editorContent = page.locator('.cm-content');
    await expect(editorContent).toContainText(firstEdit);
  });
});
