// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 60-1
// @task-title: Linux
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=60, task=60-1, module=ui_foundation
// Dependency: governance:adr_tech_stack — ADR-006 distribution pipeline
// Convention: platform:linux, platform:macos — Both platforms required

import type { SupportedPlatform } from './package-meta';

export type LinuxBuildFormat = 'appimage' | 'deb' | 'flatpak' | 'nix';
export type MacOSBuildFormat = 'dmg' | 'homebrew-cask';
export type BuildFormat = LinuxBuildFormat | MacOSBuildFormat;

export interface BuildTarget {
  readonly platform: SupportedPlatform;
  readonly format: BuildFormat;
  readonly arch: readonly string[];
  readonly artifactExtension: string;
  readonly requiresCodeSigning: boolean;
}

export const LINUX_APPIMAGE_TARGET: Readonly<BuildTarget> = {
  platform: 'linux',
  format: 'appimage',
  arch: ['x86_64', 'aarch64'],
  artifactExtension: '.AppImage',
  requiresCodeSigning: false,
} as const;

export const LINUX_DEB_TARGET: Readonly<BuildTarget> = {
  platform: 'linux',
  format: 'deb',
  arch: ['amd64', 'arm64'],
  artifactExtension: '.deb',
  requiresCodeSigning: false,
} as const;

export const LINUX_FLATPAK_TARGET: Readonly<BuildTarget> = {
  platform: 'linux',
  format: 'flatpak',
  arch: ['x86_64', 'aarch64'],
  artifactExtension: '.flatpak',
  requiresCodeSigning: false,
} as const;

export const LINUX_NIX_TARGET: Readonly<BuildTarget> = {
  platform: 'linux',
  format: 'nix',
  arch: ['x86_64-linux', 'aarch64-linux'],
  artifactExtension: '',
  requiresCodeSigning: false,
} as const;

export const MACOS_DMG_TARGET: Readonly<BuildTarget> = {
  platform: 'macos',
  format: 'dmg',
  arch: ['x86_64', 'aarch64'],
  artifactExtension: '.dmg',
  requiresCodeSigning: true,
} as const;

export const ALL_BUILD_TARGETS: readonly Readonly<BuildTarget>[] = [
  LINUX_APPIMAGE_TARGET,
  LINUX_DEB_TARGET,
  LINUX_FLATPAK_TARGET,
  LINUX_NIX_TARGET,
  MACOS_DMG_TARGET,
] as const;

export function getTargetsForPlatform(platform: SupportedPlatform): readonly Readonly<BuildTarget>[] {
  return ALL_BUILD_TARGETS.filter((t) => t.platform === platform);
}

export function getLinuxTargets(): readonly Readonly<BuildTarget>[] {
  return getTargetsForPlatform('linux');
}

export function getMacOSTargets(): readonly Readonly<BuildTarget>[] {
  return getTargetsForPlatform('macos');
}

/**
 * Returns the tauri build command arguments for a specific target.
 * Used by CI/CD pipeline scripts.
 */
export function getTauriBuildArgs(target: BuildTarget): readonly string[] {
  const args: string[] = ['tauri', 'build'];

  switch (target.format) {
    case 'appimage':
      args.push('--bundles', 'appimage');
      break;
    case 'deb':
      args.push('--bundles', 'deb');
      break;
    case 'dmg':
      args.push('--bundles', 'dmg');
      break;
    case 'flatpak':
    case 'nix':
      // Flatpak and Nix use custom build pipelines
      // that invoke cargo build directly
      args.length = 0;
      args.push('cargo', 'build', '--release');
      break;
    default: {
      const _exhaustive: never = target.format;
      throw new Error(`Unknown build format: ${_exhaustive}`);
    }
  }

  return args;
}

export interface CIBuildMatrix {
  readonly os: string;
  readonly target: BuildTarget;
  readonly rustTarget: string;
}

export const CI_BUILD_MATRIX: readonly Readonly<CIBuildMatrix>[] = [
  {
    os: 'ubuntu-latest',
    target: LINUX_APPIMAGE_TARGET,
    rustTarget: 'x86_64-unknown-linux-gnu',
  },
  {
    os: 'ubuntu-latest',
    target: LINUX_DEB_TARGET,
    rustTarget: 'x86_64-unknown-linux-gnu',
  },
  {
    os: 'ubuntu-latest',
    target: LINUX_NIX_TARGET,
    rustTarget: 'x86_64-unknown-linux-gnu',
  },
  {
    os: 'macos-latest',
    target: MACOS_DMG_TARGET,
    rustTarget: 'aarch64-apple-darwin',
  },
] as const;
