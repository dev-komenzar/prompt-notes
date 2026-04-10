// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 56-3
// @task-title: Linux
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/requirements/requirements.md, docs/design/system_design.md
// Sprint 56 Task 56-3: Linux binary distribution checks

import {
  Platform,
  DistributionFormat,
  PackagingArtifact,
  checkPlatformArtifacts,
  type PackagingCheckResult,
} from "../4/platform_packaging_check";

export interface LinuxBinaryArtifact {
  format: "deb" | "appimage";
  expectedPath: string;
  minSizeBytes: number;
  description: string;
}

export const LINUX_BINARY_ARTIFACTS: LinuxBinaryArtifact[] = [
  {
    format: "deb",
    expectedPath: "target/release/bundle/deb/promptnotes_*.deb",
    minSizeBytes: 1_000_000,
    description: "Debian/Ubuntu package for direct download",
  },
  {
    format: "appimage",
    expectedPath: "target/release/bundle/appimage/promptnotes_*.AppImage",
    minSizeBytes: 1_000_000,
    description: "AppImage for portable Linux execution",
  },
];

export interface LinuxBinaryCheckResult {
  platform: "linux";
  debPresent: boolean;
  appImagePresent: boolean;
  tauriConfigValid: boolean;
  linuxDefaultDirCorrect: boolean;
  allPassed: boolean;
  failures: string[];
}

const LINUX_DEFAULT_NOTES_DIR = "~/.local/share/promptnotes/notes/";

export function verifyLinuxDefaultDir(configuredDir: string): boolean {
  return (
    configuredDir === LINUX_DEFAULT_NOTES_DIR ||
    configuredDir.endsWith("/.local/share/promptnotes/notes/")
  );
}

export function verifyTauriConfigForLinux(tauri_conf: {
  bundle?: { targets?: string | string[] };
  identifier?: string;
}): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!tauri_conf.identifier) {
    issues.push("tauri.conf.json missing bundle identifier");
  } else if (!tauri_conf.identifier.match(/^[a-z][a-z0-9.-]+$/)) {
    issues.push(`Bundle identifier '${tauri_conf.identifier}' is not a valid reverse-domain identifier`);
  }

  const targets = tauri_conf.bundle?.targets;
  if (!targets) {
    issues.push("tauri.conf.json missing bundle.targets; expected 'deb' and 'appimage'");
  } else {
    const targetList = Array.isArray(targets) ? targets : [targets];
    if (targetList !== ["all"] && !targetList.includes("deb")) {
      issues.push("tauri.conf.json bundle.targets missing 'deb'");
    }
    if (targetList !== ["all"] && !targetList.includes("appimage")) {
      issues.push("tauri.conf.json bundle.targets missing 'appimage'");
    }
  }

  return { valid: issues.length === 0, issues };
}

export function runLinuxBinaryCheck(input: {
  debArtifactPresent: boolean;
  appImageArtifactPresent: boolean;
  tauriConf: { bundle?: { targets?: string | string[] }; identifier?: string };
  configuredNotesDir: string;
}): LinuxBinaryCheckResult {
  const failures: string[] = [];

  if (!input.debArtifactPresent) {
    failures.push("Linux .deb artifact not found — run `tauri build` on Linux");
  }
  if (!input.appImageArtifactPresent) {
    failures.push("Linux .AppImage artifact not found — run `tauri build` on Linux");
  }

  const tauriCheck = verifyTauriConfigForLinux(input.tauriConf);
  if (!tauriCheck.valid) {
    failures.push(...tauriCheck.issues);
  }

  if (!verifyLinuxDefaultDir(input.configuredNotesDir)) {
    failures.push(
      `Linux default notes dir must be '${LINUX_DEFAULT_NOTES_DIR}', got '${input.configuredNotesDir}'`
    );
  }

  return {
    platform: "linux",
    debPresent: input.debArtifactPresent,
    appImagePresent: input.appImageArtifactPresent,
    tauriConfigValid: tauriCheck.valid,
    linuxDefaultDirCorrect: verifyLinuxDefaultDir(input.configuredNotesDir),
    allPassed: failures.length === 0,
    failures,
  };
}
