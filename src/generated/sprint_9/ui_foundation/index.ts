// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 9-1
// @task-title: Linux と macOS の両ターゲットで `cargo build` + `npm run build` が通る
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/plan/implementation_plan.md
// @sprint: 9
// @task: 9-1
// @deliverable: Linux と macOS の両ターゲットで cargo build + npm run build が通る

export {
  CI_WORKFLOW_NAME,
  SUPPORTED_PLATFORMS,
  RUNNER_MAP,
  RUST_TOOLCHAIN,
  NODE_VERSION,
  BUILD_COMMANDS,
  TAURI_LINUX_DEPENDENCIES,
  CACHE_KEYS,
  WORKFLOW_TRIGGERS,
} from './ci-config';
export type { SupportedPlatform } from './ci-config';

export {
  BUILD_TARGETS,
  getBuildTarget,
  validateBuildMatrix,
} from './build-targets';
export type { BuildTarget } from './build-targets';

export type {
  WorkflowTrigger,
  WorkflowOn,
  MatrixStrategy,
  JobStrategy,
  WorkflowStep,
  WorkflowJob,
  WorkflowDefinition,
} from './workflow-schema';

export {
  generateWorkflowDefinition,
  serializeWorkflowToYaml,
} from './build-workflow';

export {
  validateCiCoverage,
  validateBuildResults,
} from './build-validation';
export type { BuildStepResult, BuildRunResult } from './build-validation';
