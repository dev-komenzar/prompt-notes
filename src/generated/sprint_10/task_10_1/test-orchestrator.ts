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
// Design refs: detail:component_architecture, test:acceptance_criteria
// Convention: module:editor, module:grid, module:storage, module:settings — all must pass

import { execSync } from "child_process";
import { join } from "path";
import type { ModuleName, ModuleTestResult, Platform } from "./types";
import { REQUIRED_MODULES } from "./types";
import { detectPlatform } from "./platform";

export interface TestSuiteConfig {
  readonly projectRoot: string;
  readonly platform: Platform;
  readonly modules: readonly ModuleName[];
  readonly verbose: boolean;
  readonly timeout: number;
}

export interface TestOrchestratorResult {
  readonly results: readonly ModuleTestResult[];
  readonly allPassed: boolean;
  readonly totalDurationMs: number;
}

function parseTestOutput(output: string): {
  passed: number;
  failed: number;
  skipped: number;
} {
  const passMatch = output.match(/(\d+)\s+pass(?:ed|ing)?/i);
  const failMatch = output.match(/(\d+)\s+fail(?:ed|ing|ure)?/i);
  const skipMatch = output.match(/(\d+)\s+skip(?:ped)?/i);
  return {
    passed: passMatch ? parseInt(passMatch[1], 10) : 0,
    failed: failMatch ? parseInt(failMatch[1], 10) : 0,
    skipped: skipMatch ? parseInt(skipMatch[1], 10) : 0,
  };
}

function runModuleTest(
  module: ModuleName,
  config: TestSuiteConfig
): ModuleTestResult {
  const startTime = Date.now();
  const errors: string[] = [];

  try {
    const testCmd = buildTestCommand(module, config);
    const output = execSync(testCmd, {
      cwd: config.projectRoot,
      encoding: "utf-8",
      timeout: config.timeout,
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        NODE_ENV: "test",
        CI: "true",
      },
    });

    const parsed = parseTestOutput(output);
    return {
      module,
      passed: parsed.passed,
      failed: parsed.failed,
      skipped: parsed.skipped,
      durationMs: Date.now() - startTime,
      errors,
    };
  } catch (err: unknown) {
    const execError = err as { stdout?: string; stderr?: string; message?: string };
    const output = execError.stdout || "";
    const stderr = execError.stderr || execError.message || "Unknown error";
    const parsed = parseTestOutput(output);

    errors.push(stderr.slice(0, 2000));

    return {
      module,
      passed: parsed.passed,
      failed: Math.max(parsed.failed, 1),
      skipped: parsed.skipped,
      durationMs: Date.now() - startTime,
      errors,
    };
  }
}

function buildTestCommand(module: ModuleName, config: TestSuiteConfig): string {
  switch (module) {
    case "shell":
    case "storage":
      return buildRustTestCommand(module, config);
    case "editor":
    case "grid":
    case "settings":
      return buildFrontendTestCommand(module, config);
    default:
      throw new Error(`Unknown module: ${module}`);
  }
}

function buildRustTestCommand(module: ModuleName, config: TestSuiteConfig): string {
  const cargoDir = join(config.projectRoot, "src-tauri");
  const verboseFlag = config.verbose ? "--verbose" : "";
  const filterArg = module === "storage" ? "storage::" : "shell::";
  return `cd "${cargoDir}" && cargo test ${filterArg} ${verboseFlag} 2>&1`;
}

function buildFrontendTestCommand(
  module: ModuleName,
  config: TestSuiteConfig
): string {
  const verboseFlag = config.verbose ? "--verbose" : "";
  const modulePattern = getModuleTestPattern(module);
  return `npx vitest run ${modulePattern} ${verboseFlag} 2>&1`;
}

function getModuleTestPattern(module: ModuleName): string {
  switch (module) {
    case "editor":
      return "--testPathPattern='editor|Editor|CopyButton'";
    case "grid":
      return "--testPathPattern='grid|Grid|NoteCard|TagFilter|DateFilter'";
    case "settings":
      return "--testPathPattern='settings|Settings'";
    default:
      return "";
  }
}

export function createDefaultTestConfig(projectRoot: string): TestSuiteConfig {
  return {
    projectRoot,
    platform: detectPlatform(),
    modules: [...REQUIRED_MODULES, "shell"],
    verbose: process.env.CI === "true",
    timeout: 120_000,
  };
}

export function runAllModuleTests(config: TestSuiteConfig): TestOrchestratorResult {
  const startTime = Date.now();
  const results: ModuleTestResult[] = [];

  for (const module of config.modules) {
    const result = runModuleTest(module, config);
    results.push(result);

    if (config.verbose) {
      const status = result.failed === 0 ? "PASS" : "FAIL";
      process.stdout.write(
        `[${status}] ${module}: ${result.passed} passed, ${result.failed} failed (${result.durationMs}ms)\n`
      );
    }
  }

  const allPassed = results.every((r) => r.failed === 0);
  return {
    results,
    allPassed,
    totalDurationMs: Date.now() - startTime,
  };
}

export function runRustTests(projectRoot: string, verbose: boolean = false): ModuleTestResult {
  const startTime = Date.now();
  const cargoDir = join(projectRoot, "src-tauri");
  const verboseFlag = verbose ? "--verbose" : "";

  try {
    const output = execSync(`cd "${cargoDir}" && cargo test ${verboseFlag} 2>&1`, {
      encoding: "utf-8",
      timeout: 300_000,
      env: { ...process.env, CI: "true" },
    });
    const parsed = parseTestOutput(output);
    return {
      module: "shell",
      passed: parsed.passed,
      failed: parsed.failed,
      skipped: parsed.skipped,
      durationMs: Date.now() - startTime,
      errors: [],
    };
  } catch (err: unknown) {
    const execError = err as { stderr?: string; message?: string };
    return {
      module: "shell",
      passed: 0,
      failed: 1,
      skipped: 0,
      durationMs: Date.now() - startTime,
      errors: [(execError.stderr || execError.message || "Rust tests failed").slice(0, 2000)],
    };
  }
}

export function runFrontendTests(projectRoot: string, verbose: boolean = false): ModuleTestResult {
  const startTime = Date.now();
  const verboseFlag = verbose ? "--verbose" : "";

  try {
    const output = execSync(`npx vitest run ${verboseFlag} 2>&1`, {
      cwd: projectRoot,
      encoding: "utf-8",
      timeout: 120_000,
      env: { ...process.env, CI: "true", NODE_ENV: "test" },
    });
    const parsed = parseTestOutput(output);
    return {
      module: "editor",
      passed: parsed.passed,
      failed: parsed.failed,
      skipped: parsed.skipped,
      durationMs: Date.now() - startTime,
      errors: [],
    };
  } catch (err: unknown) {
    const execError = err as { stderr?: string; message?: string };
    return {
      module: "editor",
      passed: 0,
      failed: 1,
      skipped: 0,
      durationMs: Date.now() - startTime,
      errors: [(execError.stderr || execError.message || "Frontend tests failed").slice(0, 2000)],
    };
  }
}

export function formatTestResults(result: TestOrchestratorResult): string {
  const lines: string[] = [
    "Test Results",
    "=".repeat(50),
    "",
  ];

  for (const r of result.results) {
    const status = r.failed === 0 ? "✓" : "✗";
    lines.push(
      `  ${status} ${r.module}: ${r.passed} passed, ${r.failed} failed, ${r.skipped} skipped (${r.durationMs}ms)`
    );
    for (const err of r.errors) {
      lines.push(`    ERROR: ${err.split("\n")[0]}`);
    }
  }

  lines.push("");
  lines.push(`Total duration: ${result.totalDurationMs}ms`);
  lines.push(result.allPassed ? "✓ All tests passed." : "✗ Some tests failed.");

  return lines.join("\n");
}
