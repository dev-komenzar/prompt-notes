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

import {
  type SupportedPlatform,
  SUPPORTED_PLATFORMS,
  RUNNER_MAP,
  TAURI_LINUX_DEPENDENCIES,
} from './ci-config';

/**
 * Build target descriptor for a single platform in the CI matrix.
 */
export interface BuildTarget {
  readonly platform: SupportedPlatform;
  readonly runner: string;
  readonly systemDependencies: readonly string[];
  readonly envVars: Record<string, string>;
}

function createBuildTarget(platform: SupportedPlatform): BuildTarget {
  const systemDependencies: readonly string[] =
    platform === 'linux' ? TAURI_LINUX_DEPENDENCIES : [];

  const envVars: Record<string, string> =
    platform === 'linux'
      ? { DISPLAY: ':99' }
      : {};

  return {
    platform,
    runner: RUNNER_MAP[platform],
    systemDependencies,
    envVars,
  };
}

export const BUILD_TARGETS: readonly BuildTarget[] = SUPPORTED_PLATFORMS.map(createBuildTarget);

/**
 * Returns the build target for the given platform.
 */
export function getBuildTarget(platform: SupportedPlatform): BuildTarget {
  const target = BUILD_TARGETS.find((t) => t.platform === platform);
  if (!target) {
    throw new Error(`Unsupported platform: ${platform}`);
  }
  return target;
}

/**
 * Validates that all required platforms have build targets defined.
 */
export function validateBuildMatrix(): { valid: boolean; missing: string[] } {
  const defined = new Set(BUILD_TARGETS.map((t) => t.platform));
  const missing = SUPPORTED_PLATFORMS.filter((p) => !defined.has(p));
  return { valid: missing.length === 0, missing: [...missing] };
}
