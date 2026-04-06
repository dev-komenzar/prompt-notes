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
// Convention: platform:linux — AppImage distribution format

import { APP_METADATA } from './app-metadata';

export interface AppImageBuildOptions {
  readonly arch: 'x86_64' | 'aarch64';
  readonly compressionType: 'gzip' | 'zstd';
  readonly updateInfo: string | null;
  readonly signKey: string | null;
  readonly verbose: boolean;
}

export function getDefaultAppImageBuildOptions(): AppImageBuildOptions {
  return {
    arch: 'x86_64',
    compressionType: 'gzip',
    updateInfo: null,
    signKey: null,
    verbose: false,
  };
}

export function getExpectedAppImageFilename(version: string, arch: string): string {
  return `${APP_METADATA.name}_${version}_${arch}.AppImage`;
}

export function generateAppImageDesktopContent(): string {
  return [
    '[Desktop Entry]',
    `Name=${APP_METADATA.productName}`,
    'GenericName=Note Editor',
    `Comment=${APP_METADATA.description}`,
    `Exec=${APP_METADATA.name} %U`,
    `Icon=${APP_METADATA.name}`,
    'Type=Application',
    'Terminal=false',
    'StartupNotify=true',
    `StartupWMClass=${APP_METADATA.productName}`,
    'Categories=Utility;TextEditor;Office;',
    'MimeType=text/markdown;text/x-markdown;text/plain;',
    'X-AppImage-Version=' + APP_METADATA.version,
    '',
  ].join('\n');
}

export interface AppDirStructure {
  readonly root: string;
  readonly binary: string;
  readonly desktopFile: string;
  readonly iconFile: string;
  readonly usrBin: string;
  readonly usrShareApplications: string;
  readonly usrShareIcons: string;
  readonly appRun: string;
}

export function describeAppDirStructure(appDirRoot: string): AppDirStructure {
  const name = APP_METADATA.name;
  return {
    root: appDirRoot,
    binary: `${appDirRoot}/usr/bin/${name}`,
    desktopFile: `${appDirRoot}/${name}.desktop`,
    iconFile: `${appDirRoot}/${name}.png`,
    usrBin: `${appDirRoot}/usr/bin`,
    usrShareApplications: `${appDirRoot}/usr/share/applications`,
    usrShareIcons: `${appDirRoot}/usr/share/icons/hicolor`,
    appRun: `${appDirRoot}/AppRun`,
  };
}

export function generateAppRunScript(): string {
  return [
    '#!/bin/sh',
    'SELF=$(readlink -f "$0")',
    'HERE=${SELF%/*}',
    `export PATH="\${HERE}/usr/bin/:\${PATH}"`,
    `export LD_LIBRARY_PATH="\${HERE}/usr/lib/:\${LD_LIBRARY_PATH}"`,
    `export XDG_DATA_DIRS="\${HERE}/usr/share/:\${XDG_DATA_DIRS}"`,
    `exec "\${HERE}/usr/bin/${APP_METADATA.name}" "$@"`,
    '',
  ].join('\n');
}
