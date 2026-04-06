// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 57-1
// @task-title: 対象プラットフォーム
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=57, task=57-1, deliverable=対象プラットフォーム
// Conventions: platform:linux, platform:macos —
//   Linux（バイナリ・Flatpak・NixOS）および macOS（バイナリ・Homebrew Cask）配布必須。Windowsは対象外。

import { Platform } from './platform';

/**
 * Distribution format identifier.
 */
export const DistributionFormat = {
  /** Linux: AppImage or .deb binary download */
  LinuxBinary: 'linux-binary',
  /** Linux: Flatpak via Flathub */
  Flatpak: 'flatpak',
  /** Linux: NixOS package */
  NixOS: 'nixos',
  /** macOS: .dmg binary download */
  MacOSBinary: 'macos-binary',
  /** macOS: Homebrew Cask */
  HomebrewCask: 'homebrew-cask',
} as const;

export type DistributionFormat =
  (typeof DistributionFormat)[keyof typeof DistributionFormat];

/**
 * Human-readable distribution format metadata.
 */
export interface DistributionInfo {
  readonly format: DistributionFormat;
  readonly displayName: string;
  readonly fileExtension: string | null;
  readonly description: string;
}

/**
 * All distribution formats with metadata.
 */
export const DISTRIBUTION_INFO: readonly DistributionInfo[] = [
  {
    format: DistributionFormat.LinuxBinary,
    displayName: 'Linux Binary',
    fileExtension: '.AppImage / .deb',
    description: 'バイナリ直接ダウンロード（AppImage または deb パッケージ）',
  },
  {
    format: DistributionFormat.Flatpak,
    displayName: 'Flatpak (Flathub)',
    fileExtension: null,
    description: 'Flathub 経由の Flatpak パッケージ',
  },
  {
    format: DistributionFormat.NixOS,
    displayName: 'NixOS Package',
    fileExtension: null,
    description: 'NixOS / Nix パッケージマネージャ',
  },
  {
    format: DistributionFormat.MacOSBinary,
    displayName: 'macOS Binary',
    fileExtension: '.dmg',
    description: 'バイナリ直接ダウンロード（DMG ディスクイメージ）',
  },
  {
    format: DistributionFormat.HomebrewCask,
    displayName: 'Homebrew Cask',
    fileExtension: null,
    description: 'Homebrew Cask 経由のインストール',
  },
] as const;

/**
 * Distribution formats available per supported platform.
 */
export const PLATFORM_DISTRIBUTIONS: Readonly<
  Record<Platform, readonly DistributionFormat[]>
> = {
  [Platform.Linux]: [
    DistributionFormat.LinuxBinary,
    DistributionFormat.Flatpak,
    DistributionFormat.NixOS,
  ],
  [Platform.MacOS]: [
    DistributionFormat.MacOSBinary,
    DistributionFormat.HomebrewCask,
  ],
} as const;

/**
 * Returns the distribution formats available for the given platform.
 */
export function getDistributionFormats(
  platform: Platform
): readonly DistributionFormat[] {
  return PLATFORM_DISTRIBUTIONS[platform];
}

/**
 * Returns detailed info for distribution formats available on the given platform.
 */
export function getDistributionInfo(
  platform: Platform
): readonly DistributionInfo[] {
  const formats = PLATFORM_DISTRIBUTIONS[platform];
  return DISTRIBUTION_INFO.filter((info) =>
    formats.includes(info.format)
  );
}
