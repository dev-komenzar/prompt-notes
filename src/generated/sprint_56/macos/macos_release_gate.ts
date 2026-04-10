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
// Sprint 56 Task 56-4: macOS release gate — combines binary and Homebrew Cask checks

import {
  MacOsBinaryArtifact,
  MacOsNotarizationCheck,
  MacOsBinaryCheckResult,
  runMacOsBinaryCheck,
  MACOS_DEFAULT_NOTES_DIR,
  EXPECTED_MACOS_ARTIFACTS,
  EXPECTED_NOTARIZATION_CHECK,
} from "./macos_binary_check";
import {
  HomebrewCaskFormula,
  HomebrewCaskValidationResult,
  checkHomebrewCask,
  EXPECTED_CASK_FORMULA,
} from "./homebrew_cask_check";
import {
  ReleaseChecklistResult,
  Platform,
} from "../4/release_checklist";
import {
  LinuxReleaseGateResult,
  LinuxReleaseGateInput,
} from "../ui_foundation/linux_release_gate";

export interface MacOsReleaseGateInput {
  artifacts: MacOsBinaryArtifact[];
  notarizationCheck: MacOsNotarizationCheck;
  tauriConfJson: Record<string, unknown>;
  notesDir: string;
  homebrewCaskFormula: HomebrewCaskFormula | null;
  moduleChecklistResult: ReleaseChecklistResult;
  e2eAllPassed: boolean;
}

export interface MacOsReleaseGateResult {
  platform: "macos";
  binaryCheck: MacOsBinaryCheckResult;
  homebrewCaskCheck: HomebrewCaskValidationResult;
  moduleChecklistPassed: boolean;
  e2eAllPassed: boolean;
  releaseBlockers: string[];
  warnings: string[];
  passed: boolean;
  summary: string;
}

export const EXPECTED_MACOS_RELEASE_INPUT: MacOsReleaseGateInput = {
  artifacts: EXPECTED_MACOS_ARTIFACTS,
  notarizationCheck: EXPECTED_NOTARIZATION_CHECK,
  tauriConfJson: {
    bundle: {
      identifier: "com.promptnotes.PromptNotes",
      targets: ["dmg", "app"],
      macOS: {
        hardenedRuntime: true,
        minimumSystemVersion: "10.15",
        entitlements: "entitlements.plist",
      },
    },
    plugins: {
      fs: "deny",
      shell: "deny",
      http: "deny",
    },
  },
  notesDir: MACOS_DEFAULT_NOTES_DIR,
  homebrewCaskFormula: {
    cask: "promptnotes",
    version: "1.0.0",
    sha256: "a".repeat(64),
    url: "https://github.com/dev-komenzar/promptnotes/releases/download/v1.0.0/PromptNotes_1.0.0.dmg",
    name: ["PromptNotes"],
    desc: "Local note-taking app for AI prompts",
    homepage: "https://github.com/dev-komenzar/promptnotes",
    app: "PromptNotes.app",
    zap: {
      trash: [
        "~/Library/Application Support/promptnotes",
        "~/.config/promptnotes",
      ],
    },
  },
  moduleChecklistResult: {
    passed: true,
    totalModules: 4,
    passedModules: 4,
    failedModules: [],
    releaseBlockers: [],
    summary: "All 4 modules passed",
  },
  e2eAllPassed: true,
};

export function runMacOsReleaseGate(input: MacOsReleaseGateInput): MacOsReleaseGateResult {
  const binaryCheck = runMacOsBinaryCheck(
    input.artifacts,
    input.notarizationCheck,
    input.tauriConfJson,
    input.notesDir,
  );

  const homebrewCaskCheck = checkHomebrewCask(input.homebrewCaskFormula);

  const releaseBlockers: string[] = [];
  const warnings: string[] = [];

  if (!binaryCheck.passed) {
    releaseBlockers.push(...binaryCheck.errors);
  }

  if (!homebrewCaskCheck.passed) {
    releaseBlockers.push(...homebrewCaskCheck.errors);
  }

  if (!input.moduleChecklistPassed || !input.moduleChecklistResult.passed) {
    const failed = input.moduleChecklistResult.failedModules;
    releaseBlockers.push(
      `RELEASE_BLOCKER: Module checklist failed — modules not ready: ${failed.join(", ")}`
    );
    releaseBlockers.push(...input.moduleChecklistResult.releaseBlockers);
  }

  if (!input.e2eAllPassed) {
    releaseBlockers.push(
      "RELEASE_BLOCKER: E2E test suite has failures — all tests must pass before macOS release"
    );
  }

  if (!binaryCheck.tauriConfigValid) {
    releaseBlockers.push("RELEASE_BLOCKER: tauri.conf.json is not valid for macOS release");
  }

  if (!binaryCheck.defaultDirCorrect) {
    releaseBlockers.push(
      `RELEASE_BLOCKER: macOS default notes directory must be '${MACOS_DEFAULT_NOTES_DIR}'`
    );
  }

  if (homebrewCaskCheck.passed && !input.homebrewCaskFormula?.url.startsWith("https://")) {
    warnings.push("WARNING: Homebrew Cask URL should use HTTPS");
  }

  const passed = releaseBlockers.length === 0;

  const summary = passed
    ? "macOS release gate PASSED — binary artifacts signed/notarized, Homebrew Cask valid, all modules and E2E tests passed"
    : `macOS release gate FAILED — ${releaseBlockers.length} blocker(s): ${releaseBlockers
        .slice(0, 3)
        .join("; ")}${releaseBlockers.length > 3 ? ` ... and ${releaseBlockers.length - 3} more` : ""}`;

  return {
    platform: "macos",
    binaryCheck,
    homebrewCaskCheck,
    moduleChecklistPassed: input.moduleChecklistResult.passed,
    e2eAllPassed: input.e2eAllPassed,
    releaseBlockers,
    warnings,
    passed,
    summary,
  };
}

export function macOsCiExitCode(result: MacOsReleaseGateResult): 0 | 1 {
  return result.passed ? 0 : 1;
}

export function formatMacOsReleaseReport(result: MacOsReleaseGateResult): string {
  const lines: string[] = [
    "=== PromptNotes macOS Release Gate Report ===",
    `Platform: macOS`,
    `Status: ${result.passed ? "PASSED" : "FAILED"}`,
    "",
    "--- Binary Artifacts ---",
    `  DMG: ${result.binaryCheck.artifacts.find((a) => a.format === "dmg") ? "found" : "MISSING"}`,
    `  Code signed: ${result.binaryCheck.artifacts.every((a) => a.signed) ? "yes" : "NO"}`,
    `  Notarized: ${result.binaryCheck.artifacts.some((a) => a.notarized) ? "yes" : "NO"}`,
    `  Stapled: ${result.binaryCheck.artifacts.some((a) => a.stapled && a.format === "dmg") ? "yes" : "NO"}`,
    `  Tauri config valid: ${result.binaryCheck.tauriConfigValid ? "yes" : "NO"}`,
    `  Default notes dir correct: ${result.binaryCheck.defaultDirCorrect ? "yes" : "NO"}`,
    "",
    "--- Homebrew Cask ---",
    `  Formula found: ${result.homebrewCaskCheck.formulaFound ? "yes" : "NO"}`,
    `  Validation: ${result.homebrewCaskCheck.passed ? "PASSED" : "FAILED"}`,
    ...result.homebrewCaskCheck.validations
      .filter((v) => !v.passed)
      .map((v) => `  FAIL: ${v.field}: expected '${v.expected}', got '${v.actual}'`),
    "",
    "--- Prerequisites ---",
    `  Module checklist: ${result.moduleChecklistPassed ? "PASSED" : "FAILED"}`,
    `  E2E tests: ${result.e2eAllPassed ? "PASSED" : "FAILED"}`,
    "",
  ];

  if (result.releaseBlockers.length > 0) {
    lines.push("--- Release Blockers ---");
    result.releaseBlockers.forEach((b) => lines.push(`  [BLOCKER] ${b}`));
    lines.push("");
  }

  if (result.warnings.length > 0) {
    lines.push("--- Warnings ---");
    result.warnings.forEach((w) => lines.push(`  [WARN] ${w}`));
    lines.push("");
  }

  lines.push(`Summary: ${result.summary}`);

  return lines.join("\n");
}
