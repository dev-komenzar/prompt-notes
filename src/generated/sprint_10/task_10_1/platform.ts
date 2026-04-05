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
// Design refs: design:system-design §2.6, governance:adr_tech_stack ADR-001
// Convention: platform:linux, platform:macos — Windows is out of scope

import { execSync } from "child_process";
import type { Platform, BuildTarget, CIEnvironment } from "./types";

const LINUX_BUILD_TARGET: BuildTarget = {
  platform: "linux",
  arch: "x86_64",
  distributionFormats: ["appimage", "deb", "flatpak", "nix"],
  webviewEngine: "WebKitGTK",
  defaultNotesDir: "~/.local/share/promptnotes/notes/",
  defaultConfigPath: "~/.local/share/promptnotes/config.json",
} as const;

const MACOS_BUILD_TARGET: BuildTarget = {
  platform: "macos",
  arch: "aarch64",
  distributionFormats: ["dmg", "homebrew-cask"],
  webviewEngine: "WKWebView",
  defaultNotesDir: "~/Library/Application Support/promptnotes/notes/",
  defaultConfigPath: "~/Library/Application Support/promptnotes/config.json",
} as const;

export function detectPlatform(): Platform {
  const raw = process.platform;
  if (raw === "linux") return "linux";
  if (raw === "darwin") return "macos";
  throw new Error(
    `Unsupported platform: ${raw}. PromptNotes targets Linux and macOS only. Windows is out of scope.`
  );
}

export function getBuildTarget(platform: Platform): BuildTarget {
  switch (platform) {
    case "linux":
      return LINUX_BUILD_TARGET;
    case "macos":
      return MACOS_BUILD_TARGET;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

export function getAllBuildTargets(): readonly BuildTarget[] {
  return [LINUX_BUILD_TARGET, MACOS_BUILD_TARGET];
}

function execSafe(cmd: string): string {
  try {
    return execSync(cmd, { encoding: "utf-8", timeout: 10_000 }).trim();
  } catch {
    return "";
  }
}

export function detectCIEnvironment(): CIEnvironment {
  const platform = detectPlatform();
  const arch = process.arch === "arm64" ? "aarch64" : "x86_64";
  const rustVersion = execSafe("rustc --version").replace("rustc ", "");
  const nodeVersion = process.version;
  const tauriCliVersion = execSafe("cargo tauri --version").replace(
    "tauri-cli ",
    ""
  );

  let hasWebkitGtk = true;
  if (platform === "linux") {
    const pkgCheck = execSafe("pkg-config --exists webkit2gtk-4.1 && echo ok");
    hasWebkitGtk = pkgCheck === "ok";
  }

  const hasRequiredDeps =
    rustVersion.length > 0 &&
    tauriCliVersion.length > 0 &&
    (platform !== "linux" || hasWebkitGtk);

  return {
    platform,
    arch,
    rustVersion,
    nodeVersion,
    tauriCliVersion,
    hasWebkitGtk,
    hasRequiredDeps,
  };
}

export function validatePlatform(platform: string): platform is Platform {
  return platform === "linux" || platform === "macos";
}

export function assertNotWindows(): void {
  if (process.platform === "win32") {
    throw new Error(
      "Windows is not a supported target platform. " +
        "PromptNotes targets Linux and macOS only (governance:adr_tech_stack)."
    );
  }
}
