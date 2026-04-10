// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 56-1
// @task-title: 4 モジュール実装完了
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// Sprint 56 Task 56-1: Linux/macOS プラットフォームパッケージング検証

export type Platform = 'linux' | 'macos';
export type DistributionFormat =
  | 'binary-deb'
  | 'binary-appimage'
  | 'flatpak'
  | 'nixos'
  | 'binary-dmg'
  | 'homebrew-cask';

export interface PackagingArtifact {
  platform: Platform;
  format: DistributionFormat;
  description: string;
  ciJobId: string;
  required: boolean;
}

export const PACKAGING_ARTIFACTS: PackagingArtifact[] = [
  {
    platform: 'linux',
    format: 'binary-deb',
    description: 'Debian パッケージ (.deb) — tauri build で生成',
    ciJobId: 'build-linux',
    required: true,
  },
  {
    platform: 'linux',
    format: 'binary-appimage',
    description: 'AppImage — tauri build で生成',
    ciJobId: 'build-linux',
    required: true,
  },
  {
    platform: 'linux',
    format: 'flatpak',
    description: 'Flatpak (Flathub) — com.promptnotes.PromptNotes.yml マニフェスト',
    ciJobId: 'build-flatpak',
    required: true,
  },
  {
    platform: 'linux',
    format: 'nixos',
    description: 'NixOS パッケージ — flake.nix パッケージビルド定義',
    ciJobId: 'build-nixos',
    required: true,
  },
  {
    platform: 'macos',
    format: 'binary-dmg',
    description: 'macOS ディスクイメージ (.dmg) — tauri build + notarization',
    ciJobId: 'build-macos',
    required: true,
  },
  {
    platform: 'macos',
    format: 'homebrew-cask',
    description: 'Homebrew Cask フォーミュラ',
    ciJobId: 'build-macos',
    required: true,
  },
];

export interface PackagingCheckResult {
  platform: Platform;
  artifacts: PackagingArtifact[];
  allPresent: boolean;
}

export function checkPlatformArtifacts(
  platform: Platform,
  availableFormats: DistributionFormat[],
): PackagingCheckResult {
  const platformArtifacts = PACKAGING_ARTIFACTS.filter((a) => a.platform === platform);
  const allPresent = platformArtifacts
    .filter((a) => a.required)
    .every((a) => availableFormats.includes(a.format));
  return { platform, artifacts: platformArtifacts, allPresent };
}

export interface PlatformReleaseReadiness {
  linux: PackagingCheckResult;
  macos: PackagingCheckResult;
  bothPlatformsReady: boolean;
}

export function evaluatePlatformReadiness(
  linuxFormats: DistributionFormat[],
  macosFormats: DistributionFormat[],
): PlatformReleaseReadiness {
  const linux = checkPlatformArtifacts('linux', linuxFormats);
  const macos = checkPlatformArtifacts('macos', macosFormats);
  return {
    linux,
    macos,
    bothPlatformsReady: linux.allPresent && macos.allPresent,
  };
}

/** Windows は将来対応。現時点でスコープ外。 */
export const WINDOWS_OUT_OF_SCOPE = true;
