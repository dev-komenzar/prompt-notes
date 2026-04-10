// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 3-1
// @task-title: `direnv allow` 後に Rust ツールチェイン・Node.js・Tauri CLI がすべて利用可能
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/plan/implementation_plan.md
// @sprint: 3
// @task: 3-1
// @description: Public API for sprint 3 direnv/nix environment tooling

export type {
  ToolRequirement,
  EnvironmentCheckResult,
  EnvironmentReport,
  TargetPlatform,
} from './env-requirements';

export { REQUIRED_TOOLS, TARGET_PLATFORMS } from './env-requirements';
export { parseVersion, compareVersions, meetsMinimumVersion } from './version-compare';
export { checkEnvironment, validatePlatform, formatReport } from './check-env';
export { FLAKE_DEV_PACKAGES, LINUX_ONLY_PACKAGES, generateNixPackageList } from './flake-inputs';
export { ENVRC_CONTENT, FLAKE_NIX_DEVSHELL_TEMPLATE } from './envrc-template';
