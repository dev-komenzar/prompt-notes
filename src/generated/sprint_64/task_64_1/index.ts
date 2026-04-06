// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 64-1
// @task-title: —
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=64, task=64-1, module=release_notes
// Public API for Sprint 64 Task 64-1: Release Notes Generation

export type {
  ReleaseVersion,
  PlatformTarget,
  FeatureEntry,
  ReleaseBlockingConstraint,
  ScopeExclusion,
  TechStackEntry,
  KnownLimitation,
  ReleaseNote,
  ReleaseValidationResult,
  ValidationFailure,
} from './types';

export {
  PLATFORM_LINUX,
  PLATFORM_MACOS,
  SUPPORTED_PLATFORMS,
  getPlatformTarget,
  formatPlatformMatrix,
} from './platform_matrix';

export { TECH_STACK, formatTechStackTable } from './tech_stack';

export {
  FEATURES,
  getFeaturesByModule,
  getReleaseBlockingFeatures,
  formatFeatureList,
} from './feature_manifest';

export {
  RELEASE_BLOCKING_CONSTRAINTS,
  SCOPE_EXCLUSIONS,
  FAILURE_CRITERIA,
} from './constraints';

export { KNOWN_LIMITATIONS } from './known_limitations';

export { RELEASE_V1_0_0, getVersionString } from './release_note_data';

export {
  IPC_COMMANDS,
  formatIpcCommandTable,
} from './ipc_command_reference';

export type { IpcCommandSpec } from './ipc_command_reference';
export type { FeatureCheckResult } from './release_validator';

export {
  validateRelease,
  buildFullFeatureChecklist,
  formatValidationReport,
} from './release_validator';

export { generateReleaseNoteMarkdown } from './release_note_generator';
