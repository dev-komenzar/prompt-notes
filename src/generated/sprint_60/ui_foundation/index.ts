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
// Barrel export for Linux NixOS packaging module

export {
  packageMeta,
  PACKAGE_NAME,
  PACKAGE_DISPLAY_NAME,
  PACKAGE_VERSION,
  PACKAGE_DESCRIPTION,
  PACKAGE_LICENSE,
  PACKAGE_HOMEPAGE,
  PACKAGE_REPOSITORY,
  PACKAGE_AUTHOR,
  PACKAGE_IDENTIFIER,
  LINUX_DISTRIBUTION,
  MACOS_DISTRIBUTION,
  SUPPORTED_DISTRIBUTIONS,
  type PackageMeta,
  type SupportedPlatform,
  type PlatformDistribution,
} from './package-meta';

export {
  resolveLinuxPaths,
  resolveMacOSPaths,
  resolveXdgPaths,
  detectLinuxVariant,
  resolveLinuxPathsWithEnv,
  EXPECTED_LINUX_DEFAULT,
  EXPECTED_MACOS_DEFAULT,
  type LinuxVariant,
  type PlatformPaths,
} from './platform-paths';

export {
  NIX_DERIVATION_META,
  NIX_BUILD_INPUTS,
  NIX_DESKTOP_INTEGRATION,
  TAURI_BUNDLE_CONFIG,
  NIX_PACKAGE_CONFIG,
  generateNixExpression,
  generateFlakeOverlay,
  type NixDerivationMeta,
  type NixBuildInputs,
  type NixDesktopIntegration,
  type NixPackageConfig,
  type TauriBundleConfig,
} from './nix-package-config';

export {
  createDesktopEntry,
  serializeDesktopEntry,
  generateAppStreamMetainfo,
  type DesktopEntry,
} from './desktop-entry-builder';

export {
  ALL_BUILD_TARGETS,
  LINUX_APPIMAGE_TARGET,
  LINUX_DEB_TARGET,
  LINUX_FLATPAK_TARGET,
  LINUX_NIX_TARGET,
  MACOS_DMG_TARGET,
  CI_BUILD_MATRIX,
  getTargetsForPlatform,
  getLinuxTargets,
  getMacOSTargets,
  getTauriBuildArgs,
  type BuildTarget,
  type BuildFormat,
  type LinuxBuildFormat,
  type MacOSBuildFormat,
  type CIBuildMatrix,
} from './build-targets';

export {
  gatherLinuxEnvironment,
  resolveWebKitGtkConfig,
  buildNixWrapperEnvTemplate,
  validateLinuxRuntimeEnv,
  type LinuxEnvironmentInfo,
  type WebKitGtkEnvConfig,
  type NixWrapperEnv,
} from './linux-integration';

export {
  createNixDevShellConfig,
  generateShellNix,
  generateFlakeDevShell,
  type NixDevShellConfig,
} from './nix-shell-config';
