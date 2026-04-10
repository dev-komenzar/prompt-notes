// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 54-1
// @task-title: GitHub Actions で自動生成
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/design/system_design.md §2.7
// @generated-by: codd implement --sprint 54

import type { GitHubWorkflow } from './workflow-types';

/**
 * Continuous integration workflow: runs on every PR and push to main.
 * Validates that the app compiles and tests pass on both Linux and macOS.
 * Does NOT perform notarization or artifact upload (that is for the release workflow).
 */
export const ciWorkflow: GitHubWorkflow = {
  name: 'CI',

  on: {
    push: { branches: ['main'] },
    pull_request: { branches: ['main'] },
  },

  env: {
    CARGO_TERM_COLOR: 'always',
  },

  jobs: {
    check: {
      name: 'Check ${{ matrix.platform }}',
      runsOn: '${{ matrix.os }}',
      strategy: {
        failFast: false,
        matrix: {
          include: [
            {
              os: 'ubuntu-22.04',
              platform: 'linux',
              artifactGlobs: [],
            },
            {
              os: 'macos-latest',
              platform: 'macos',
              artifactGlobs: [],
            },
          ],
        },
      },
      steps: [
        {
          name: 'Checkout',
          uses: 'actions/checkout@v4',
        },
        {
          name: 'Install Rust stable',
          uses: 'dtolnay/rust-toolchain@stable',
          with: {
            components: 'clippy,rustfmt',
          },
        },
        {
          name: 'Cache Rust build artifacts',
          uses: 'Swatinem/rust-cache@v2',
          with: {
            workspaces: 'src-tauri -> target',
          },
        },
        {
          name: 'Setup Node.js',
          uses: 'actions/setup-node@v4',
          with: {
            'node-version': '20',
            'cache': 'npm',
          },
        },
        {
          name: 'Install Linux system dependencies',
          if: "matrix.platform == 'linux'",
          run: [
            'sudo apt-get update',
            'sudo apt-get install -y',
            '  libgtk-3-dev',
            '  libwebkit2gtk-4.1-dev',
            '  libappindicator3-dev',
            '  librsvg2-dev',
            '  patchelf',
            '  libssl-dev',
            '  pkg-config',
          ].join(' \\\n'),
        },
        {
          name: 'Install frontend dependencies',
          run: 'npm ci',
        },
        {
          name: 'Check Rust formatting',
          run: 'cargo fmt --manifest-path src-tauri/Cargo.toml -- --check',
        },
        {
          name: 'Clippy (Rust lints)',
          run: 'cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings',
        },
        {
          name: 'Run Rust unit tests',
          run: 'cargo test --manifest-path src-tauri/Cargo.toml',
        },
        {
          name: 'Type-check frontend',
          run: 'npm run check',
        },
        {
          name: 'Lint frontend',
          run: 'npm run lint',
        },
        {
          name: 'Build Tauri app (verify compilation)',
          run: 'npm run tauri build',
          env: {
            // Skip code signing in CI check runs; signing only happens in release workflow.
            TAURI_SKIP_DEVSERVER_CHECK: 'true',
          },
        },
      ],
    },
  },
};
