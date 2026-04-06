// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 59-1
// @task-title: Linux
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// Generated from Sprint 59 — Task 59-1 (Linux Flatpak パッケージ作成)
// CoDD trace: plan:implementation_plan
// Module: ui_foundation | Platform: linux
// Public API barrel export for Flatpak packaging utilities

export type {
  SupportedPlatform,
  FlatpakPermission,
  FlatpakModule,
  FlatpakSource,
  FlatpakGitSource,
  FlatpakArchiveSource,
  FlatpakFileSource,
  FlatpakInlineSource,
  FlatpakManifest,
  DesktopEntry,
  AppStreamRelease,
  AppStreamScreenshot,
  AppStreamMetadata,
  ContentRatingType,
  FlatpakBuildConfig,
  LinuxPaths,
  PlatformInfo,
  FlatpakValidationResult,
} from './types';

export {
  FLATPAK_APP_ID,
  APP_NAME,
  APP_BINARY_NAME,
  APP_VERSION,
  APP_LICENSE,
  APP_SUMMARY,
  APP_DEVELOPER_NAME,
  APP_HOMEPAGE,
  APP_BUGTRACKER,
} from './types';

export {
  detectFlatpakSandbox,
  detectNixOS,
  parsePlatformFromUserAgent,
  resolveDataPaths,
  detectPlatformInfo,
} from './platform-detect';

export {
  generateFlatpakManifest,
  serializeFlatpakManifest,
  serializeFlatpakManifestYaml,
} from './flatpak-manifest';

export {
  REQUIRED_PERMISSIONS,
  permissionToFinishArg,
  buildFlatpakFinishArgs,
  validateFinishArgs,
  isPathAllowedByPermissions,
} from './flatpak-permissions';

export {
  generateDesktopEntry,
  serializeDesktopEntry,
  validateDesktopEntry,
} from './desktop-entry';

export {
  generateAppStreamMetadata,
  serializeAppStreamXml,
  validateAppStreamMetadata,
} from './appstream-metadata';

export {
  computeLinuxPaths,
  resolveEffectiveNotesDir,
  validateNotesDirectoryPath,
  getDesktopEntryInstallPath,
  getMetainfoInstallPath,
  getIconInstallPaths,
} from './linux-paths';

export {
  validateFlatpakSubmission,
  validateFlatpakManifest,
  validateAppId,
} from './validate';

export {
  createDefaultBuildConfig,
  generateFlatpakBuildCommand,
  generateFlatpakRunCommand,
  generateFlatpakExportCommand,
  generateCiBuildCommand,
  generateBuildScript,
  generateFlathubJson,
} from './build-config';

export {
  generateCargoConfigInline,
  generateCargoSourcesFileRef,
  generateCargoSourcesCommand,
  generateToolDownloadCommand,
  generateNodeSourcesCommand,
  CORE_TAURI_DEPENDENCIES,
} from './cargo-sources';
