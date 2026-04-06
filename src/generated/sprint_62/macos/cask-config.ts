// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 62-1
// @task-title: macOS
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// Generated from sprint 62 – macOS Homebrew Cask 定義作成
// CoDD trace: plan:implementation_plan > 62-1

export interface CaskArtifact {
  readonly url: string;
  readonly sha256: string;
}

export interface CaskBinary {
  readonly name: string;
  readonly target: string;
}

export interface CaskAppTarget {
  readonly name: string;
}

export interface CaskZap {
  readonly trash: readonly string[];
}

export interface CaskCaveats {
  readonly lines: readonly string[];
}

export interface CaskConfig {
  readonly token: string;
  readonly version: string;
  readonly homepage: string;
  readonly description: string;
  readonly artifactBaseUrl: string;
  readonly dmgFilenamePattern: string;
  readonly appTarget: CaskAppTarget;
  readonly zap: CaskZap;
  readonly caveats?: CaskCaveats;
  readonly dependsOn?: CaskDependsOn;
  readonly livecheck?: CaskLivecheck;
}

export interface CaskDependsOn {
  readonly macos?: string;
  readonly arch?: readonly CaskArch[];
}

export type CaskArch = "arm64" | "intel";

export interface CaskLivecheck {
  readonly url: string;
  readonly strategy: "github_latest" | "sparkle" | "header_match";
  readonly regex?: string;
}

export const PROMPTNOTES_CASK_DEFAULTS: Readonly<CaskConfig> = {
  token: "promptnotes",
  version: "0.0.0",
  homepage: "https://github.com/niceprompt/promptnotes",
  description: "Local-first prompt note-taking app built with Tauri",
  artifactBaseUrl:
    "https://github.com/niceprompt/promptnotes/releases/download",
  dmgFilenamePattern: "PromptNotes_#{version}_universal.dmg",
  appTarget: {
    name: "PromptNotes.app",
  },
  zap: {
    trash: [
      "~/Library/Application Support/promptnotes",
      "~/Library/Caches/promptnotes",
      "~/Library/Preferences/com.promptnotes.app.plist",
      "~/Library/Logs/promptnotes",
    ],
  },
  dependsOn: {
    macos: ">= :ventura",
  },
  livecheck: {
    url: "https://github.com/niceprompt/promptnotes/releases/latest",
    strategy: "github_latest",
    regex: /v?(\d+(?:\.\d+)+)/i.source,
  },
} as const;

export function buildArtifactUrl(config: CaskConfig, version: string): string {
  const filename = config.dmgFilenamePattern.replace("#{version}", version);
  return `${config.artifactBaseUrl}/v${version}/${filename}`;
}

export function buildDmgFilename(config: CaskConfig, version: string): string {
  return config.dmgFilenamePattern.replace("#{version}", version);
}
