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

// @generated-from: docs/design/system_design.md §2.7, docs/governance/adr_tech_stack.md ADR-001
// @generated-by: codd implement --sprint 54

import type { GitHubWorkflow, MatrixEntry } from './workflow-types';

const LINUX_MATRIX: MatrixEntry = {
  os: 'ubuntu-22.04',
  platform: 'linux',
  artifactGlobs: [
    'src-tauri/target/release/bundle/deb/*.deb',
    'src-tauri/target/release/bundle/appimage/*.AppImage',
  ],
};

const MACOS_MATRIX: MatrixEntry = {
  os: 'macos-latest',
  platform: 'macos',
  rustTargets: 'aarch64-apple-darwin,x86_64-apple-darwin',
  artifactGlobs: [
    'src-tauri/target/release/bundle/dmg/*.dmg',
  ],
};

/**
 * Build and release workflow for PromptNotes.
 * Targets: Linux (.deb, .AppImage) and macOS (.dmg with notarization).
 * Windows is explicitly out of scope per NNC platform constraints.
 */
export const buildReleaseWorkflow: GitHubWorkflow = {
  name: 'Build and Release',

  on: {
    push: { tags: ['v[0-9]*.[0-9]*.[0-9]*'] },
    workflow_dispatch: {},
  },

  env: {
    CARGO_TERM_COLOR: 'always',
    RUST_BACKTRACE: '1',
  },

  jobs: {
    build: {
      name: 'Build ${{ matrix.platform }}',
      runsOn: '${{ matrix.os }}',
      strategy: {
        failFast: false,
        matrix: {
          include: [LINUX_MATRIX, MACOS_MATRIX],
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
            targets: '${{ matrix.rustTargets }}',
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
          name: 'Import Apple Developer certificate',
          if: "matrix.platform == 'macos'",
          env: {
            APPLE_CERTIFICATE: '${{ secrets.APPLE_CERTIFICATE }}',
            APPLE_CERTIFICATE_PASSWORD: '${{ secrets.APPLE_CERTIFICATE_PASSWORD }}',
          },
          run: [
            'KEYCHAIN_PATH=$RUNNER_TEMP/build.keychain',
            'KEYCHAIN_PASSWORD=$(openssl rand -hex 16)',
            'security create-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_PATH"',
            'security set-keychain-settings -lut 21600 "$KEYCHAIN_PATH"',
            'security unlock-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_PATH"',
            'echo "$APPLE_CERTIFICATE" | base64 --decode > "$RUNNER_TEMP/certificate.p12"',
            'security import "$RUNNER_TEMP/certificate.p12" \\',
            '  -k "$KEYCHAIN_PATH" \\',
            '  -P "$APPLE_CERTIFICATE_PASSWORD" \\',
            '  -T /usr/bin/codesign \\',
            '  -T /usr/bin/productsign',
            'security set-key-partition-list \\',
            '  -S apple-tool:,apple: \\',
            '  -s -k "$KEYCHAIN_PASSWORD" "$KEYCHAIN_PATH"',
            'security list-keychain -d user -s "$KEYCHAIN_PATH"',
          ].join('\n'),
        },
        {
          name: 'Install frontend dependencies',
          run: 'npm ci',
        },
        {
          name: 'Build Tauri app (Linux)',
          if: "matrix.platform == 'linux'",
          run: 'npm run tauri build',
        },
        {
          name: 'Build Tauri app (macOS universal binary + notarize)',
          if: "matrix.platform == 'macos'",
          env: {
            APPLE_CERTIFICATE: '${{ secrets.APPLE_CERTIFICATE }}',
            APPLE_CERTIFICATE_PASSWORD: '${{ secrets.APPLE_CERTIFICATE_PASSWORD }}',
            APPLE_SIGNING_IDENTITY: '${{ secrets.APPLE_SIGNING_IDENTITY }}',
            APPLE_ID: '${{ secrets.APPLE_ID }}',
            APPLE_PASSWORD: '${{ secrets.APPLE_PASSWORD }}',
            APPLE_TEAM_ID: '${{ secrets.APPLE_TEAM_ID }}',
          },
          run: [
            'npm run tauri build -- --target universal-apple-darwin',
          ].join('\n'),
        },
        {
          name: 'Collect artifact paths (Linux)',
          if: "matrix.platform == 'linux'",
          run: [
            'echo "DEB=$(ls src-tauri/target/release/bundle/deb/*.deb)" >> $GITHUB_ENV',
            'echo "APPIMAGE=$(ls src-tauri/target/release/bundle/appimage/*.AppImage)" >> $GITHUB_ENV',
          ].join('\n'),
        },
        {
          name: 'Collect artifact paths (macOS)',
          if: "matrix.platform == 'macos'",
          run: [
            'echo "DMG=$(ls src-tauri/target/universal-apple-darwin/release/bundle/dmg/*.dmg)" >> $GITHUB_ENV',
          ].join('\n'),
        },
        {
          name: 'Upload Linux artifacts',
          if: "matrix.platform == 'linux'",
          uses: 'actions/upload-artifact@v4',
          with: {
            name: 'promptnotes-linux',
            path: [
              'src-tauri/target/release/bundle/deb/*.deb',
              'src-tauri/target/release/bundle/appimage/*.AppImage',
            ].join('\n'),
            'if-no-files-found': 'error',
            'retention-days': '7',
          },
        },
        {
          name: 'Upload macOS artifacts',
          if: "matrix.platform == 'macos'",
          uses: 'actions/upload-artifact@v4',
          with: {
            name: 'promptnotes-macos',
            path: 'src-tauri/target/universal-apple-darwin/release/bundle/dmg/*.dmg',
            'if-no-files-found': 'error',
            'retention-days': '7',
          },
        },
        {
          name: 'Create GitHub Release',
          if: "startsWith(github.ref, 'refs/tags/v')",
          uses: 'softprops/action-gh-release@v2',
          with: {
            files: [
              'src-tauri/target/release/bundle/deb/*.deb',
              'src-tauri/target/release/bundle/appimage/*.AppImage',
              'src-tauri/target/universal-apple-darwin/release/bundle/dmg/*.dmg',
            ].join('\n'),
            draft: true,
            generate_release_notes: true,
          },
        },
      ],
    },
  },
};
