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
// Re-exports for the platform module.

export {
  Platform,
  UnsupportedPlatform,
  WebViewEngine,
  detectPlatform,
  requireSupportedPlatform,
  isSupportedPlatform,
  PlatformNotSupportedError,
} from './platform';
export type { KnownPlatform } from './platform';

export {
  DEFAULT_PATHS,
  getDefaultPaths,
  APP_NAME,
  NOTES_SUBDIR,
  CONFIG_FILENAME,
} from './paths';
export type { PlatformPaths } from './paths';

export {
  MODIFIER_KEY,
  MODIFIER_SYMBOL,
  CM6_MOD_KEY,
  formatKeybindingLabel,
  getCoreKeybindings,
  getNewNoteKeybinding,
} from './keybindings';
export type { KeybindingDef } from './keybindings';

export {
  DistributionFormat,
  DISTRIBUTION_INFO,
  PLATFORM_DISTRIBUTIONS,
  getDistributionFormats,
  getDistributionInfo,
} from './distribution';
export type { DistributionInfo } from './distribution';

export {
  REQUIRED_MODULES,
  PROHIBITED_MODULES,
  REQUIRED_FRAMEWORK,
  REQUIRED_EDITOR_ENGINE,
  REQUIRED_STORAGE,
  RELEASE_BLOCKING_CONSTRAINTS,
  validatePlatform,
  enforcePlatformSupport,
} from './validation';
export type {
  RequiredModule,
  ProhibitedModule,
  PlatformValidationResult,
  ReleaseBlockingConstraintId,
} from './validation';
