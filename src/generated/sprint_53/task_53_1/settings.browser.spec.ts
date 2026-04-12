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
import { launchApp, closeApp, waitForTauriReady, invoke, AppHandle } from './helpers/app-launch';
import { cleanNotesDir } from './helpers/note-factory';
import { APP_BASE_URL, ROUTES, COMMANDS, AppConfig } from './helpers/test-data';

let app: AppHandle;
let originalConfig: AppConfig;

test.beforeAll(async () => {
  app = await launchApp();
  await waitForTauriReady(app.page);
  originalConfig = await invoke<AppConfig>(app.page, COMMANDS.GET_CONFIG);
});

test.afterAll(async () => {
  await invoke<void>(app.page, COMMANDS.SET_CONFIG, { config: originalConfig });
  cleanNotesDir();
  await closeApp(app);
});

test.beforeEach(async () => {
  await app.page.goto(APP_BASE_URL + ROUTES.SETTINGS, { waitUntil: 'networkidle' });
});

test('設定画面が /settings で表示される (AC-SET-01)', async () => {
  const page = app.page;
  await expect(page).toHaveURL(/settings/);
  // 設定画面のコンテンツが存在する
  const settingsView = page.locator('[data-testid="settings-view"], .settings-view, main').first();
  await expect(settingsView).toBeVisible({ timeout: 3000 });
});

test('現在の保存ディレクトリが画面に表示される (AC-SET-01)', async () => {
  const page = app.page;
  const config = await invoke<AppConfig>(page, COMMANDS.GET_CONFIG);
  // ディレクトリパスが画面に表示されている
  const dirDisplay = page.locator(`text="${config.notes_dir}"`);
  const inputWithDir = page.locator(`input[value="${config.notes_dir}"]`);
  const isDisplayed = (await dirDisplay.count()) > 0 || (await inputWithDir.count()) > 0;
  expect(isDisplayed, 'current notes_dir must be displayed on settings screen').toBe(true);
});

test('ディレクトリ変更ボタンが存在する (AC-SET-01, FC-SET-01)', async () => {
  const page = app.page;
  const changeBtn = page.locator(
    '[data-testid="change-dir-btn"], button:has-text("ディレクトリ"), button:has-text("変更"), button:has-text("Browse"), button:has-text("選択")'
  ).first();
  await expect(changeBtn, 'directory change button must exist (FC-SET-01)').toBeVisible({ timeout: 3000 });
});

test('フロントエンドが localStorage や sessionStorage に設定を保存していない (module:settings RBC)', async () => {
  const page = app.page;
  const lsKeys = await page.evaluate(() => Object.keys(localStorage).filter(k => k.includes('promptnote') || k.includes('notes_dir')));
  expect(lsKeys.length, 'settings must not be stored in localStorage').toBe(0);
  const ssKeys = await page.evaluate(() => Object.keys(sessionStorage).filter(k => k.includes('promptnote') || k.includes('notes_dir')));
  expect(ssKeys.length, 'settings must not be stored in sessionStorage').toBe(0);
});
