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

import { execSync, type ExecSyncOptions } from "node:child_process";
import * as path from "node:path";
import * as fs from "node:fs";
import {
  detectPlatform,
  assertLinuxDependencies,
} from "./platform";
import {
  resolveBuildConfig,
  resolveArtifacts,
  assertArtifactsPresent,
  type ArtifactPaths,
} from "./build_config";

const EXEC_OPTS: ExecSyncOptions = { stdio: "inherit" };

function buildFrontend(projectRoot: string): void {
  console.log("[build] Building Svelte frontend...");
  execSync("npm run build", { ...EXEC_OPTS, cwd: projectRoot });
}

function runTauriBuild(
  projectRoot: string,
  targets: string[]
): void {
  const targetFlags = targets.map((t) => `--target ${t}`).join(" ");
  const cmd = `cargo tauri build ${targetFlags}`.trim();
  console.log(`[build] Running: ${cmd}`);
  execSync(cmd, { ...EXEC_OPTS, cwd: projectRoot });
}

function printArtifacts(artifacts: ArtifactPaths): void {
  console.log("\n[build] ✓ Build artifacts:");
  if (artifacts.deb) {
    const size = Math.round(fs.statSync(artifacts.deb).size / 1024);
    console.log(`  .deb      → ${artifacts.deb} (${size} KB)`);
  }
  if (artifacts.appimage) {
    const size = Math.round(fs.statSync(artifacts.appimage).size / 1024);
    console.log(`  .AppImage → ${artifacts.appimage} (${size} KB)`);
  }
  if (artifacts.dmg) {
    const size = Math.round(fs.statSync(artifacts.dmg).size / 1024);
    console.log(`  .dmg      → ${artifacts.dmg} (${size} KB)`);
  }
}

function main(): void {
  const platformInfo = detectPlatform();
  console.log(
    `[build] Platform: ${platformInfo.platform} (${platformInfo.arch})`
  );

  if (platformInfo.platform === "linux") {
    assertLinuxDependencies();
  }

  const projectRoot = path.resolve(__dirname, "..", "..", "..", "..");
  const config = resolveBuildConfig(platformInfo.platform, projectRoot);

  buildFrontend(projectRoot);

  const targets: string[] =
    platformInfo.platform === "linux"
      ? [] // tauri build defaults include deb + appimage on Linux
      : [];

  runTauriBuild(projectRoot, targets);

  const artifacts = resolveArtifacts(config);
  assertArtifactsPresent(artifacts, platformInfo.platform);
  printArtifacts(artifacts);

  console.log("\n[build] Packaging complete.");
}

main();
