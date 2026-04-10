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
// @description: Development environment tool requirements for direnv + nix flake validation

export interface ToolRequirement {
  readonly name: string;
  readonly command: string;
  readonly versionFlag: string;
  readonly versionPattern: RegExp;
  readonly minVersion?: string;
  readonly description: string;
}

export const REQUIRED_TOOLS: readonly ToolRequirement[] = [
  {
    name: 'rustc',
    command: 'rustc',
    versionFlag: '--version',
    versionPattern: /rustc\s+(\d+\.\d+\.\d+)/,
    description: 'Rust compiler — required for Tauri backend (src-tauri/)',
  },
  {
    name: 'cargo',
    command: 'cargo',
    versionFlag: '--version',
    versionPattern: /cargo\s+(\d+\.\d+\.\d+)/,
    description: 'Rust package manager — required for building Tauri backend',
  },
  {
    name: 'node',
    command: 'node',
    versionFlag: '--version',
    versionPattern: /v(\d+\.\d+\.\d+)/,
    minVersion: '18.0.0',
    description: 'Node.js runtime — required for Svelte frontend build',
  },
  {
    name: 'npm',
    command: 'npm',
    versionFlag: '--version',
    versionPattern: /(\d+\.\d+\.\d+)/,
    description: 'Node.js package manager',
  },
  {
    name: 'tauri',
    command: 'cargo-tauri',
    versionFlag: '--version',
    versionPattern: /tauri-cli\s+(\d+\.\d+\.\d+)/,
    description: 'Tauri CLI — required for `tauri dev` and `tauri build`',
  },
] as const;

export const TARGET_PLATFORMS = ['linux', 'darwin'] as const;
export type TargetPlatform = (typeof TARGET_PLATFORMS)[number];

export interface EnvironmentCheckResult {
  readonly tool: string;
  readonly available: boolean;
  readonly version: string | null;
  readonly meetsMinVersion: boolean;
  readonly error: string | null;
}

export interface EnvironmentReport {
  readonly platform: string;
  readonly timestamp: string;
  readonly results: readonly EnvironmentCheckResult[];
  readonly allPassed: boolean;
}
