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
// Dependency: req:promptnotes-requirements, test:acceptance_criteria

export interface ReleaseVersion {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly label: string;
}

export interface PlatformTarget {
  readonly platform: 'linux' | 'macos';
  readonly webviewEngine: string;
  readonly distributionFormats: readonly string[];
  readonly defaultNotesDir: string;
  readonly defaultConfigPath: string;
  readonly newNoteKeybind: string;
}

export interface FeatureEntry {
  readonly id: string;
  readonly module: 'editor' | 'grid' | 'storage' | 'settings' | 'shell';
  readonly title: string;
  readonly description: string;
  readonly releaseBlocking: boolean;
  readonly constraintIds: readonly string[];
  readonly acceptanceCriteriaIds: readonly string[];
}

export interface ReleaseBlockingConstraint {
  readonly id: string;
  readonly targets: readonly string[];
  readonly description: string;
  readonly failureIds: readonly string[];
}

export interface ScopeExclusion {
  readonly item: string;
  readonly reason: string;
}

export interface TechStackEntry {
  readonly component: string;
  readonly technology: string;
  readonly version: string;
  readonly adrId: string;
  readonly locked: boolean;
}

export interface KnownLimitation {
  readonly id: string;
  readonly description: string;
  readonly threshold: string;
  readonly mitigation: string;
}

export interface ReleaseNote {
  readonly version: ReleaseVersion;
  readonly codename: string;
  readonly releaseDate: string;
  readonly summary: string;
  readonly platforms: readonly PlatformTarget[];
  readonly techStack: readonly TechStackEntry[];
  readonly features: readonly FeatureEntry[];
  readonly constraints: readonly ReleaseBlockingConstraint[];
  readonly exclusions: readonly ScopeExclusion[];
  readonly knownLimitations: readonly KnownLimitation[];
  readonly breakingChanges: readonly string[];
  readonly upgradeNotes: readonly string[];
}

export interface ReleaseValidationResult {
  readonly passed: boolean;
  readonly checkedAt: string;
  readonly totalChecks: number;
  readonly passedChecks: number;
  readonly failedChecks: number;
  readonly failures: readonly ValidationFailure[];
}

export interface ValidationFailure {
  readonly constraintId: string;
  readonly failureId: string;
  readonly description: string;
  readonly severity: 'release-blocking' | 'functional' | 'scope-violation';
}
