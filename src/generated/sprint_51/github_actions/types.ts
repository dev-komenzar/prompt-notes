// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 51-1
// @task-title: GitHub Actions で自動生成
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/plan/implementation_plan.md (sprint 51)
// Tauri target platforms: linux, macos (Windows is out of scope)

export interface WorkflowTrigger {
  push?: { tags?: string[]; branches?: string[] };
  workflow_dispatch?: Record<string, never>;
  pull_request?: { branches?: string[] };
}

export interface JobStep {
  name?: string;
  uses?: string;
  with?: Record<string, string | number | boolean>;
  run?: string;
  env?: Record<string, string>;
  if?: string;
}

export interface Job {
  name?: string;
  'runs-on': string;
  needs?: string | string[];
  steps: JobStep[];
  env?: Record<string, string>;
}

export interface Workflow {
  name: string;
  on: WorkflowTrigger;
  env?: Record<string, string>;
  jobs: Record<string, Job>;
}
