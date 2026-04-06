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

// trace: sprint_55/task_55_1 — CI E2E テスト構築 — 全モジュール
import { type PlaywrightTestConfig } from '@playwright/test';
import { resolvePlatformConfig } from './helpers/platform';

const platformConfig = resolvePlatformConfig();

const config: PlaywrightTestConfig = {
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Tauri E2E tests must run serially — single app instance
  fullyParallel: false,
  reporter: process.env.CI
    ? [['junit', { outputFile: 'e2e-results.xml' }], ['html', { open: 'never' }]]
    : [['list']],
  use: {
    headless: false, // Tauri WebView requires a visible window
    trace: process.env.CI ? 'on-first-retry' : 'off',
    screenshot: 'only-on-failure',
    video: process.env.CI ? 'on-first-retry' : 'off',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
  expect: {
    timeout: 5_000,
  },
  globalSetup: './helpers/global-setup.ts',
  globalTeardown: './helpers/global-teardown.ts',
  projects: [
    {
      name: platformConfig.projectName,
      use: {
        ...platformConfig.useOptions,
      },
    },
  ],
};

export default config;
