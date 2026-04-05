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
// Design refs: design:system-design, detail:component_architecture, governance:adr_tech_stack
// Convention: Full CI pipeline orchestration for Linux + macOS

import type { PipelineResult, Platform } from "./types";
import { detectPlatform, assertNotWindows } from "./platform";
import { runEnvironmentCheck, formatEnvironmentReport } from "./env-check";
import {
  runAllModuleTests,
  createDefaultTestConfig,
  formatTestResults,
} from "./test-orchestrator";
import {
  executeBuild,
  createDefaultBuildConfig,
  formatBuildResult,
} from "./build-executor";
import { runAllReleaseBlockerChecks } from "./release-blocker-check";

export interface PipelineConfig {
  readonly projectRoot: string;
  readonly version: string;
  readonly skipTests: boolean;
  readonly skipBuild: boolean;
  readonly skipReleaseChecks: boolean;
  readonly verbose: boolean;
}

function log(verbose: boolean, ...args: unknown[]): void {
  if (verbose) {
    process.stdout.write(`[CI] ${args.map(String).join(" ")}\n`);
  }
}

export async function runCIPipeline(config: PipelineConfig): Promise<PipelineResult> {
  const timestamp = new Date().toISOString();
  assertNotWindows();

  const platform: Platform = detectPlatform();
  log(config.verbose, `Platform: ${platform}`);
  log(config.verbose, `Version: ${config.version}`);

  // Phase 1: Environment check
  log(config.verbose, "Phase 1: Environment check");
  const envReport = runEnvironmentCheck(config.projectRoot);
  if (config.verbose) {
    process.stdout.write(formatEnvironmentReport(envReport) + "\n\n");
  }

  if (!envReport.allRequiredAvailable) {
    return {
      builds: [],
      tests: [],
      releaseBlockersPassed: false,
      releaseBlockerFailures: ["Environment prerequisites not met"],
      overallSuccess: false,
      timestamp,
    };
  }

  // Phase 2: Release blocker checks (static analysis)
  let releaseBlockersPassed = true;
  let releaseBlockerFailures: string[] = [];

  if (!config.skipReleaseChecks) {
    log(config.verbose, "Phase 2: Release blocker checks");
    const rbResult = await runAllReleaseBlockerChecks(config.projectRoot);
    releaseBlockersPassed = rbResult.passed;
    releaseBlockerFailures = rbResult.results
      .filter((r) => !r.passed)
      .map((r) => `${r.id}: ${r.message}`);

    if (config.verbose) {
      for (const r of rbResult.results) {
        const icon = r.passed ? "✓" : "✗";
        process.stdout.write(`  ${icon} ${r.id}: ${r.message}\n`);
      }
      process.stdout.write("\n");
    }
  }

  // Phase 3: Tests
  let testResults: PipelineResult["tests"] = [];
  let testsPassed = true;

  if (!config.skipTests) {
    log(config.verbose, "Phase 3: Running tests");
    const testConfig = createDefaultTestConfig(config.projectRoot);
    const testOrcResult = runAllModuleTests({
      ...testConfig,
      verbose: config.verbose,
    });
    testResults = testOrcResult.results;
    testsPassed = testOrcResult.allPassed;

    if (config.verbose) {
      process.stdout.write(formatTestResults(testOrcResult) + "\n\n");
    }
  }

  // Phase 4: Build
  let buildResults: PipelineResult["builds"] = [];
  let buildsPassed = true;

  if (!config.skipBuild) {
    log(config.verbose, "Phase 4: Building application");
    const buildConfig = createDefaultBuildConfig(config.projectRoot, config.version);
    const buildResult = executeBuild({
      ...buildConfig,
      verbose: config.verbose,
    });
    buildResults = [buildResult];
    buildsPassed = buildResult.success;

    if (config.verbose) {
      process.stdout.write(formatBuildResult(buildResult) + "\n\n");
    }
  }

  const overallSuccess =
    releaseBlockersPassed && testsPassed && buildsPassed;

  log(config.verbose, `Pipeline result: ${overallSuccess ? "SUCCESS" : "FAILED"}`);

  return {
    builds: buildResults,
    tests: testResults,
    releaseBlockersPassed,
    releaseBlockerFailures,
    overallSuccess,
    timestamp,
  };
}

export function formatPipelineResult(result: PipelineResult): string {
  const lines: string[] = [
    "═".repeat(60),
    "  PromptNotes CI Pipeline Report",
    `  Timestamp: ${result.timestamp}`,
    "═".repeat(60),
    "",
  ];

  // Release blockers
  lines.push(
    `Release Blockers: ${result.releaseBlockersPassed ? "✓ PASSED" : "✗ FAILED"}`
  );
  for (const failure of result.releaseBlockerFailures) {
    lines.push(`  ✗ ${failure}`);
  }
  lines.push("");

  // Tests
  if (result.tests.length > 0) {
    const allTestsPassed = result.tests.every((t) => t.failed === 0);
    lines.push(`Tests: ${allTestsPassed ? "✓ PASSED" : "✗ FAILED"}`);
    for (const t of result.tests) {
      const icon = t.failed === 0 ? "✓" : "✗";
      lines.push(
        `  ${icon} ${t.module}: ${t.passed} passed, ${t.failed} failed (${t.durationMs}ms)`
      );
    }
    lines.push("");
  }

  // Builds
  if (result.builds.length > 0) {
    const allBuildsPassed = result.builds.every((b) => b.success);
    lines.push(`Builds: ${allBuildsPassed ? "✓ PASSED" : "✗ FAILED"}`);
    for (const b of result.builds) {
      const icon = b.success ? "✓" : "✗";
      lines.push(
        `  ${icon} ${b.platform}: ${b.artifacts.length} artifacts (${b.durationMs}ms)`
      );
      for (const a of b.artifacts) {
        lines.push(`    → ${a.name}`);
      }
    }
    lines.push("");
  }

  // Overall
  lines.push("─".repeat(60));
  lines.push(
    `  Overall: ${result.overallSuccess ? "✓ PIPELINE PASSED" : "✗ PIPELINE FAILED"}`
  );
  lines.push("─".repeat(60));

  return lines.join("\n");
}

export function createDefaultPipelineConfig(
  projectRoot: string,
  version: string
): PipelineConfig {
  return {
    projectRoot,
    version,
    skipTests: false,
    skipBuild: false,
    skipReleaseChecks: false,
    verbose: process.env.CI === "true",
  };
}
