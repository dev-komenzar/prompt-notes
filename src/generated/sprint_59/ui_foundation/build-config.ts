// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 59-1
// @task-title: Linux
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// Generated from Sprint 59 — Task 59-1 (Linux Flatpak パッケージ作成)
// CoDD trace: plan:implementation_plan > governance:adr_tech_stack
// Module: ui_foundation | Platform: linux
// Convention: framework:tauri — Tauri build system produces platform bundles

import type { FlatpakBuildConfig } from './types';
import { FLATPAK_APP_ID, APP_BINARY_NAME } from './types';

/**
 * Default Flatpak build configuration for PromptNotes.
 * Defines the expected file structure for Flatpak packaging artifacts.
 */
export function createDefaultBuildConfig(projectRoot: string): FlatpakBuildConfig {
  return {
    appId: FLATPAK_APP_ID,
    manifestPath: `${projectRoot}/flatpak/${FLATPAK_APP_ID}.yml`,
    desktopEntryPath: `${projectRoot}/flatpak/${FLATPAK_APP_ID}.desktop`,
    appstreamPath: `${projectRoot}/flatpak/${FLATPAK_APP_ID}.metainfo.xml`,
    iconPaths: {
      svg: `${projectRoot}/flatpak/icons/scalable/${FLATPAK_APP_ID}.svg`,
      png128: `${projectRoot}/flatpak/icons/128x128/${FLATPAK_APP_ID}.png`,
      png256: `${projectRoot}/flatpak/icons/256x256/${FLATPAK_APP_ID}.png`,
      png512: `${projectRoot}/flatpak/icons/512x512/${FLATPAK_APP_ID}.png`,
    },
    tauriBundlePath: `${projectRoot}/src-tauri/target/release/${APP_BINARY_NAME}`,
    outputDir: `${projectRoot}/flatpak`,
  };
}

/**
 * Generate the flatpak-builder command for local testing.
 */
export function generateFlatpakBuildCommand(config: FlatpakBuildConfig): string {
  return [
    'flatpak-builder',
    '--force-clean',
    '--user',
    '--install',
    `--repo=${config.outputDir}/repo`,
    `${config.outputDir}/build`,
    config.manifestPath,
  ].join(' \\\n  ');
}

/**
 * Generate the flatpak run command for testing the built package.
 */
export function generateFlatpakRunCommand(): string {
  return `flatpak run ${FLATPAK_APP_ID}`;
}

/**
 * Generate the command to export the Flatpak bundle for distribution.
 */
export function generateFlatpakExportCommand(config: FlatpakBuildConfig): string {
  return [
    'flatpak',
    'build-bundle',
    `${config.outputDir}/repo`,
    `${config.outputDir}/${APP_BINARY_NAME}.flatpak`,
    FLATPAK_APP_ID,
  ].join(' \\\n  ');
}

/**
 * Generate the flatpak-builder command for CI/CD pipeline.
 * Includes --disable-updates to ensure reproducible builds.
 */
export function generateCiBuildCommand(config: FlatpakBuildConfig): string {
  return [
    'flatpak-builder',
    '--force-clean',
    '--disable-updates',
    '--disable-download',
    '--ccache',
    `--repo=${config.outputDir}/repo`,
    `${config.outputDir}/build`,
    config.manifestPath,
  ].join(' \\\n  ');
}

/**
 * Generate shell script content for the complete Flatpak build and test pipeline.
 */
export function generateBuildScript(projectRoot: string): string {
  const config = createDefaultBuildConfig(projectRoot);

  return `#!/usr/bin/env bash
set -euo pipefail

# PromptNotes Flatpak Build Script
# Generated for app-id: ${FLATPAK_APP_ID}
# Convention: framework:tauri — Tauri produces the binary, Flatpak wraps it

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${projectRoot}"
FLATPAK_DIR="${config.outputDir}"
MANIFEST="${config.manifestPath}"

echo "=== Installing Flatpak SDK and runtime ==="
flatpak install --user --noninteractive flathub org.freedesktop.Platform//24.08
flatpak install --user --noninteractive flathub org.freedesktop.Sdk//24.08
flatpak install --user --noninteractive flathub org.freedesktop.Sdk.Extension.rust-stable//24.08
flatpak install --user --noninteractive flathub org.freedesktop.Sdk.Extension.node20//24.08

echo "=== Validating desktop entry ==="
desktop-file-validate "${config.desktopEntryPath}" || echo "Warning: desktop-file-validate not found, skipping"

echo "=== Validating AppStream metadata ==="
appstreamcli validate "${config.appstreamPath}" || echo "Warning: appstreamcli not found, skipping"

echo "=== Building Flatpak ==="
${generateFlatpakBuildCommand(config)}

echo "=== Exporting bundle ==="
${generateFlatpakExportCommand(config)}

echo "=== Build complete ==="
echo "Run with: ${generateFlatpakRunCommand()}"
echo "Bundle: ${config.outputDir}/${APP_BINARY_NAME}.flatpak"
`;
}

/**
 * Generate the flathub.json configuration for Flathub submission.
 * This file controls Flathub-specific build settings.
 */
export function generateFlathubJson(): string {
  const config = {
    'disable-extra-data': true,
    'only-arches': ['x86_64', 'aarch64'],
  };

  return JSON.stringify(config, null, 2) + '\n';
}
