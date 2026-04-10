// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 10-1
// @task-title: 完了条件
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/test/acceptance_criteria.md
// @generated-by: codd generate --wave 10

export type {
  CriteriaStatus,
  ModuleTarget,
  CriterionResult,
  AcceptanceCriterion,
  FailureCriterion,
  CompletionReport,
} from './types';

export {
  ALL_ACCEPTANCE_CRITERIA,
  EDITOR_ACCEPTANCE_CRITERIA,
  STORAGE_ACCEPTANCE_CRITERIA,
  GRID_ACCEPTANCE_CRITERIA,
  SETTINGS_ACCEPTANCE_CRITERIA,
  DISTRIBUTION_ACCEPTANCE_CRITERIA,
  DEVENV_ACCEPTANCE_CRITERIA,
} from './acceptance-criteria';

export {
  ALL_FAILURE_CRITERIA,
  EDITOR_FAILURE_CRITERIA,
  STORAGE_FAILURE_CRITERIA,
  GRID_FAILURE_CRITERIA,
  SCOPE_GUARD_FAILURE_CRITERIA,
  GENERAL_FAILURE_CRITERIA,
} from './failure-criteria';

export {
  createCriterionResult,
  evaluateAcceptanceCriterion,
  evaluateFailureCriterion,
  extractReleaseBlockers,
  computeOverallStatus,
  generateCompletionReport,
} from './completion-checker';

export {
  checkQualityGate,
  formatQualityGateReport,
} from './quality-gate';

export type { QualityGateResult } from './quality-gate';

export {
  isValidNoteFilename,
  parseCreatedAtFromFilename,
  validateFilenameTimestamp,
} from './validators/filename-validator';

export {
  extractFrontmatterBlock,
  parseFrontmatterTags,
  detectForbiddenAutoFields,
  validateFrontmatter,
} from './validators/frontmatter-validator';

export type { FrontmatterValidationResult } from './validators/frontmatter-validator';

export {
  checkEditorScopeGuards,
  hasScopeViolation,
} from './validators/scope-guard-validator';

export type {
  ScopeGuardResult,
  DomScopeGuardInput,
} from './validators/scope-guard-validator';

export {
  detectPlatform,
  validatePlatform,
  expandHomePath,
} from './validators/platform-validator';

export type {
  SupportedPlatform,
  PlatformValidationResult,
} from './validators/platform-validator';

export {
  REQUIRED_IPC_COMMANDS,
  IPC_COMMAND_SPECS,
  validateIpcCommandsRegistered,
} from './validators/ipc-boundary-validator';

export type {
  IpcCommandName,
  IpcCommandSpec,
} from './validators/ipc-boundary-validator';

export {
  TEST_FILE_MAPPINGS,
  TEST_HELPER_FILES,
  CRITERIA_TO_TEST_DOMAIN,
} from './test-mapping';

export type { TestFileMapping, TestHelperFile } from './test-mapping';
