// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 58-1
// @task-title: Linux
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// Generated from Sprint 58 — Linux バイナリビルド（.AppImage, .deb）
// CoDD trace: plan:implementation_plan > task:58-1

export type LinuxBundleFormat = 'appimage' | 'deb';

export type Architecture = 'x86_64' | 'aarch64';

export interface BuildTarget {
  readonly platform: 'linux';
  readonly format: LinuxBundleFormat;
  readonly arch: Architecture;
}

export interface AppMetadata {
  readonly name: string;
  readonly productName: string;
  readonly version: string;
  readonly description: string;
  readonly identifier: string;
  readonly license: string;
  readonly homepage: string;
  readonly repository: string;
  readonly categories: readonly string[];
  readonly keywords: readonly string[];
  readonly mimeTypes: readonly string[];
}

export interface TauriBundleLinuxConfig {
  readonly deb: DebBundleConfig;
  readonly appimage: AppImageBundleConfig;
  readonly icon: readonly string[];
  readonly desktopEntry: DesktopEntryConfig;
}

export interface DebBundleConfig {
  readonly section: string;
  readonly priority: string;
  readonly depends: readonly string[];
  readonly recommends: readonly string[];
  readonly provides: readonly string[];
  readonly conflicts: readonly string[];
  readonly replaces: readonly string[];
  readonly desktopTemplate: string | null;
}

export interface AppImageBundleConfig {
  readonly bundleMediaFramework: boolean;
  readonly files: Record<string, string>;
}

export interface DesktopEntryConfig {
  readonly name: string;
  readonly genericName: string;
  readonly comment: string;
  readonly exec: string;
  readonly icon: string;
  readonly type: 'Application';
  readonly categories: readonly string[];
  readonly mimeType: readonly string[];
  readonly startupNotify: boolean;
  readonly startupWmClass: string;
  readonly terminal: boolean;
  readonly actions: readonly DesktopAction[];
}

export interface DesktopAction {
  readonly name: string;
  readonly exec: string;
  readonly icon?: string;
}

export interface BuildArtifact {
  readonly path: string;
  readonly format: LinuxBundleFormat;
  readonly arch: Architecture;
  readonly size: number;
  readonly sha256: string;
  readonly createdAt: string;
}

export interface BuildResult {
  readonly success: boolean;
  readonly artifacts: readonly BuildArtifact[];
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly duration: number;
  readonly target: BuildTarget;
}

export interface BuildPipelineConfig {
  readonly targets: readonly BuildTarget[];
  readonly metadata: AppMetadata;
  readonly linuxConfig: TauriBundleLinuxConfig;
  readonly outputDir: string;
  readonly verbose: boolean;
  readonly skipValidation: boolean;
}

export interface XdgPaths {
  readonly dataHome: string;
  readonly configHome: string;
  readonly cacheHome: string;
  readonly stateHome: string;
}

export interface LinuxSystemInfo {
  readonly distro: string;
  readonly distroVersion: string;
  readonly kernel: string;
  readonly arch: Architecture;
  readonly hasWebKitGTK: boolean;
  readonly webKitGTKVersion: string | null;
  readonly hasGTK: boolean;
  readonly gtkVersion: string | null;
}
