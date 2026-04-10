// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 56-3
// @task-title: Linux
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/design/system_design.md, docs/requirements/requirements.md
// Sprint 56 Task 56-3: Linux platform release gate — combines all Linux distribution checks

import {
  runLinuxBinaryCheck,
  type LinuxBinaryCheckResult,
} from "./linux_binary_check";
import {
  checkFlatpakManifest,
  checkFlatpakMetadata,
  type FlatpakCheckResult,
  type FlatpakMetadataCheck,
  type FlatpakManifest,
} from "./flatpak_manifest_check";
import {
  checkNixOsPackage,
  checkNixPkgsSubmission,
  type NixOsPackageCheckResult,
  type NixPkgsSubmissionCheck,
  type NixPackageDefinition,
} from "./nixos_package_check";
import {
  evaluatePlatformReadiness,
  type PlatformReleaseReadiness,
} from "../4/platform_packaging_check";

export interface LinuxReleaseGateInput {
  // Binary artifacts
  debArtifactPresent: boolean;
  appImageArtifactPresent: boolean;
  tauriConf: { bundle?: { targets?: string | string[] }; identifier?: string };
  configuredNotesDir: string;

  // Flatpak
  flatpakManifestPresent: boolean;
  flatpakManifest?: FlatpakManifest;
  flatpakDesktopFilePresent: boolean;
  flatpakAppstreamXmlPresent: boolean;
  flatpakIconsPresent: boolean;

  // NixOS
  flakeNixPresent: boolean;
  nixPackageDefinition?: NixPackageDefinition;
  envrcPresent: boolean;
  envrcContent?: string;

  // Optional: nixpkgs submission
  nixpkgsDerivationPresent: boolean;
  nixMetaLicenseSet: boolean;
  nixMetaPlatformsLinux: boolean;
  nixMaintainersSet: boolean;
}

export interface LinuxReleaseGateResult {
  binaryCheck: LinuxBinaryCheckResult;
  flatpakCheck: FlatpakCheckResult;
  flatpakMetadataCheck: FlatpakMetadataCheck;
  nixOsCheck: NixOsPackageCheckResult;
  nixPkgsCheck: NixPkgsSubmissionCheck;
  platformReadiness: PlatformReleaseReadiness;
  overallPassed: boolean;
  // Release-blocking failures only (binary + flatpak manifest core + nix flake)
  releaseBlockingFailures: string[];
  // Non-blocking issues (metadata completeness, nixpkgs submission)
  warnings: string[];
}

/**
 * Release-blocking criteria for Linux:
 * 1. .deb and .AppImage artifacts produced by `tauri build`
 * 2. Flatpak manifest present with correct appId and sandbox permissions
 * 3. flake.nix present with package and devShell outputs
 * 4. .envrc present with `use flake`
 * 5. Default notes dir is ~/.local/share/promptnotes/notes/
 */
export function runLinuxReleaseGate(
  input: LinuxReleaseGateInput
): LinuxReleaseGateResult {
  const binaryCheck = runLinuxBinaryCheck({
    debArtifactPresent: input.debArtifactPresent,
    appImageArtifactPresent: input.appImageArtifactPresent,
    tauriConf: input.tauriConf,
    configuredNotesDir: input.configuredNotesDir,
  });

  const flatpakCheck = checkFlatpakManifest({
    manifestPresent: input.flatpakManifestPresent,
    manifest: input.flatpakManifest,
  });

  const flatpakMetadataCheck = checkFlatpakMetadata({
    desktopFilePresent: input.flatpakDesktopFilePresent,
    appstreamXmlPresent: input.flatpakAppstreamXmlPresent,
    iconsPresent: input.flatpakIconsPresent,
  });

  const nixOsCheck = checkNixOsPackage({
    flakeNixPresent: input.flakeNixPresent,
    packageDefinition: input.nixPackageDefinition,
    envrcPresent: input.envrcPresent,
    envrcContent: input.envrcContent,
  });

  const nixPkgsCheck = checkNixPkgsSubmission({
    derivationFilePresent: input.nixpkgsDerivationPresent,
    metaLicenseSet: input.nixMetaLicenseSet,
    metaPlatformsLinux: input.nixMetaPlatformsLinux,
    maintainersSet: input.nixMaintainersSet,
  });

  // Release-blocking: binary + flatpak core + nix dev env
  const releaseBlockingFailures: string[] = [
    ...binaryCheck.failures,
    ...flatpakCheck.failures,
    ...nixOsCheck.failures,
  ];

  // Warnings: metadata completeness (needed for store submissions, not for binary release)
  const warnings: string[] = [
    ...flatpakMetadataCheck.failures.map((f) => `[Flatpak metadata] ${f}`),
    ...nixPkgsCheck.failures.map((f) => `[nixpkgs submission] ${f}`),
    ...(flatpakCheck.warnings ?? []),
    ...(nixOsCheck.warnings ?? []),
  ];

  const platformReadiness = evaluatePlatformReadiness({
    platform: "linux",
    artifacts: [
      {
        format: "binary",
        platform: "linux",
        present: input.debArtifactPresent && input.appImageArtifactPresent,
        path: "target/release/bundle/{deb,appimage}/",
        description: "Linux .deb and .AppImage binaries",
      },
      {
        format: "flatpak",
        platform: "linux",
        present: input.flatpakManifestPresent,
        path: "flatpak/com.promptnotes.PromptNotes.yml",
        description: "Flatpak manifest for Flathub",
      },
      {
        format: "nix",
        platform: "linux",
        present: input.flakeNixPresent,
        path: "flake.nix",
        description: "Nix flake for NixOS package and dev environment",
      },
    ],
  });

  const overallPassed = releaseBlockingFailures.length === 0;

  return {
    binaryCheck,
    flatpakCheck,
    flatpakMetadataCheck,
    nixOsCheck,
    nixPkgsCheck,
    platformReadiness,
    overallPassed,
    releaseBlockingFailures,
    warnings,
  };
}

export function linuxCiExitCode(result: LinuxReleaseGateResult): 0 | 1 {
  return result.overallPassed ? 0 : 1;
}

// Canonical expected input for CI validation
export const EXPECTED_LINUX_RELEASE_INPUT: Pick<
  LinuxReleaseGateInput,
  | "debArtifactPresent"
  | "appImageArtifactPresent"
  | "flatpakManifestPresent"
  | "flakeNixPresent"
  | "envrcPresent"
> = {
  debArtifactPresent: true,
  appImageArtifactPresent: true,
  flatpakManifestPresent: true,
  flakeNixPresent: true,
  envrcPresent: true,
};
