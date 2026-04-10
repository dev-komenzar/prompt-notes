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

// @generated-from: docs/design/system_design.md §2.7, docs/requirements/requirements.md
// Sprint 56 Task 56-3: NixOS package distribution check

export interface NixFlakeInputs {
  nixpkgs?: string;
  rustPlatform?: boolean;
  naersk?: boolean;
}

export interface NixPackageDefinition {
  flakeNixPresent: boolean;
  packageOutputPresent: boolean;
  appOutputPresent: boolean;
  devShellOutputPresent: boolean;
  inputs: NixFlakeInputs;
}

export interface NixOsPackageCheckResult {
  flakeNixPresent: boolean;
  packageBuildDefined: boolean;
  devShellDefined: boolean;
  direnvIntegration: boolean;
  separateFromDevEnv: boolean;
  allPassed: boolean;
  failures: string[];
  warnings: string[];
}

export function checkNixOsPackage(input: {
  flakeNixPresent: boolean;
  packageDefinition?: NixPackageDefinition;
  envrcPresent: boolean;
  envrcContent?: string;
}): NixOsPackageCheckResult {
  const failures: string[] = [];
  const warnings: string[] = [];

  if (!input.flakeNixPresent) {
    failures.push(
      "flake.nix not found — required for NixOS package distribution and direnv dev environment"
    );
    return {
      flakeNixPresent: false,
      packageBuildDefined: false,
      devShellDefined: false,
      direnvIntegration: false,
      separateFromDevEnv: false,
      allPassed: false,
      failures,
      warnings,
    };
  }

  const pkg = input.packageDefinition;
  const packageBuildDefined = pkg?.packageOutputPresent ?? false;
  const devShellDefined = pkg?.devShellOutputPresent ?? false;

  if (!packageBuildDefined) {
    failures.push(
      "flake.nix missing packages.default or packages.promptnotes output — required for NixOS distribution"
    );
  }

  if (!devShellDefined) {
    failures.push(
      "flake.nix missing devShells.default output — required for 'direnv allow' dev environment (ADR-006)"
    );
  }

  // devShell must provide: rustc/cargo, nodejs, tauri-cli
  if (devShellDefined) {
    warnings.push(
      "Verify devShell provides: rustc, cargo, nodejs, tauri-cli, and pkg-config/webkit2gtk for Tauri builds"
    );
  }

  const direnvIntegration = input.envrcPresent;
  if (!direnvIntegration) {
    failures.push(
      ".envrc not found — required for 'direnv allow' dev environment setup (README Local Development)"
    );
  } else if (input.envrcContent) {
    const hasUseFlake =
      input.envrcContent.includes("use flake") ||
      input.envrcContent.includes("use_flake");
    if (!hasUseFlake) {
      failures.push(
        ".envrc must contain 'use flake' to activate the nix flake dev environment"
      );
    }
  }

  // Package build and dev shell should be separate concerns in flake.nix
  const separateFromDevEnv = packageBuildDefined && devShellDefined;

  return {
    flakeNixPresent: true,
    packageBuildDefined,
    devShellDefined,
    direnvIntegration,
    separateFromDevEnv,
    allPassed: failures.length === 0,
    failures,
    warnings,
  };
}

export interface NixPkgsSubmissionCheck {
  derivationFilePresent: boolean;
  metaLicenseSet: boolean;
  metaPlatformsLinux: boolean;
  maintainersSet: boolean;
  allPassed: boolean;
  failures: string[];
}

/**
 * Checks readiness for nixpkgs submission (optional, for official NixOS package registry).
 * The project may also distribute via its own flake without nixpkgs submission.
 */
export function checkNixPkgsSubmission(input: {
  derivationFilePresent: boolean;
  metaLicenseSet: boolean;
  metaPlatformsLinux: boolean;
  maintainersSet: boolean;
}): NixPkgsSubmissionCheck {
  const failures: string[] = [];

  if (!input.derivationFilePresent) {
    failures.push(
      "No nixpkgs-style derivation found — create nix/package.nix for nixpkgs submission"
    );
  }
  if (!input.metaLicenseSet) {
    failures.push("Nix derivation meta.license must be set (e.g., lib.licenses.mit)");
  }
  if (!input.metaPlatformsLinux) {
    failures.push(
      "Nix derivation meta.platforms must include linux (e.g., lib.platforms.linux)"
    );
  }
  if (!input.maintainersSet) {
    failures.push(
      "Nix derivation meta.maintainers must be set for nixpkgs submission"
    );
  }

  return {
    ...input,
    allPassed: failures.length === 0,
    failures,
  };
}
