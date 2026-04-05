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
// Design refs: design:system-design §2.7, governance:adr_tech_stack ADR-001, ADR-006

import { execSync } from "child_process";
import { join } from "path";
import type { Platform, BuildResult } from "./types";
import { collectArtifacts, validateArtifacts } from "./artifact-config";
import { detectPlatform } from "./platform";

export interface BuildConfig {
  readonly projectRoot: string;
  readonly platform: Platform;
  readonly release: boolean;
  readonly verbose: boolean;
  readonly version: string;
  readonly tauriArgs: readonly string[];
}

function installFrontendDeps(projectRoot: string, verbose: boolean): void {
  const cmd = detectPackageManager(projectRoot);
  const stdio = verbose ? "inherit" : "pipe";
  execSync(`${cmd} install`, {
    cwd: projectRoot,
    encoding: "utf-8",
    timeout: 300_000,
    stdio: stdio as any,
    env: { ...process.env, CI: "true" },
  });
}

function detectPackageManager(projectRoot: string): string {
  const { existsSync } = require("fs");
  if (existsSync(join(projectRoot, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(projectRoot, "yarn.lock"))) return "yarn";
  return "npm";
}

function buildFrontend(projectRoot: string, verbose: boolean): void {
  const pkgMgr = detectPackageManager(projectRoot);
  const buildCmd = pkgMgr === "npm" ? "npm run build" : `${pkgMgr} build`;
  const stdio = verbose ? "inherit" : "pipe";
  execSync(buildCmd, {
    cwd: projectRoot,
    encoding: "utf-8",
    timeout: 120_000,
    stdio: stdio as any,
    env: { ...process.env, CI: "true", NODE_ENV: "production" },
  });
}

function buildTauri(config: BuildConfig): void {
  const cargoDir = join(config.projectRoot, "src-tauri");
  const args = [
    "tauri",
    "build",
    ...(config.verbose ? ["--verbose"] : []),
    ...config.tauriArgs,
  ].join(" ");

  const stdio = config.verbose ? "inherit" : "pipe";
  execSync(`cargo ${args}`, {
    cwd: cargoDir,
    encoding: "utf-8",
    timeout: 600_000,
    stdio: stdio as any,
    env: {
      ...process.env,
      CI: "true",
      TAURI_SIGNING_PRIVATE_KEY: process.env.TAURI_SIGNING_PRIVATE_KEY || "",
    },
  });
}

export function createDefaultBuildConfig(
  projectRoot: string,
  version: string
): BuildConfig {
  const platform = detectPlatform();
  const tauriArgs: string[] =
    platform === "linux"
      ? ["--bundles", "appimage,deb"]
      : ["--bundles", "dmg"];

  return {
    projectRoot,
    platform,
    release: true,
    verbose: process.env.CI === "true",
    version,
    tauriArgs,
  };
}

export function executeBuild(config: BuildConfig): BuildResult {
  const startTime = Date.now();
  const errors: string[] = [];

  try {
    if (config.verbose) {
      process.stdout.write(`[BUILD] Installing frontend dependencies...\n`);
    }
    installFrontendDeps(config.projectRoot, config.verbose);

    if (config.verbose) {
      process.stdout.write(`[BUILD] Building frontend...\n`);
    }
    buildFrontend(config.projectRoot, config.verbose);

    if (config.verbose) {
      process.stdout.write(`[BUILD] Building Tauri application for ${config.platform}...\n`);
    }
    buildTauri(config);

    const artifacts = collectArtifacts(
      config.projectRoot,
      config.platform,
      config.version
    );

    const validation = validateArtifacts(
      config.projectRoot,
      config.platform,
      config.version
    );

    if (!validation.valid) {
      errors.push(`Missing artifacts: ${validation.missing.join(", ")}`);
    }

    return {
      platform: config.platform,
      success: validation.valid,
      artifacts,
      durationMs: Date.now() - startTime,
      errors,
    };
  } catch (err: unknown) {
    const execError = err as { stderr?: string; message?: string };
    errors.push(
      (execError.stderr || execError.message || "Build failed").slice(0, 3000)
    );
    return {
      platform: config.platform,
      success: false,
      artifacts: [],
      durationMs: Date.now() - startTime,
      errors,
    };
  }
}

export function formatBuildResult(result: BuildResult): string {
  const lines: string[] = [
    `Build Result — ${result.platform}`,
    "=".repeat(50),
    `  Status: ${result.success ? "SUCCESS" : "FAILED"}`,
    `  Duration: ${result.durationMs}ms`,
    `  Artifacts: ${result.artifacts.length}`,
  ];

  for (const artifact of result.artifacts) {
    lines.push(`    - ${artifact.name} (${artifact.format}) sha256:${artifact.checksum?.slice(0, 12)}...`);
  }

  if (result.errors.length > 0) {
    lines.push("  Errors:");
    for (const err of result.errors) {
      lines.push(`    ${err.split("\n")[0]}`);
    }
  }

  return lines.join("\n");
}
