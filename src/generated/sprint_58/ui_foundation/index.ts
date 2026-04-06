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

export type {
  LinuxBundleFormat,
  Architecture,
  BuildTarget,
  AppMetadata,
  TauriBundleLinuxConfig,
  DebBundleConfig,
  AppImageBundleConfig,
  DesktopEntryConfig,
  DesktopAction,
  BuildArtifact,
  BuildResult,
  BuildPipelineConfig,
  XdgPaths,
  LinuxSystemInfo,
} from './types';

export {
  APP_METADATA,
  getAppIdentifier,
  getAppVersion,
  getBinaryName,
  getDisplayName,
} from './app-metadata';

export {
  resolveXdgPaths,
  getDefaultNotesDir,
  getDefaultConfigPath,
  getDefaultCacheDir,
  getInstallPaths,
} from './linux-paths';
export type { LinuxInstallPaths } from './linux-paths';

export {
  detectLinuxSystemInfo,
  validateBuildPrerequisites,
} from './platform-detect';
export type { BuildPrerequisiteResult } from './platform-detect';

export {
  createDefaultDesktopEntryConfig,
  generateDesktopEntry,
  validateDesktopEntry,
} from './desktop-entry-generator';
export type { DesktopEntryValidationResult } from './desktop-entry-generator';

export {
  createDefaultDebConfig,
  createDefaultAppImageConfig,
  createDefaultLinuxBundleConfig,
  generateTauriConfJson,
} from './tauri-linux-config';
export type {
  TauriConfJson,
  TauriConfBuild,
  TauriConfApp,
  TauriConfWindow,
  TauriConfSecurity,
  TauriConfBundle,
  TauriConfBundleLinux,
  TauriConfBundleDeb,
  TauriConfBundleAppImage,
} from './tauri-linux-config';

export {
  getDefaultAppImageBuildOptions,
  getExpectedAppImageFilename,
  generateAppImageDesktopContent,
  describeAppDirStructure,
  generateAppRunScript,
} from './appimage-config';
export type { AppImageBuildOptions, AppDirStructure } from './appimage-config';

export {
  getDefaultDebBuildOptions,
  getExpectedDebFilename,
  generateDebControlContent,
  describeDebPackageLayout,
  generatePostinstScript,
  generatePostrmScript,
} from './deb-config';
export type { DebBuildOptions, DebPackageLayout } from './deb-config';

export {
  validateArtifact,
  validateAllArtifacts,
} from './build-artifacts-validator';
export type { ArtifactValidationResult } from './build-artifacts-validator';

export {
  createDefaultPipelineConfig,
  runBuildPipeline,
  generateChecksumFile,
} from './build-pipeline';
export type { BuildPipelineResult } from './build-pipeline';

export {
  generateMetainfoXml,
  validateMetainfoXml,
} from './metainfo-generator';
export type { MetainfoValidationResult } from './metainfo-generator';
