// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 54-1
// @task-title: GitHub Actions で自動生成
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/design/system_design.md §2.7
// @generated-by: codd implement --sprint 54

export interface WorkflowTrigger {
  push?: { tags?: string[]; branches?: string[] };
  pull_request?: { branches?: string[] };
  workflow_dispatch?: Record<string, never>;
}

export interface MatrixEntry {
  os: string;
  platform: 'linux' | 'macos';
  rustTargets?: string;
  artifactGlobs: string[];
}

export interface WorkflowJob {
  name: string;
  runsOn: string;
  strategy?: {
    failFast: boolean;
    matrix: { include: MatrixEntry[] };
  };
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  name: string;
  uses?: string;
  run?: string;
  if?: string;
  with?: Record<string, string | number | boolean>;
  env?: Record<string, string>;
}

export interface GitHubWorkflow {
  name: string;
  on: WorkflowTrigger;
  env?: Record<string, string>;
  jobs: Record<string, WorkflowJob>;
}

/**
 * Required GitHub Actions secrets for macOS notarization.
 * Configure these in Settings > Secrets and variables > Actions.
 */
export interface MacOSSecrets {
  /** Base64-encoded .p12 certificate from Apple Developer */
  APPLE_CERTIFICATE: string;
  /** Password for the .p12 certificate */
  APPLE_CERTIFICATE_PASSWORD: string;
  /** Certificate identity string, e.g. "Developer ID Application: Your Name (TEAMID)" */
  APPLE_SIGNING_IDENTITY: string;
  /** Apple ID email used for notarization */
  APPLE_ID: string;
  /** App-specific password for the Apple ID */
  APPLE_PASSWORD: string;
  /** Apple Developer Team ID */
  APPLE_TEAM_ID: string;
}
