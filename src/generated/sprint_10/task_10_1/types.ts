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

export type CriteriaStatus = 'pass' | 'fail' | 'pending';

export type ModuleTarget =
  | 'module:editor'
  | 'module:grid'
  | 'module:storage'
  | 'module:settings'
  | 'module:shell'
  | 'framework:tauri'
  | 'platform:linux'
  | 'platform:macos';

export interface CriterionResult {
  readonly id: string;
  readonly status: CriteriaStatus;
  readonly message: string;
  readonly timestamp: string;
}

export interface AcceptanceCriterion {
  readonly id: string;
  readonly module: ModuleTarget;
  readonly description: string;
  readonly releaseBlocking: boolean;
  readonly verificationMethod: 'browser' | 'api' | 'file' | 'ci' | 'manual';
}

export interface FailureCriterion {
  readonly id: string;
  readonly module: ModuleTarget;
  readonly description: string;
}

export interface CompletionReport {
  readonly generatedAt: string;
  readonly platform: 'linux' | 'macos';
  readonly acceptanceCriteria: readonly CriterionResult[];
  readonly failureCriteria: readonly CriterionResult[];
  readonly releaseBlockers: readonly CriterionResult[];
  readonly overallStatus: CriteriaStatus;
}
