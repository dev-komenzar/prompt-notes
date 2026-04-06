// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 60-1
// @task-title: Linux
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=60, task=60-1, module=ui_foundation
// Dependency: req:promptnotes-requirements, governance:adr_tech_stack
// Convention: platform:linux, platform:macos — Linux/macOS distribution required

export const PACKAGE_NAME = 'promptnotes' as const;
export const PACKAGE_DISPLAY_NAME = 'PromptNotes' as const;
export const PACKAGE_VERSION = '1.0.0' as const;
export const PACKAGE_DESCRIPTION =
  'A local-first note app for quickly jotting down prompts to pass to AI.' as const;
export const PACKAGE_LICENSE = 'MIT' as const;
export const PACKAGE_HOMEPAGE = 'https://github.com/promptnotes/promptnotes' as const;
export const PACKAGE_REPOSITORY = 'https://github.com/promptnotes/promptnotes' as const;
export const PACKAGE_AUTHOR = 'PromptNotes Contributors' as const;
export const PACKAGE_IDENTIFIER = 'dev.promptnotes.app' as const;

export interface PackageMeta {
  readonly name: string;
  readonly displayName: string;
  readonly version: string;
  readonly description: string;
  readonly license: string;
  readonly homepage: string;
  readonly repository: string;
  readonly author: string;
  readonly identifier: string;
}

export const packageMeta: Readonly<PackageMeta> = {
  name: PACKAGE_NAME,
  displayName: PACKAGE_DISPLAY_NAME,
  version: PACKAGE_VERSION,
  description: PACKAGE_DESCRIPTION,
  license: PACKAGE_LICENSE,
  homepage: PACKAGE_HOMEPAGE,
  repository: PACKAGE_REPOSITORY,
  author: PACKAGE_AUTHOR,
  identifier: PACKAGE_IDENTIFIER,
} as const;

export type SupportedPlatform = 'linux' | 'macos';

export interface PlatformDistribution {
  readonly platform: SupportedPlatform;
  readonly formats: readonly string[];
}

export const LINUX_DISTRIBUTION: Readonly<PlatformDistribution> = {
  platform: 'linux',
  formats: ['AppImage', 'deb', 'flatpak', 'nix'],
} as const;

export const MACOS_DISTRIBUTION: Readonly<PlatformDistribution> = {
  platform: 'macos',
  formats: ['dmg', 'homebrew-cask'],
} as const;

export const SUPPORTED_DISTRIBUTIONS: readonly Readonly<PlatformDistribution>[] = [
  LINUX_DISTRIBUTION,
  MACOS_DISTRIBUTION,
] as const;
