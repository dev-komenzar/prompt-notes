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
 * スコープガードテスト: 実装禁止機能が存在しないことを検証する。
 * FC-SCOPE-* および RB-2 の反転アサーション。
 */
import { test, expect } from '@playwright/test';
import { launchApp, closeApp, waitForTauriReady, AppHandle } from './helpers/app-launch';
import { APP_BASE_URL, ROUTES } from './helpers/test-data';
import { assertNoMarkdownPreview, assertNoTitleInput } from './helpers/assertions';
import { pressNewNote } from './helpers/keyboard';

let app: AppHandle;

test.beforeAll(async () => {
  app = await launchApp();
  await waitForTauriReady(app.page);
});

test.afterAll(async () => {
  await closeApp(app);
});

// ──────────────────────────────────────────────────
// FC-EDIT-05: タイトル入力欄の不在 (RB-2)
// ──────────────────────────────────────────────────

test('エディタ画面にタイトル入力欄が存在しない (AC-SCOPE-01, RB-2, FC-EDIT-05)', async () => {
  await app.page.goto(APP_BASE_URL + ROUTES.EDITOR, { waitUntil: 'networkidle' });
  await assertNoTitleInput(app.page);
});

// ──────────────────────────────────────────────────
// FC-EDIT-06: Markdown プレビュー/レンダリングの不在 (RB-2)
// ──────────────────────────────────────────────────

test('エディタ画面に Markdown レンダリングプレビューが存在しない (AC-SCOPE-01, RB-2, FC-EDIT-06)', async () => {
  await app.page.goto(APP_BASE_URL + ROUTES.EDITOR, { waitUntil: 'networkidle' });
  await assertNoMarkdownPreview(app.page);
});

test('Markdown プレビューボタン/トグルが存在しない (AC-SCOPE-01, RB-2)', async () => {
  const page = app.page;
  await page.goto(APP_BASE_URL + ROUTES.EDITOR, { waitUntil: 'networkidle' });
  await pressNewNote(page);
  const previewToggleCount = await page.locator(
    'button:has-text("Preview"), button:has-text("プレビュー"), [data-testid="preview-toggle"], button:has-text("Render")'
  ).count();
  expect(previewToggleCount, 'markdown preview toggle must not exist (RB-2)').toBe(0);
});

// ──────────────────────────────────────────────────
// FC-SCOPE-01: AI 呼び出し機能の不在
// ──────────────────────────────────────────────────

test('AI 呼び出し機能が存在しない (AC-SCOPE-01, FC-SCOPE-01)', async () => {
  const page = app.page;
  for (const route of [ROUTES.EDITOR, ROUTES.GRID, ROUTES.SETTINGS]) {
    await page.goto(APP_BASE_URL + route, { waitUntil: 'networkidle' });
    const aiElements = await page.locator(
      'button:has-text("AI"), button:has-text("Generate"), button:has-text("ChatGPT"), button:has-text("Claude"), [data-testid*="ai"]'
    ).count();
    expect(aiElements, `AI UI elements must not exist on ${route} (FC-SCOPE-01)`).toBe(0);
  }
});

test('window オブジェクトに AI API キーが露出していない (FC-SCOPE-01)', async () => {
  await app.page.goto(APP_BASE_URL + ROUTES.EDITOR, { waitUntil: 'networkidle' });
  const hasOpenAiKey = await app.page.evaluate(() =>
    Object.keys(window).some(k => k.toLowerCase().includes('openai') || k.toLowerCase().includes('anthropic'))
  );
  expect(hasOpenAiKey, 'AI API keys must not be exposed on window').toBe(false);
});

// ──────────────────────────────────────────────────
// FC-SCOPE-02: クラウド同期機能の不在
// ──────────────────────────────────────────────────

test('クラウド同期 UI が存在しない (AC-SCOPE-01, FC-SCOPE-02)', async () => {
  const page = app.page;
  for (const route of [ROUTES.EDITOR, ROUTES.SETTINGS]) {
    await page.goto(APP_BASE_URL + route, { waitUntil: 'networkidle' });
    const syncElements = await page.locator(
      'button:has-text("Sync"), button:has-text("同期"), button:has-text("Cloud"), [data-testid*="sync"], [data-testid*="cloud"]'
    ).count();
    expect(syncElements, `cloud sync UI must not exist on ${route} (FC-SCOPE-02)`).toBe(0);
  }
});

test('クラウドストレージへのネットワークリクエストが発生しない (FC-SCOPE-02)', async () => {
  const page = app.page;
  const cloudRequests: string[] = [];
  page.on('request', req => {
    const url = req.url();
    if (
      url.includes('api.openai.com') ||
      url.includes('anthropic.com') ||
      url.includes('s3.amazonaws.com') ||
      url.includes('storage.googleapis.com') ||
      url.includes('firebase') ||
      url.includes('supabase') ||
      url.includes('icloud') ||
      url.includes('dropbox')
    ) {
      cloudRequests.push(url);
    }
  });
  await page.goto(APP_BASE_URL + ROUTES.EDITOR, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  expect(cloudRequests, `cloud storage requests must not occur: ${cloudRequests.join(', ')}`).toHaveLength(0);
});

// ──────────────────────────────────────────────────
// FC-SCOPE-03: モバイル対応コードパスの不在
// ──────────────────────────────────────────────────

test('モバイル対応の viewport meta や touch 専用 UI が存在しない (AC-SCOPE-01, FC-SCOPE-03)', async () => {
  const page = app.page;
  await page.goto(APP_BASE_URL + ROUTES.EDITOR, { waitUntil: 'networkidle' });
  // touch-only UI の不在
  const touchElements = await page.locator('[data-testid*="mobile"], .mobile-only, .touch-only').count();
  expect(touchElements, 'mobile-only UI must not exist').toBe(0);
});

// ──────────────────────────────────────────────────
// RBC-1: Tauri (Rust + WebView) の使用確認
// ──────────────────────────────────────────────────

test('Tauri グローバルが window に存在する (Electron 等でないことを確認) (AC-TECH-01)', async () => {
  await app.page.goto(APP_BASE_URL + ROUTES.EDITOR, { waitUntil: 'networkidle' });
  const hasTauri = await app.page.evaluate(
    () => typeof (window as unknown as { __TAURI__?: unknown }).__TAURI__ !== 'undefined'
  );
  expect(hasTauri, '__TAURI__ global must be present (Tauri framework required, RBC-1)').toBe(true);
  // Electron API が存在しないことを確認
  const hasElectron = await app.page.evaluate(
    () => typeof (window as unknown as { electron?: unknown }).electron !== 'undefined'
  );
  expect(hasElectron, 'electron global must not exist (RBC-1)').toBe(false);
});
