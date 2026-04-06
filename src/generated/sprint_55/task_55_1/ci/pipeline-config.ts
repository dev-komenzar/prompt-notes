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

// trace: sprint_55/task_55_1 — CI E2E テスト構築 — CI パイプライン構成定義
export interface CIJobConfig {
  name: string;
  runsOn: string;
  platform: 'linux' | 'macos';
  env: Record<string, string>;
  steps: CIStep[];
}

export interface CIStep {
  name: string;
  run?: string;
  uses?: string;
  with?: Record<string, string>;
}

/**
 * Generates the CI job configurations for E2E testing on both target platforms.
 * PromptNotes targets linux and macos only. Windows is explicitly excluded.
 */
export function generateE2EJobConfigs(): CIJobConfig[] {
  return [generateLinuxJob(), generateMacOSJob()];
}

function generateLinuxJob(): CIJobConfig {
  return {
    name: 'e2e-linux',
    runsOn: 'ubuntu-latest',
    platform: 'linux',
    env: {
      CI: 'true',
      DISPLAY: ':99',
      PROMPTNOTES_E2E: '1',
    },
    steps: [
      { name: 'Checkout', uses: 'actions/checkout@v4' },
      {
        name: 'Install system dependencies',
        run: [
          'sudo apt-get update',
          'sudo apt-get install -y',
          '  libgtk-3-dev',
          '  libwebkit2gtk-4.1-dev',
          '  libappindicator3-dev',
          '  librsvg2-dev',
          '  patchelf',
          '  xvfb',
        ].join(' \\\n'),
      },
      {
        name: 'Setup Rust',
        uses: 'dtolnay/rust-toolchain@stable',
      },
      {
        name: 'Cache Rust dependencies',
        uses: 'actions/cache@v4',
        with: {
          path: [
            '~/.cargo/bin/',
            '~/.cargo/registry/index/',
            '~/.cargo/registry/cache/',
            '~/.cargo/git/db/',
            'src-tauri/target/',
          ].join('\n'),
          key: 'linux-cargo-${{ hashFiles(\'**/Cargo.lock\') }}',
        },
      },
      {
        name: 'Setup Node.js',
        uses: 'actions/setup-node@v4',
        with: { 'node-version': '20' },
      },
      {
        name: 'Install frontend dependencies',
        run: 'npm ci',
      },
      {
        name: 'Install Playwright browsers',
        run: 'npx playwright install --with-deps chromium',
      },
      {
        name: 'Build Tauri application',
        run: 'npm run tauri build -- --release',
      },
      {
        name: 'Run E2E tests',
        run: 'xvfb-run --auto-servernum npx playwright test --config=src/generated/sprint_55/task_55_1/e2e.config.ts',
      },
      {
        name: 'Upload test results',
        uses: 'actions/upload-artifact@v4',
        with: {
          name: 'e2e-results-linux',
          path: 'e2e-results.xml\ntest-results/',
        },
      },
    ],
  };
}

function generateMacOSJob(): CIJobConfig {
  return {
    name: 'e2e-macos',
    runsOn: 'macos-latest',
    platform: 'macos',
    env: {
      CI: 'true',
      PROMPTNOTES_E2E: '1',
    },
    steps: [
      { name: 'Checkout', uses: 'actions/checkout@v4' },
      {
        name: 'Setup Rust',
        uses: 'dtolnay/rust-toolchain@stable',
      },
      {
        name: 'Cache Rust dependencies',
        uses: 'actions/cache@v4',
        with: {
          path: [
            '~/.cargo/bin/',
            '~/.cargo/registry/index/',
            '~/.cargo/registry/cache/',
            '~/.cargo/git/db/',
            'src-tauri/target/',
          ].join('\n'),
          key: 'macos-cargo-${{ hashFiles(\'**/Cargo.lock\') }}',
        },
      },
      {
        name: 'Setup Node.js',
        uses: 'actions/setup-node@v4',
        with: { 'node-version': '20' },
      },
      {
        name: 'Install frontend dependencies',
        run: 'npm ci',
      },
      {
        name: 'Install Playwright browsers',
        run: 'npx playwright install --with-deps chromium',
      },
      {
        name: 'Build Tauri application',
        run: 'npm run tauri build -- --release',
      },
      {
        name: 'Run E2E tests',
        run: 'npx playwright test --config=src/generated/sprint_55/task_55_1/e2e.config.ts',
      },
      {
        name: 'Upload test results',
        uses: 'actions/upload-artifact@v4',
        with: {
          name: 'e2e-results-macos',
          path: 'e2e-results.xml\ntest-results/',
        },
      },
    ],
  };
}
