// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 59-1
// @task-title: Linux
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// Generated from Sprint 59 — Task 59-1 (Linux Flatpak パッケージ作成)
// CoDD trace: plan:implementation_plan > design:system-design > detail:component_architecture
// Module: ui_foundation | Platform: linux

export const FLATPAK_APP_ID = 'io.github.promptnotes.PromptNotes' as const;
export const APP_NAME = 'PromptNotes' as const;
export const APP_BINARY_NAME = 'promptnotes' as const;
export const APP_VERSION = '1.0.0' as const;
export const APP_LICENSE = 'MIT' as const;
export const APP_SUMMARY = 'A local-first note app for AI prompts' as const;
export const APP_DEVELOPER_NAME = 'PromptNotes Contributors' as const;
export const APP_HOMEPAGE = 'https://github.com/promptnotes/promptnotes' as const;
export const APP_BUGTRACKER = 'https://github.com/promptnotes/promptnotes/issues' as const;

export type SupportedPlatform = 'linux' | 'macos';

export interface FlatpakPermission {
  readonly type: 'filesystem' | 'socket' | 'device' | 'share' | 'talk-name' | 'system-talk-name';
  readonly value: string;
}

export interface FlatpakModule {
  readonly name: string;
  readonly buildsystem: 'meson' | 'cmake' | 'simple' | 'cargo' | 'autotools';
  readonly buildCommands?: readonly string[];
  readonly installCommands?: readonly string[];
  readonly sources: readonly FlatpakSource[];
  readonly buildOptions?: Readonly<Record<string, string | boolean | number>>;
}

export type FlatpakSource =
  | FlatpakGitSource
  | FlatpakArchiveSource
  | FlatpakFileSource
  | FlatpakInlineSource;

export interface FlatpakGitSource {
  readonly type: 'git';
  readonly url: string;
  readonly tag?: string;
  readonly commit?: string;
  readonly branch?: string;
}

export interface FlatpakArchiveSource {
  readonly type: 'archive';
  readonly url: string;
  readonly sha256: string;
  readonly stripComponents?: number;
}

export interface FlatpakFileSource {
  readonly type: 'file';
  readonly path: string;
  readonly destFilename?: string;
}

export interface FlatpakInlineSource {
  readonly type: 'inline';
  readonly contents: string;
  readonly destFilename: string;
}

export interface FlatpakManifest {
  readonly 'app-id': string;
  readonly runtime: string;
  readonly 'runtime-version': string;
  readonly sdk: string;
  readonly 'sdk-extensions'?: readonly string[];
  readonly command: string;
  readonly 'finish-args': readonly string[];
  readonly modules: readonly FlatpakModule[];
  readonly 'build-options'?: Readonly<Record<string, string | boolean | number>>;
  readonly 'cleanup'?: readonly string[];
}

export interface DesktopEntry {
  readonly Type: 'Application';
  readonly Name: string;
  readonly GenericName?: string;
  readonly Comment: string;
  readonly Exec: string;
  readonly Icon: string;
  readonly Terminal: boolean;
  readonly Categories: string;
  readonly Keywords?: string;
  readonly MimeType?: string;
  readonly StartupWMClass?: string;
  readonly StartupNotify?: boolean;
  readonly 'X-Flatpak'?: string;
}

export interface AppStreamRelease {
  readonly version: string;
  readonly date: string;
  readonly description: string;
}

export interface AppStreamScreenshot {
  readonly type: 'default' | 'extra';
  readonly caption: string;
  readonly imageUrl: string;
  readonly width: number;
  readonly height: number;
}

export interface AppStreamMetadata {
  readonly id: string;
  readonly name: string;
  readonly summary: string;
  readonly description: readonly string[];
  readonly developerName: string;
  readonly projectLicense: string;
  readonly metadataLicense: string;
  readonly url: {
    readonly homepage: string;
    readonly bugtracker: string;
  };
  readonly launchable: string;
  readonly categories: readonly string[];
  readonly keywords: readonly string[];
  readonly contentRating: ContentRatingType;
  readonly releases: readonly AppStreamRelease[];
  readonly screenshots: readonly AppStreamScreenshot[];
  readonly provides: readonly string[];
}

export type ContentRatingType = 'oars-1.1';

export interface FlatpakBuildConfig {
  readonly appId: string;
  readonly manifestPath: string;
  readonly desktopEntryPath: string;
  readonly appstreamPath: string;
  readonly iconPaths: {
    readonly svg?: string;
    readonly png128?: string;
    readonly png256?: string;
    readonly png512?: string;
  };
  readonly tauriBundlePath: string;
  readonly outputDir: string;
}

export interface LinuxPaths {
  readonly dataDir: string;
  readonly notesDir: string;
  readonly configFile: string;
  readonly flatpakDataDir: string;
  readonly flatpakNotesDir: string;
  readonly flatpakConfigFile: string;
}

export interface PlatformInfo {
  readonly platform: SupportedPlatform;
  readonly isFlatpak: boolean;
  readonly isNixOS: boolean;
  readonly dataDir: string;
  readonly notesDir: string;
  readonly configFile: string;
}

export interface FlatpakValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}
