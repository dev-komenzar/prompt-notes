// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 10-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Trace: sprint:10 task:10-1 module:ci-pipeline
// Design refs: design:system-design, detail:component_architecture, governance:adr_tech_stack

export type Platform = "linux" | "macos";

export type ModuleName = "editor" | "grid" | "storage" | "settings" | "shell";

export type DistributionFormat =
  | "appimage"
  | "deb"
  | "flatpak"
  | "nix"
  | "dmg"
  | "homebrew-cask";

export interface BuildTarget {
  readonly platform: Platform;
  readonly arch: string;
  readonly distributionFormats: readonly DistributionFormat[];
  readonly webviewEngine: string;
  readonly defaultNotesDir: string;
  readonly defaultConfigPath: string;
}

export interface ArtifactDescriptor {
  readonly name: string;
  readonly platform: Platform;
  readonly format: DistributionFormat;
  readonly path: string;
  readonly checksum: string | null;
}

export interface ModuleTestResult {
  readonly module: ModuleName;
  readonly passed: number;
  readonly failed: number;
  readonly skipped: number;
  readonly durationMs: number;
  readonly errors: readonly string[];
}

export interface BuildResult {
  readonly platform: Platform;
  readonly success: boolean;
  readonly artifacts: readonly ArtifactDescriptor[];
  readonly durationMs: number;
  readonly errors: readonly string[];
}

export interface PipelineResult {
  readonly builds: readonly BuildResult[];
  readonly tests: readonly ModuleTestResult[];
  readonly releaseBlockersPassed: boolean;
  readonly releaseBlockerFailures: readonly string[];
  readonly overallSuccess: boolean;
  readonly timestamp: string;
}

export interface CIEnvironment {
  readonly platform: Platform;
  readonly arch: string;
  readonly rustVersion: string;
  readonly nodeVersion: string;
  readonly tauriCliVersion: string;
  readonly hasWebkitGtk: boolean;
  readonly hasRequiredDeps: boolean;
}

export interface ReleaseBlocker {
  readonly id: string;
  readonly description: string;
  readonly module: ModuleName | "framework";
  readonly check: () => Promise<ReleaseBlockerResult>;
}

export interface ReleaseBlockerResult {
  readonly id: string;
  readonly passed: boolean;
  readonly message: string;
}

export const ALL_MODULES: readonly ModuleName[] = [
  "editor",
  "grid",
  "storage",
  "settings",
  "shell",
] as const;

export const REQUIRED_MODULES: readonly ModuleName[] = [
  "editor",
  "grid",
  "storage",
  "settings",
] as const;

export const SUPPORTED_PLATFORMS: readonly Platform[] = [
  "linux",
  "macos",
] as const;
