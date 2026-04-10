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

/**
 * TypeScript type definitions for the GitHub Actions workflow YAML structure.
 * These types mirror the workflow schema and are used for type-safe generation
 * and validation of .github/workflows/build.yml.
 */

export interface WorkflowTrigger {
  readonly branches: readonly string[];
}

export interface WorkflowOn {
  readonly push?: WorkflowTrigger;
  readonly pull_request?: WorkflowTrigger;
}

export interface MatrixStrategy {
  readonly os: readonly string[];
}

export interface JobStrategy {
  readonly matrix: MatrixStrategy;
  readonly 'fail-fast': boolean;
}

export interface WorkflowStep {
  readonly name: string;
  readonly uses?: string;
  readonly run?: string;
  readonly with?: Record<string, string>;
  readonly if?: string;
  readonly env?: Record<string, string>;
}

export interface WorkflowJob {
  readonly name: string;
  readonly 'runs-on': string;
  readonly strategy?: JobStrategy;
  readonly steps: readonly WorkflowStep[];
}

export interface WorkflowDefinition {
  readonly name: string;
  readonly on: WorkflowOn;
  readonly jobs: Record<string, WorkflowJob>;
}
