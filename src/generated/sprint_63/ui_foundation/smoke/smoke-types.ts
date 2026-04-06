// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 63-1
// @task-title: Linux, macOS
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated Sprint 63 — Task 63-1 — Linux, macOS smoke test UI foundation
// trace: plan:implementation_plan — Sprint 63: 全配布形式でのスモークテスト

import type { SupportedPlatform } from '../types';

/** Result of a single smoke test check. */
export interface SmokeCheckResult {
  readonly id: string;
  readonly category: SmokeCategory;
  readonly description: string;
  readonly passed: boolean;
  readonly error?: string;
  readonly durationMs: number;
}

/** Aggregated report for a full smoke test run. */
export interface SmokeReport {
  readonly platform: SupportedPlatform;
  readonly distributionFormat: string;
  readonly timestamp: string;
  readonly checks: readonly SmokeCheckResult[];
  readonly totalPassed: number;
  readonly totalFailed: number;
  readonly totalDurationMs: number;
  readonly releaseBlocking: boolean;
}

/** Categories mapping to design modules. */
export type SmokeCategory =
  | 'editor'
  | 'grid'
  | 'storage'
  | 'settings'
  | 'platform'
  | 'ipc'
  | 'distribution';

/** Configuration for a smoke test run. */
export interface SmokeRunConfig {
  readonly platform: SupportedPlatform;
  readonly distributionFormat: string;
  /** If true, only run release-blocking checks. */
  readonly releaseBlockingOnly: boolean;
}
