// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 56-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=56, task=56-1, milestone=スコープ外機能の不存在確認, module=all

/**
 * Sprint 56 — スコープ外機能の不存在確認
 *
 * Entry point re-exporting all scope validation modules.
 *
 * This module provides:
 * 1. Scope manifest defining all prohibited/required features
 * 2. Per-module validators (editor, grid, storage, settings, platform, framework, AI)
 * 3. Runtime guards that prevent prohibited features at runtime
 * 4. IPC boundary guards
 * 5. Compliance report generator
 * 6. Validation runner for CI integration
 */

// Scope manifest
export {
  PROHIBITED_FEATURES,
  PROHIBITED_FEATURE_DEFINITIONS,
  REQUIRED_MODULES,
  SUPPORTED_PLATFORMS,
  REQUIRED_FRAMEWORK,
  REQUIRED_EDITOR_ENGINE,
  REQUIRED_STORAGE_FORMAT,
  type ProhibitedFeature,
  type RequiredModule,
  type SupportedPlatform,
  type ScopeComplianceResult,
  type ScopeViolation,
} from './scope_manifest';

// Module validators
export {
  validateEditorScopeFromDOM,
  validateEditorDependencies,
} from './validators/editor_scope_validator';

export {
  validateGridScopeFromDOM,
  validateGridDependencies,
} from './validators/grid_scope_validator';

export {
  FILENAME_PATTERN,
  isValidNoteFilename,
  isPathTraversalSafe,
  validateFilename,
  validateStorageDependencies,
  validateNoteContent,
  validateDefaultDirectory,
} from './validators/storage_scope_validator';

export {
  validateSettingsScopeFromDOM,
  validateConfigStructure,
} from './validators/settings_scope_validator';

export {
  validatePlatformTargets,
  validateRuntimePlatform,
  type TauriConfig,
} from './validators/platform_scope_validator';

export {
  validateFrameworkDependencies,
  validateIPCBoundaryPatterns,
} from './validators/framework_scope_validator';

export {
  validateNoAIDependencies,
  validateNoAISourcePatterns,
} from './validators/ai_scope_validator';

// Guards
export {
  guardNoIndexedDB,
  guardNoExternalAPIFetch,
  guardNoExternalWebSocket,
  installAllProhibitedFeatureGuards,
} from './guards/prohibited_feature_guard';

export {
  ALLOWED_IPC_COMMANDS,
  PROHIBITED_IPC_COMMAND_PATTERNS,
  validateIPCCommand,
  validateIPCCommandSet,
  type AllowedIPCCommand,
  type SafeInvoke,
  type IPCCommandValidationResult,
} from './guards/ipc_boundary_guard';

// Compliance report
export {
  generateComplianceReport,
  formatComplianceReport,
  type ComplianceReport,
  type ComplianceSummary,
} from './compliance_report';

// Runner
export {
  runStaticScopeValidation,
  buildPackageSet,
  printAndExit,
  type ValidationInput,
} from './run_scope_validation';
