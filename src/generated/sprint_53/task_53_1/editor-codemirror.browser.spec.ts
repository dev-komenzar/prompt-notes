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
import { launchApp, closeApp, waitForTauriReady, AppHandle } from './helpers/app-launch';
import { cleanNotesDir } from './helpers/note-factory';
import { APP_BASE_URL, ROUTES } from './helpers/test-data';
import { assertNoMarkdownPreview, assertNoTitleInput } from './helpers/assertions';
import { pressNewNote, typeInEditor } from './helpers/keyboard';

let app: AppHandle;

test.beforeAll(async () => {
  app = await launchApp();
  await waitForTauriReady(app.page);
});

test.afterAll(async () => {
  cleanNotesDir();
  await closeApp(app);
});

test.beforeEach(async () => {
  await app.page.goto(APP_BASE_URL + ROUTES.EDITOR, { waitUntil: 'networkidle' });
});

// ──────────────────────────────────────────────────
// RB-2: CodeMirror 6 の必須検証
// ──────────────────────────────────────────────────

test('CodeMirror 6 エディタインスタンスが DOM に存在する (AC-EDIT-01, RB-2, FC-EDIT-04)', async () => {
  const page = app.page;
  // CodeMirror 6 は .cm-editor ルート要素と .cm-content (contenteditable) を持つ
  await expect(page.locator('.cm-editor'), '.cm-editor must exist').toBeVisible({ timeout: 5000 });
  await expect(page.locator('.cm-content[contenteditable="true"]'), '.cm-content must be contenteditable').toBeVisible();
  // CodeMirror 6 固有のクラス（.cm-scroller）
  await expect(page.locator('.cm-scroller')).toBeVisible();
});

test('エディタは Monaco や他のエンジンを使用していない (FC-EDIT-04)', async () => {
  const page = app.page;
  // Monaco が存在しないことを確認
  const monacoCount = await page.locator('.monaco-editor, [data-uri]').count();
  expect(monacoCount, 'Monaco editor must not exist (RB-2)').toBe(0);
  // ProseMirror が存在しないことを確認
  const proseMirrorCount = await page.locator('.ProseMirror').count();
  expect(proseMirrorCount, 'ProseMirror must not exist (RB-2)').toBe(0);
});

test('Markdown シンタックスハイライトが有効である (AC-EDIT-01)', async () => {
  const page = app.page;
  await pressNewNote(page);
  await typeInEditor(page, '# Heading\n\n**bold text**\n\n- list item');
  await page.waitForTimeout(200);
  // CodeMirror 6 は Markdown トークンにクラスを付与する (.tok-heading, .tok-strong 等)
  const highlightedElements = await page.locator('.cm-line .tok-heading, .cm-line .tok-strong, .cm-line [class^="tok-"]').count();
  expect(highlightedElements, 'Markdown syntax highlighting tokens must be present').toBeGreaterThan(0);
});

test('Markdown レンダリングプレビューが存在しない (AC-EDIT-01, RB-2, FC-EDIT-06)', async () => {
  await assertNoMarkdownPreview(app.page);
});

test('タイトル入力欄が存在しない (AC-EDIT-01, RB-2, FC-EDIT-05)', async () => {
  await assertNoTitleInput(app.page);
});

test('frontmatter 領域が背景色で本文と視覚的に区別されている (AC-EDIT-01, AC-EDIT-06, FC-EDIT-07)', async () => {
  const page = app.page;
  await pressNewNote(page);
  // frontmatter 背景色プラグインが適用された行が存在する
  // CodeMirror 6 の Decoration により frontmatter 行に特定クラスまたはスタイルが付く
  const fmLines = page.locator('.cm-line.cm-frontmatter, [data-frontmatter="true"], .frontmatter-bar, [data-testid="frontmatter-bar"]');
  const count = await fmLines.count();
  if (count === 0) {
    // フロントエンドコンポーネント（FrontmatterBar）での実装
    const fmBar = page.locator('[data-testid="frontmatter-bar"], .frontmatter-bar, .frontmatter').first();
    await expect(fmBar, 'frontmatter area must be visually distinct (FC-EDIT-07)').toBeVisible({ timeout: 3000 });
    // 背景色が異なることを検証
    const bgColor = await fmBar.evaluate(el => window.getComputedStyle(el).backgroundColor);
    expect(bgColor, 'frontmatter area must have distinct background color').not.toBe('rgba(0, 0, 0, 0)');
    expect(bgColor).not.toBe('transparent');
  }
});

test('行折り返し (lineWrapping) が有効である', async () => {
  const page = app.page;
  await pressNewNote(page);
  // CodeMirror 6 の lineWrapping 拡張が有効な場合、.cm-editor に overflow-wrap スタイルが適用される
  const wrapping = await page.locator('.cm-editor').evaluate(el =>
    window.getComputedStyle(el).wordBreak !== 'normal' ||
    window.getComputedStyle(el).overflowWrap !== 'normal' ||
    el.classList.contains('cm-lineWrapping')
  );
  // lineWrapping は .cm-content に適用されることもある
  const contentWrapping = await page.locator('.cm-content').evaluate(el => {
    const style = window.getComputedStyle(el);
    return style.whiteSpace === 'pre-wrap' || style.wordBreak === 'break-word';
  });
  expect(wrapping || contentWrapping, 'CodeMirror lineWrapping must be enabled').toBe(true);
});
