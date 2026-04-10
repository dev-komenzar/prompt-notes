// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 51-2
// @task-title: 動作確認済み
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/test/acceptance_criteria.md
// @generated-by: codd implement --sprint 51

import * as path from "path";
import * as fs from "fs";
import {
  verifyLinuxArtifacts,
  verifyMacosArtifacts,
  writeChecksumFile,
  type VerificationResult,
} from "./artifact-verifier";
import {
  smokeTestDeb,
  smokeTestAppImage,
  printSmokeTestReport,
  type SmokeTestSuite,
} from "./smoke-test";

export interface VerifyOptions {
  bundleDir: string;
  platform: "linux" | "macos";
  outputDir?: string;
  runSmokeTests?: boolean;
}

export interface VerifyReport {
  platform: "linux" | "macos";
  verification: VerificationResult;
  smokeTests: SmokeTestSuite[];
  passed: boolean;
}

export async function runVerification(
  opts: VerifyOptions
): Promise<VerifyReport> {
  const { bundleDir, platform, outputDir, runSmokeTests = true } = opts;

  console.log(`\n=== PromptNotes Build Verification ===`);
  console.log(`Platform : ${platform}`);
  console.log(`Bundle dir: ${bundleDir}`);

  const verification =
    platform === "linux"
      ? verifyLinuxArtifacts(bundleDir)
      : verifyMacosArtifacts(bundleDir);

  console.log(`\n--- Artifact Verification ---`);
  for (const [name, info] of Object.entries(verification.artifacts)) {
    if (info.exists) {
      const mb = (info.size / 1024 / 1024).toFixed(1);
      console.log(`  ${name}: ${info.path} (${mb} MB)`);
      console.log(`    sha256: ${info.sha256}`);
    } else {
      console.log(`  ${name}: NOT FOUND`);
    }
  }

  if (verification.errors.length > 0) {
    console.log(`\nVerification errors:`);
    for (const e of verification.errors) {
      console.log(`  - ${e}`);
    }
  }

  if (outputDir) {
    fs.mkdirSync(outputDir, { recursive: true });
    const checksumPath = path.join(
      outputDir,
      `checksums-${platform}.sha256.txt`
    );
    writeChecksumFile(verification, checksumPath);
    console.log(`\nChecksums written to: ${checksumPath}`);
  }

  const smokeTests: SmokeTestSuite[] = [];

  if (runSmokeTests && platform === "linux") {
    console.log(`\n--- Smoke Tests ---`);

    const debInfo = verification.artifacts["deb"];
    if (debInfo?.exists) {
      const suite = smokeTestDeb(debInfo.path);
      printSmokeTestReport(suite);
      smokeTests.push(suite);
    }

    const appImageInfo = verification.artifacts["appimage"];
    if (appImageInfo?.exists) {
      const suite = smokeTestAppImage(appImageInfo.path);
      printSmokeTestReport(suite);
      smokeTests.push(suite);
    }
  }

  const smokesPassed = smokeTests.every((s) => s.passed);
  const passed = verification.passed && smokesPassed;

  console.log(`\n=== Result: ${passed ? "PASSED" : "FAILED"} ===\n`);

  return { platform, verification, smokeTests, passed };
}

async function main(): Promise<void> {
  const platform = (process.env.TARGET_PLATFORM ?? process.platform) as
    | "linux"
    | "macos";

  const bundleDir =
    process.env.BUNDLE_DIR ??
    path.join(
      process.cwd(),
      "src-tauri",
      "target",
      "release",
      "bundle"
    );

  const outputDir = process.env.OUTPUT_DIR ?? undefined;
  const runSmokeTests = process.env.SKIP_SMOKE_TESTS !== "1";

  const normalizedPlatform: "linux" | "macos" =
    platform === "darwin" || platform === "macos" ? "macos" : "linux";

  const report = await runVerification({
    bundleDir,
    platform: normalizedPlatform,
    outputDir,
    runSmokeTests,
  });

  if (!report.passed) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Verification failed with unexpected error:", err);
  process.exit(1);
});
