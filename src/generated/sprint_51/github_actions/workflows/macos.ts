// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 51-1
// @task-title: GitHub Actions で自動生成
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/plan/implementation_plan.md (sprint 51)
// Builds universal .dmg for macOS (arm64 + x86_64) via tauri-action

import type { Job } from '../types';

export const macosBuildJob: Job = {
  name: 'Build macOS (.dmg universal)',
  'runs-on': 'macos-latest',
  steps: [
    {
      name: 'Checkout repository',
      uses: 'actions/checkout@v4',
    },
    {
      name: 'Setup Node.js',
      uses: 'actions/setup-node@v4',
      with: {
        'node-version': 20,
        'cache': 'npm',
      },
    },
    {
      name: 'Install Rust stable toolchain with Apple Silicon target',
      uses: 'dtolnay/rust-toolchain@stable',
      with: {
        targets: 'aarch64-apple-darwin',
      },
    },
    {
      name: 'Cache Rust build artifacts',
      uses: 'Swatinem/rust-cache@v2',
      with: {
        'workspaces': './src-tauri -> target',
      },
    },
    {
      name: 'Install npm dependencies',
      run: 'npm ci',
    },
    {
      name: 'Build Tauri app (macOS universal)',
      uses: 'tauri-apps/tauri-action@v0',
      env: {
        GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}',
      },
      with: {
        tagName: '${{ github.ref_name }}',
        releaseName: 'PromptNotes ${{ github.ref_name }}',
        releaseBody: 'See the assets to download and install this version.',
        releaseDraft: true,
        prerelease: false,
        args: '--target universal-apple-darwin',
      },
    },
  ],
};
