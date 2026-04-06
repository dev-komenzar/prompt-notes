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
// CoDD trace: plan:implementation_plan > design:system-design > governance:adr_tech_stack
// Module: ui_foundation | Platform: linux
// Convention: framework:tauri — Tauri（Rust + WebView）は確定済み

import type { FlatpakManifest, FlatpakModule, FlatpakSource } from './types';
import {
  FLATPAK_APP_ID,
  APP_BINARY_NAME,
} from './types';
import { buildFlatpakFinishArgs } from './flatpak-permissions';

const FREEDESKTOP_RUNTIME = 'org.freedesktop.Platform';
const FREEDESKTOP_SDK = 'org.freedesktop.Sdk';
const RUNTIME_VERSION = '24.08';

const RUST_SDK_EXTENSION = 'org.freedesktop.Sdk.Extension.rust-stable';
const NODE_SDK_EXTENSION = 'org.freedesktop.Sdk.Extension.node20';

/**
 * Build the Tauri application module for the Flatpak manifest.
 * This module compiles the Rust backend and bundles the Svelte frontend.
 */
function buildTauriAppModule(
  gitUrl: string,
  gitTag: string,
  cargoSources: readonly FlatpakSource[]
): FlatpakModule {
  return {
    name: APP_BINARY_NAME,
    buildsystem: 'simple',
    buildCommands: [
      '. /usr/lib/sdk/rust-stable/enable.sh',
      '. /usr/lib/sdk/node20/enable.sh',
      'npm ci --ignore-scripts',
      'npm run build',
      'cargo build --release --manifest-path src-tauri/Cargo.toml',
      `install -Dm755 src-tauri/target/release/${APP_BINARY_NAME} /app/bin/${APP_BINARY_NAME}`,
      `install -Dm644 flatpak/${FLATPAK_APP_ID}.desktop /app/share/applications/${FLATPAK_APP_ID}.desktop`,
      `install -Dm644 flatpak/${FLATPAK_APP_ID}.metainfo.xml /app/share/metainfo/${FLATPAK_APP_ID}.metainfo.xml`,
      `install -Dm644 flatpak/icons/128x128/${FLATPAK_APP_ID}.png /app/share/icons/hicolor/128x128/apps/${FLATPAK_APP_ID}.png`,
      `install -Dm644 flatpak/icons/256x256/${FLATPAK_APP_ID}.png /app/share/icons/hicolor/256x256/apps/${FLATPAK_APP_ID}.png`,
      `install -Dm644 flatpak/icons/512x512/${FLATPAK_APP_ID}.png /app/share/icons/hicolor/512x512/apps/${FLATPAK_APP_ID}.png`,
    ],
    sources: [
      { type: 'git', url: gitUrl, tag: gitTag },
      ...cargoSources,
    ],
    buildOptions: {
      'append-path': '/usr/lib/sdk/rust-stable/bin:/usr/lib/sdk/node20/bin',
      'env': 'CARGO_HOME=/run/build/promptnotes/cargo',
    },
  };
}

/**
 * Build the WebKitGTK dependency module required by Tauri on Linux.
 */
function buildWebKitGTKModule(): FlatpakModule {
  return {
    name: 'webkit2gtk-4.1',
    buildsystem: 'simple',
    buildCommands: [
      'echo "WebKitGTK provided by runtime"',
    ],
    sources: [],
  };
}

/**
 * Generate a complete Flatpak manifest for PromptNotes.
 *
 * The manifest follows Flathub submission guidelines:
 * - Uses freedesktop runtime/SDK
 * - Includes Rust and Node.js SDK extensions for build
 * - Declares minimal sandbox permissions
 * - Installs desktop entry, AppStream metadata, and icons
 */
export function generateFlatpakManifest(
  gitUrl: string,
  gitTag: string,
  cargoSources: readonly FlatpakSource[] = []
): FlatpakManifest {
  return {
    'app-id': FLATPAK_APP_ID,
    runtime: FREEDESKTOP_RUNTIME,
    'runtime-version': RUNTIME_VERSION,
    sdk: FREEDESKTOP_SDK,
    'sdk-extensions': [RUST_SDK_EXTENSION, NODE_SDK_EXTENSION],
    command: APP_BINARY_NAME,
    'finish-args': buildFlatpakFinishArgs(),
    'build-options': {
      'append-path': '/usr/lib/sdk/rust-stable/bin:/usr/lib/sdk/node20/bin',
    },
    cleanup: [
      '/include',
      '/lib/pkgconfig',
      '/share/man',
      '*.a',
      '*.la',
    ],
    modules: [
      buildWebKitGTKModule(),
      buildTauriAppModule(gitUrl, gitTag, cargoSources),
    ],
  };
}

/**
 * Serialize the Flatpak manifest to YAML-compatible JSON format.
 * Flathub accepts both JSON and YAML manifests.
 */
export function serializeFlatpakManifest(manifest: FlatpakManifest): string {
  return JSON.stringify(manifest, null, 2);
}

/**
 * Generate a YAML-formatted Flatpak manifest string.
 * Flathub prefers YAML format for readability.
 */
export function serializeFlatpakManifestYaml(manifest: FlatpakManifest): string {
  const lines: string[] = [];

  lines.push(`app-id: ${manifest['app-id']}`);
  lines.push(`runtime: ${manifest.runtime}`);
  lines.push(`runtime-version: '${manifest['runtime-version']}'`);
  lines.push(`sdk: ${manifest.sdk}`);

  if (manifest['sdk-extensions'] && manifest['sdk-extensions'].length > 0) {
    lines.push('sdk-extensions:');
    for (const ext of manifest['sdk-extensions']) {
      lines.push(`  - ${ext}`);
    }
  }

  lines.push(`command: ${manifest.command}`);

  lines.push('finish-args:');
  for (const arg of manifest['finish-args']) {
    lines.push(`  - ${arg}`);
  }

  if (manifest['build-options']) {
    lines.push('build-options:');
    for (const [key, value] of Object.entries(manifest['build-options'])) {
      lines.push(`  ${key}: ${typeof value === 'string' ? value : String(value)}`);
    }
  }

  if (manifest.cleanup && manifest.cleanup.length > 0) {
    lines.push('cleanup:');
    for (const pattern of manifest.cleanup) {
      lines.push(`  - '${pattern}'`);
    }
  }

  lines.push('modules:');
  for (const mod of manifest.modules) {
    lines.push(`  - name: ${mod.name}`);
    lines.push(`    buildsystem: ${mod.buildsystem}`);

    if (mod.buildOptions) {
      lines.push('    build-options:');
      for (const [key, value] of Object.entries(mod.buildOptions)) {
        lines.push(`      ${key}: ${typeof value === 'string' ? value : String(value)}`);
      }
    }

    if (mod.buildCommands && mod.buildCommands.length > 0) {
      lines.push('    build-commands:');
      for (const cmd of mod.buildCommands) {
        lines.push(`      - ${cmd}`);
      }
    }

    if (mod.installCommands && mod.installCommands.length > 0) {
      lines.push('    install-commands:');
      for (const cmd of mod.installCommands) {
        lines.push(`      - ${cmd}`);
      }
    }

    if (mod.sources.length > 0) {
      lines.push('    sources:');
      for (const src of mod.sources) {
        lines.push(`      - type: ${src.type}`);
        if (src.type === 'git') {
          lines.push(`        url: ${src.url}`);
          if (src.tag) lines.push(`        tag: ${src.tag}`);
          if (src.commit) lines.push(`        commit: ${src.commit}`);
        } else if (src.type === 'archive') {
          lines.push(`        url: ${src.url}`);
          lines.push(`        sha256: ${src.sha256}`);
        } else if (src.type === 'file') {
          lines.push(`        path: ${src.path}`);
          if (src.destFilename) lines.push(`        dest-filename: ${src.destFilename}`);
        } else if (src.type === 'inline') {
          lines.push(`        contents: |`);
          for (const line of src.contents.split('\n')) {
            lines.push(`          ${line}`);
          }
          lines.push(`        dest-filename: ${src.destFilename}`);
        }
      }
    } else {
      lines.push('    sources: []');
    }
  }

  return lines.join('\n') + '\n';
}
