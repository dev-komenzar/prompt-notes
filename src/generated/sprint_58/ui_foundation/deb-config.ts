// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 58-1
// @task-title: Linux
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// Generated from Sprint 58 — Linux バイナリビルド（.AppImage, .deb）
// CoDD trace: plan:implementation_plan > task:58-1
// Convention: platform:linux — Debian package distribution format

import { APP_METADATA } from './app-metadata';

export interface DebBuildOptions {
  readonly arch: 'amd64' | 'arm64';
  readonly maintainer: string;
  readonly homepage: string;
  readonly section: string;
  readonly priority: string;
  readonly verbose: boolean;
}

export function getDefaultDebBuildOptions(): DebBuildOptions {
  return {
    arch: 'amd64',
    maintainer: `${APP_METADATA.productName} Maintainers <maintainers@promptnotes.dev>`,
    homepage: APP_METADATA.homepage,
    section: 'utils',
    priority: 'optional',
    verbose: false,
  };
}

export function getExpectedDebFilename(version: string, arch: string): string {
  return `${APP_METADATA.name}_${version}_${arch}.deb`;
}

export function generateDebControlContent(options: DebBuildOptions): string {
  const depends = [
    'libwebkit2gtk-4.1-0',
    'libgtk-3-0',
    'libglib2.0-0',
    'libjavascriptcoregtk-4.1-0',
  ];

  const recommends = ['libayatana-appindicator3-1'];

  return [
    `Package: ${APP_METADATA.name}`,
    `Version: ${APP_METADATA.version}`,
    `Section: ${options.section}`,
    `Priority: ${options.priority}`,
    `Architecture: ${options.arch}`,
    `Depends: ${depends.join(', ')}`,
    `Recommends: ${recommends.join(', ')}`,
    `Maintainer: ${options.maintainer}`,
    `Homepage: ${options.homepage}`,
    `Description: ${APP_METADATA.description}`,
    ` ${APP_METADATA.productName} is a local-first note app for quickly jotting`,
    ' down prompts to pass to AI. Built with Tauri (Rust + WebView),',
    ' it stores notes as local .md files with YAML frontmatter.',
    '',
  ].join('\n');
}

export interface DebPackageLayout {
  readonly controlDir: string;
  readonly controlFile: string;
  readonly postinstScript: string;
  readonly postrm: string;
  readonly binaryPath: string;
  readonly desktopFilePath: string;
  readonly iconPaths: Record<string, string>;
}

export function describeDebPackageLayout(buildRoot: string): DebPackageLayout {
  const name = APP_METADATA.name;
  const identifier = APP_METADATA.identifier;

  return {
    controlDir: `${buildRoot}/DEBIAN`,
    controlFile: `${buildRoot}/DEBIAN/control`,
    postinstScript: `${buildRoot}/DEBIAN/postinst`,
    postrm: `${buildRoot}/DEBIAN/postrm`,
    binaryPath: `${buildRoot}/usr/bin/${name}`,
    desktopFilePath: `${buildRoot}/usr/share/applications/${identifier}.desktop`,
    iconPaths: {
      '32x32': `${buildRoot}/usr/share/icons/hicolor/32x32/apps/${name}.png`,
      '64x64': `${buildRoot}/usr/share/icons/hicolor/64x64/apps/${name}.png`,
      '128x128': `${buildRoot}/usr/share/icons/hicolor/128x128/apps/${name}.png`,
      '256x256': `${buildRoot}/usr/share/icons/hicolor/256x256/apps/${name}.png`,
    },
  };
}

export function generatePostinstScript(): string {
  return [
    '#!/bin/sh',
    'set -e',
    '',
    '# Update desktop database',
    'if command -v update-desktop-database > /dev/null 2>&1; then',
    '    update-desktop-database /usr/share/applications || true',
    'fi',
    '',
    '# Update icon cache',
    'if command -v gtk-update-icon-cache > /dev/null 2>&1; then',
    '    gtk-update-icon-cache -f -t /usr/share/icons/hicolor || true',
    'fi',
    '',
    '# Update MIME database',
    'if command -v update-mime-database > /dev/null 2>&1; then',
    '    update-mime-database /usr/share/mime || true',
    'fi',
    '',
    'exit 0',
    '',
  ].join('\n');
}

export function generatePostrmScript(): string {
  return [
    '#!/bin/sh',
    'set -e',
    '',
    '# Update desktop database',
    'if command -v update-desktop-database > /dev/null 2>&1; then',
    '    update-desktop-database /usr/share/applications || true',
    'fi',
    '',
    '# Update icon cache',
    'if command -v gtk-update-icon-cache > /dev/null 2>&1; then',
    '    gtk-update-icon-cache -f -t /usr/share/icons/hicolor || true',
    'fi',
    '',
    'exit 0',
    '',
  ].join('\n');
}
