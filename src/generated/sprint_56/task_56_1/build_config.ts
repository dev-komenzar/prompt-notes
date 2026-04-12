// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 56-1
// @task-title: パッケージング
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/plan/implementation_plan.md sprint:56 task:56-1
// @generated-by: codd implement --sprint 56

import * as path from "node:path";
import * as fs from "node:fs";
import type { SupportedPlatform } from "./platform";

export interface ArtifactPaths {
  deb?: string;
  appimage?: string;
  dmg?: string;
}

export interface BuildConfig {
  projectRoot: string;
  tauriSrcDir: string;
  bundleOutputDir: string;
  platform: SupportedPlatform;
}

const TAURI_BUNDLE_SUBDIR: Record<SupportedPlatform, string> = {
  linux: path.join("bundle"),
  macos: path.join("bundle"),
};

export function resolveBuildConfig(
  platform: SupportedPlatform,
  projectRoot: string = process.cwd()
): BuildConfig {
  const tauriSrcDir = path.join(projectRoot, "src-tauri");
  const releaseDir = path.join(tauriSrcDir, "target", "release");
  const bundleOutputDir = path.join(
    releaseDir,
    TAURI_BUNDLE_SUBDIR[platform]
  );
  return { projectRoot, tauriSrcDir, bundleOutputDir, platform };
}

export function resolveArtifacts(config: BuildConfig): ArtifactPaths {
  const { bundleOutputDir, platform } = config;
  const artifacts: ArtifactPaths = {};

  if (platform === "linux") {
    const debDir = path.join(bundleOutputDir, "deb");
    const appimageDir = path.join(bundleOutputDir, "appimage");

    if (fs.existsSync(debDir)) {
      const debFiles = fs
        .readdirSync(debDir)
        .filter((f) => f.endsWith(".deb"));
      if (debFiles.length > 0) {
        artifacts.deb = path.join(debDir, debFiles[0]);
      }
    }

    if (fs.existsSync(appimageDir)) {
      const appimageFiles = fs
        .readdirSync(appimageDir)
        .filter((f) => f.endsWith(".AppImage"));
      if (appimageFiles.length > 0) {
        artifacts.appimage = path.join(appimageDir, appimageFiles[0]);
      }
    }
  }

  if (platform === "macos") {
    const dmgDir = path.join(bundleOutputDir, "dmg");
    if (fs.existsSync(dmgDir)) {
      const dmgFiles = fs
        .readdirSync(dmgDir)
        .filter((f) => f.endsWith(".dmg"));
      if (dmgFiles.length > 0) {
        artifacts.dmg = path.join(dmgDir, dmgFiles[0]);
      }
    }
  }

  return artifacts;
}

export function assertArtifactsPresent(
  artifacts: ArtifactPaths,
  platform: SupportedPlatform
): void {
  if (platform === "linux") {
    if (!artifacts.deb) {
      throw new Error(".deb artifact not found after build. Check tauri.conf.json bundle.targets.");
    }
    if (!artifacts.appimage) {
      throw new Error(".AppImage artifact not found after build. Check tauri.conf.json bundle.targets.");
    }
  }
  if (platform === "macos") {
    if (!artifacts.dmg) {
      throw new Error(".dmg artifact not found after build. Check tauri.conf.json bundle.targets.");
    }
  }
}
