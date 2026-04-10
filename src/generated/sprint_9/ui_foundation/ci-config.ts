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
 * CI pipeline configuration constants for PromptNotes.
 * Defines platform targets, build commands, and workflow structure
 * for GitHub Actions CI on Linux and macOS.
 */

export const CI_WORKFLOW_NAME = 'build' as const;

export const SUPPORTED_PLATFORMS = ['linux', 'macos'] as const;
export type SupportedPlatform = (typeof SUPPORTED_PLATFORMS)[number];

export const RUNNER_MAP: Record<SupportedPlatform, string> = {
  linux: 'ubuntu-latest',
  macos: 'macos-latest',
};

export const RUST_TOOLCHAIN = 'stable' as const;
export const NODE_VERSION = '20' as const;

export const BUILD_COMMANDS = {
  cargo: 'cargo build',
  npm: 'npm run build',
} as const;

export const TAURI_LINUX_DEPENDENCIES = [
  'libwebkit2gtk-4.1-dev',
  'libappindicator3-dev',
  'librsvg2-dev',
  'patchelf',
  'libgtk-3-dev',
  'libsoup-3.0-dev',
  'libjavascriptcoregtk-4.1-dev',
] as const;

export const CACHE_KEYS = {
  cargo: 'cargo-${{ runner.os }}-${{ hashFiles(\'**/Cargo.lock\') }}',
  npm: 'npm-${{ runner.os }}-${{ hashFiles(\'**/package-lock.json\') }}',
} as const;

export const WORKFLOW_TRIGGERS = {
  push: { branches: ['main'] },
  pull_request: { branches: ['main'] },
} as const;
