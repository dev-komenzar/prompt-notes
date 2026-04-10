// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 56-4
// @task-title: macOS 両プラットフォームでパッケージ配布可能
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/test/acceptance_criteria.md, docs/design/system_design.md
// Sprint 56 Task 56-4: macOS 両プラットフォームでパッケージ配布可能

import {
  Platform,
  DistributionFormat,
  PackagingArtifact,
  PackagingCheckResult,
  checkPlatformArtifacts,
} from "../4/platform_packaging_check";

export interface MacOsBinaryArtifact {
  path: string;
  format: "dmg" | "app" | "zip";
  arch: "x86_64" | "aarch64" | "universal";
  minOsVersion: string;
  signed: boolean;
  notarized: boolean;
  stapled: boolean;
}

export interface MacOsNotarizationCheck {
  teamId: string;
  bundleId: string;
  entitlementsPath: string;
  hardenedRuntime: boolean;
  notarizationToolAvailable: boolean;
}

export interface MacOsBinaryCheckResult {
  platform: "macos";
  artifacts: MacOsBinaryArtifact[];
  notarizationCheck: MacOsNotarizationCheck;
  tauriConfigValid: boolean;
  defaultDirCorrect: boolean;
  errors: string[];
  passed: boolean;
}

export const MACOS_DEFAULT_NOTES_DIR = "~/Library/Application Support/promptnotes/notes/";
export const MACOS_CONFIG_DIR = "~/Library/Application Support/promptnotes/config.json";
export const MACOS_BUNDLE_ID = "com.promptnotes.PromptNotes";
export const MACOS_MIN_OS_VERSION = "10.15";

export const MACOS_BINARY_ARTIFACTS: PackagingArtifact[] = [
  {
    platform: "macos",
    format: "dmg",
    path: "src-tauri/target/release/bundle/dmg/PromptNotes_*.dmg",
    required: true,
    description: "macOS DMG installer for direct download distribution",
  },
  {
    platform: "macos",
    format: "app",
    path: "src-tauri/target/release/bundle/macos/PromptNotes.app",
    required: true,
    description: "macOS application bundle (contained in DMG)",
  },
];

export const EXPECTED_MACOS_ARTIFACTS: MacOsBinaryArtifact[] = [
  {
    path: "src-tauri/target/release/bundle/dmg/PromptNotes_*.dmg",
    format: "dmg",
    arch: "universal",
    minOsVersion: MACOS_MIN_OS_VERSION,
    signed: true,
    notarized: true,
    stapled: true,
  },
  {
    path: "src-tauri/target/release/bundle/macos/PromptNotes.app",
    format: "app",
    arch: "universal",
    minOsVersion: MACOS_MIN_OS_VERSION,
    signed: true,
    notarized: true,
    stapled: false,
  },
];

export const EXPECTED_NOTARIZATION_CHECK: MacOsNotarizationCheck = {
  teamId: "APPLE_TEAM_ID",
  bundleId: MACOS_BUNDLE_ID,
  entitlementsPath: "src-tauri/entitlements.plist",
  hardenedRuntime: true,
  notarizationToolAvailable: true,
};

export function verifyMacOsDefaultDir(notesDir: string): boolean {
  const normalized = notesDir.replace(/^~/, "$HOME");
  const expected = MACOS_DEFAULT_NOTES_DIR.replace(/^~/, "$HOME");
  return normalized === expected || notesDir === MACOS_DEFAULT_NOTES_DIR;
}

export function verifyTauriConfigForMacOs(tauriConfJson: Record<string, unknown>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const bundle = (tauriConfJson as any)?.bundle ?? {};
  const identifier = bundle?.identifier ?? "";
  const targets = bundle?.targets ?? [];

  if (identifier !== MACOS_BUNDLE_ID) {
    errors.push(`bundle.identifier must be '${MACOS_BUNDLE_ID}', got '${identifier}'`);
  }

  const hasHardenedRuntime = bundle?.macOS?.hardenedRuntime === true;
  if (!hasHardenedRuntime) {
    errors.push("bundle.macOS.hardenedRuntime must be true for notarization");
  }

  const minVersion = bundle?.macOS?.minimumSystemVersion ?? "";
  if (!minVersion) {
    errors.push("bundle.macOS.minimumSystemVersion must be set");
  }

  const hasEntitlements = !!(bundle?.macOS?.entitlements);
  if (!hasEntitlements) {
    errors.push("bundle.macOS.entitlements must reference entitlements.plist");
  }

  const hasFs = (tauriConfJson as any)?.plugins?.fs;
  if (hasFs && hasFs !== "deny") {
    errors.push("plugins.fs must be 'deny' to enforce IPC-only file access");
  }

  return { valid: errors.length === 0, errors };
}

export function runMacOsBinaryCheck(
  artifacts: MacOsBinaryArtifact[],
  notarizationCheck: MacOsNotarizationCheck,
  tauriConfJson: Record<string, unknown>,
  notesDir: string,
): MacOsBinaryCheckResult {
  const errors: string[] = [];

  const dmgArtifact = artifacts.find((a) => a.format === "dmg");
  if (!dmgArtifact) {
    errors.push("RELEASE_BLOCKER: macOS DMG artifact is missing");
  } else {
    if (!dmgArtifact.signed) {
      errors.push("RELEASE_BLOCKER: DMG must be code-signed with Apple Developer certificate");
    }
    if (!dmgArtifact.notarized) {
      errors.push("RELEASE_BLOCKER: DMG must be notarized via Apple Notarization Service");
    }
    if (!dmgArtifact.stapled) {
      errors.push("RELEASE_BLOCKER: DMG must have notarization ticket stapled (xcrun stapler staple)");
    }
    if (dmgArtifact.arch !== "universal") {
      errors.push(
        `RELEASE_BLOCKER: DMG arch is '${dmgArtifact.arch}', expected 'universal' (Intel + Apple Silicon)`
      );
    }
  }

  const appArtifact = artifacts.find((a) => a.format === "app");
  if (!appArtifact) {
    errors.push("RELEASE_BLOCKER: macOS .app bundle is missing");
  }

  if (!notarizationCheck.hardenedRuntime) {
    errors.push("RELEASE_BLOCKER: Hardened Runtime must be enabled for Apple notarization");
  }
  if (!notarizationCheck.entitlementsPath) {
    errors.push("RELEASE_BLOCKER: entitlements.plist path must be configured for signing");
  }
  if (!notarizationCheck.notarizationToolAvailable) {
    errors.push("RELEASE_BLOCKER: notarytool (Xcode 13+) must be available in CI environment");
  }

  const tauriConfig = verifyTauriConfigForMacOs(tauriConfJson);
  if (!tauriConfig.valid) {
    errors.push(...tauriConfig.errors.map((e) => `TAURI_CONFIG: ${e}`));
  }

  const defaultDirCorrect = verifyMacOsDefaultDir(notesDir);
  if (!defaultDirCorrect) {
    errors.push(
      `RELEASE_BLOCKER: macOS default notes dir must be '${MACOS_DEFAULT_NOTES_DIR}', got '${notesDir}'`
    );
  }

  return {
    platform: "macos",
    artifacts,
    notarizationCheck,
    tauriConfigValid: tauriConfig.valid,
    defaultDirCorrect,
    errors,
    passed: errors.length === 0,
  };
}
