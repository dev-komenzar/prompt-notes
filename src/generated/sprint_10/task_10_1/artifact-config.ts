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

import { createHash } from "crypto";
import { readFileSync, existsSync } from "fs";
import { join, basename } from "path";
import type { Platform, DistributionFormat, ArtifactDescriptor } from "./types";

const APP_NAME = "promptnotes";

export interface ArtifactNamingConfig {
  readonly appName: string;
  readonly version: string;
  readonly platform: Platform;
}

function formatVersion(version: string): string {
  return version.replace(/^v/, "");
}

export function getArtifactFileName(
  config: ArtifactNamingConfig,
  format: DistributionFormat
): string {
  const ver = formatVersion(config.version);
  const { appName, platform } = config;

  switch (format) {
    case "appimage":
      return `${appName}_${ver}_amd64.AppImage`;
    case "deb":
      return `${appName}_${ver}_amd64.deb`;
    case "flatpak":
      return `com.promptnotes.PromptNotes.flatpak`;
    case "nix":
      return `${appName}-${ver}.tar.gz`;
    case "dmg":
      return `${appName}_${ver}_${platform === "macos" ? "aarch64" : "x64"}.dmg`;
    case "homebrew-cask":
      return `${appName}-${ver}.tar.gz`;
    default:
      throw new Error(`Unknown distribution format: ${format}`);
  }
}

export function getTauriBundleOutputDir(
  projectRoot: string,
  platform: Platform
): string {
  const targetDir = join(projectRoot, "src-tauri", "target", "release", "bundle");
  switch (platform) {
    case "linux":
      return targetDir;
    case "macos":
      return targetDir;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

export function getExpectedArtifactPaths(
  projectRoot: string,
  platform: Platform,
  version: string
): readonly { format: DistributionFormat; path: string }[] {
  const bundleDir = getTauriBundleOutputDir(projectRoot, platform);
  const config: ArtifactNamingConfig = {
    appName: APP_NAME,
    version,
    platform,
  };

  const formats: DistributionFormat[] =
    platform === "linux"
      ? ["appimage", "deb"]
      : ["dmg"];

  return formats.map((format) => {
    const fileName = getArtifactFileName(config, format);
    let subDir: string;
    switch (format) {
      case "appimage":
        subDir = "appimage";
        break;
      case "deb":
        subDir = "deb";
        break;
      case "dmg":
        subDir = "dmg";
        break;
      default:
        subDir = "";
    }
    return {
      format,
      path: join(bundleDir, subDir, fileName),
    };
  });
}

export function computeChecksum(filePath: string): string {
  const content = readFileSync(filePath);
  return createHash("sha256").update(content).digest("hex");
}

export function collectArtifacts(
  projectRoot: string,
  platform: Platform,
  version: string
): readonly ArtifactDescriptor[] {
  const expected = getExpectedArtifactPaths(projectRoot, platform, version);
  const results: ArtifactDescriptor[] = [];

  for (const { format, path } of expected) {
    if (existsSync(path)) {
      results.push({
        name: basename(path),
        platform,
        format,
        path,
        checksum: computeChecksum(path),
      });
    }
  }

  return results;
}

export function validateArtifacts(
  projectRoot: string,
  platform: Platform,
  version: string
): { valid: boolean; missing: string[]; found: string[] } {
  const expected = getExpectedArtifactPaths(projectRoot, platform, version);
  const missing: string[] = [];
  const found: string[] = [];

  for (const { path } of expected) {
    if (existsSync(path)) {
      found.push(path);
    } else {
      missing.push(path);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    found,
  };
}
