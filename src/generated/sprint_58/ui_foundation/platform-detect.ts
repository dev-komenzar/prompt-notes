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
// Convention: platform:linux — Linux distribution detection for build validation

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import type { Architecture, LinuxSystemInfo } from './types';

export function detectLinuxSystemInfo(): LinuxSystemInfo {
  const osRelease = parseOsRelease();
  const kernel = getKernelVersion();
  const arch = detectArchitecture();
  const webkitInfo = detectWebKitGTK();
  const gtkInfo = detectGTK();

  return {
    distro: osRelease.id,
    distroVersion: osRelease.versionId,
    kernel,
    arch,
    hasWebKitGTK: webkitInfo.installed,
    webKitGTKVersion: webkitInfo.version,
    hasGTK: gtkInfo.installed,
    gtkVersion: gtkInfo.version,
  };
}

export function validateBuildPrerequisites(): BuildPrerequisiteResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const info = detectLinuxSystemInfo();

  if (!info.hasWebKitGTK) {
    errors.push(
      'WebKitGTK is not installed. Tauri requires libwebkit2gtk-4.1-dev (or equivalent) for Linux builds.',
    );
  } else if (info.webKitGTKVersion) {
    const major = parseInt(info.webKitGTKVersion.split('.')[0], 10);
    if (major < 2) {
      errors.push(
        `WebKitGTK version ${info.webKitGTKVersion} is too old. Tauri requires WebKitGTK >= 2.x.`,
      );
    }
  }

  if (!info.hasGTK) {
    errors.push('GTK 3 is not installed. Tauri requires libgtk-3-dev (or equivalent) for Linux builds.');
  }

  if (!commandExists('cargo')) {
    errors.push('Rust toolchain (cargo) is not installed. Required for Tauri backend compilation.');
  }

  if (!commandExists('node')) {
    errors.push('Node.js is not installed. Required for frontend build.');
  }

  if (!commandExists('npm') && !commandExists('pnpm')) {
    warnings.push('Neither npm nor pnpm found. A Node.js package manager is required.');
  }

  const hasAppImageTool = commandExists('appimagetool') || commandExists('linuxdeploy');
  if (!hasAppImageTool) {
    warnings.push('appimagetool/linuxdeploy not found. AppImage generation may rely on Tauri bundled tools.');
  }

  if (!commandExists('dpkg-deb')) {
    warnings.push('dpkg-deb not found. Debian package (.deb) generation may fail on non-Debian systems.');
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
    systemInfo: info,
  };
}

export interface BuildPrerequisiteResult {
  readonly passed: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly systemInfo: LinuxSystemInfo;
}

interface OsReleaseInfo {
  id: string;
  versionId: string;
}

function parseOsRelease(): OsReleaseInfo {
  const defaultInfo: OsReleaseInfo = { id: 'unknown', versionId: 'unknown' };
  const osReleasePath = '/etc/os-release';

  if (!existsSync(osReleasePath)) {
    return defaultInfo;
  }

  try {
    const content = readFileSync(osReleasePath, 'utf-8');
    const lines = content.split('\n');
    const result: OsReleaseInfo = { ...defaultInfo };

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('ID=')) {
        result.id = trimmed.slice(3).replace(/"/g, '');
      } else if (trimmed.startsWith('VERSION_ID=')) {
        result.versionId = trimmed.slice(11).replace(/"/g, '');
      }
    }

    return result;
  } catch {
    return defaultInfo;
  }
}

function getKernelVersion(): string {
  try {
    return execSync('uname -r', { encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

function detectArchitecture(): Architecture {
  try {
    const machineType = execSync('uname -m', { encoding: 'utf-8' }).trim();
    if (machineType === 'x86_64' || machineType === 'amd64') {
      return 'x86_64';
    }
    if (machineType === 'aarch64' || machineType === 'arm64') {
      return 'aarch64';
    }
    return 'x86_64';
  } catch {
    return 'x86_64';
  }
}

function detectWebKitGTK(): { installed: boolean; version: string | null } {
  try {
    const output = execSync('pkg-config --modversion webkit2gtk-4.1 2>/dev/null || pkg-config --modversion webkit2gtk-4.0 2>/dev/null', {
      encoding: 'utf-8',
      shell: '/bin/sh',
    }).trim();
    return { installed: true, version: output || null };
  } catch {
    return { installed: false, version: null };
  }
}

function detectGTK(): { installed: boolean; version: string | null } {
  try {
    const output = execSync('pkg-config --modversion gtk+-3.0', {
      encoding: 'utf-8',
    }).trim();
    return { installed: true, version: output || null };
  } catch {
    return { installed: false, version: null };
  }
}

function commandExists(command: string): boolean {
  try {
    execSync(`which ${command}`, { encoding: 'utf-8', stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}
