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
// Design refs: design:system-design §2.7, governance:adr_tech_stack ADR-006
// Convention: platform:linux, platform:macos builds required

import type { Platform, DistributionFormat, ModuleName } from "./types";
import { SUPPORTED_PLATFORMS, REQUIRED_MODULES } from "./types";

export interface MatrixEntry {
  readonly platform: Platform;
  readonly runner: string;
  readonly tauriArgs: readonly string[];
  readonly distributions: readonly DistributionFormat[];
  readonly testModules: readonly ModuleName[];
  readonly env: Record<string, string>;
}

const LINUX_MATRIX_ENTRY: MatrixEntry = {
  platform: "linux",
  runner: "ubuntu-latest",
  tauriArgs: ["--bundles", "appimage,deb"],
  distributions: ["appimage", "deb", "flatpak", "nix"],
  testModules: [...REQUIRED_MODULES, "shell"],
  env: {
    WEBKIT_DISABLE_COMPOSITING_MODE: "1",
    DISPLAY: ":99",
  },
} as const;

const MACOS_MATRIX_ENTRY: MatrixEntry = {
  platform: "macos",
  runner: "macos-latest",
  tauriArgs: ["--bundles", "dmg"],
  distributions: ["dmg", "homebrew-cask"],
  testModules: [...REQUIRED_MODULES, "shell"],
  env: {},
} as const;

export function generateBuildMatrix(): readonly MatrixEntry[] {
  return [LINUX_MATRIX_ENTRY, MACOS_MATRIX_ENTRY];
}

export function getMatrixEntry(platform: Platform): MatrixEntry {
  switch (platform) {
    case "linux":
      return LINUX_MATRIX_ENTRY;
    case "macos":
      return MACOS_MATRIX_ENTRY;
    default:
      throw new Error(`No matrix entry for platform: ${platform}`);
  }
}

export function generateGitHubActionsMatrix(): {
  include: Array<{ os: string; platform: Platform; tauri_args: string }>;
} {
  return {
    include: SUPPORTED_PLATFORMS.map((platform) => {
      const entry = getMatrixEntry(platform);
      return {
        os: entry.runner,
        platform,
        tauri_args: entry.tauriArgs.join(" "),
      };
    }),
  };
}

export function getLinuxSystemDeps(): readonly string[] {
  return [
    "libwebkit2gtk-4.1-dev",
    "libappindicator3-dev",
    "librsvg2-dev",
    "patchelf",
    "libssl-dev",
    "libgtk-3-dev",
    "libayatana-appindicator3-dev",
    "libsoup-3.0-dev",
    "libjavascriptcoregtk-4.1-dev",
  ];
}

export function getMacOSDeps(): readonly string[] {
  return [];
}

export function getSystemDeps(platform: Platform): readonly string[] {
  switch (platform) {
    case "linux":
      return getLinuxSystemDeps();
    case "macos":
      return getMacOSDeps();
    default:
      return [];
  }
}
