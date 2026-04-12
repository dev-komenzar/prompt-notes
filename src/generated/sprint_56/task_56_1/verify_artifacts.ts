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

import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";
import { detectPlatform } from "./platform";
import { resolveBuildConfig, resolveArtifacts } from "./build_config";

interface VerificationResult {
  artifact: string;
  path: string;
  sizeBytes: number;
  ok: boolean;
  errors: string[];
}

function verifyDeb(debPath: string): VerificationResult {
  const errors: string[] = [];
  const stat = fs.statSync(debPath);

  try {
    const output = execSync(`dpkg-deb --info ${debPath}`, {
      encoding: "utf8",
    });
    if (!output.includes("Package:")) {
      errors.push("dpkg-deb --info output missing Package field");
    }
    if (!output.includes("Architecture:")) {
      errors.push("dpkg-deb --info output missing Architecture field");
    }
  } catch (e) {
    errors.push(`dpkg-deb --info failed: ${e}`);
  }

  if (stat.size < 1024 * 100) {
    errors.push(`Suspiciously small .deb: ${stat.size} bytes`);
  }

  return {
    artifact: ".deb",
    path: debPath,
    sizeBytes: stat.size,
    ok: errors.length === 0,
    errors,
  };
}

function verifyAppImage(appImagePath: string): VerificationResult {
  const errors: string[] = [];
  const stat = fs.statSync(appImagePath);

  const mode = stat.mode;
  const isExecutable = (mode & 0o111) !== 0;
  if (!isExecutable) {
    errors.push(".AppImage file is not executable");
  }

  if (stat.size < 1024 * 1024) {
    errors.push(`Suspiciously small .AppImage: ${stat.size} bytes`);
  }

  const buf = Buffer.alloc(4);
  const fd = fs.openSync(appImagePath, "r");
  fs.readSync(fd, buf, 0, 4, 0);
  fs.closeSync(fd);
  if (buf[0] !== 0x7f || buf[1] !== 0x45 || buf[2] !== 0x4c || buf[3] !== 0x46) {
    errors.push("AppImage does not start with ELF magic bytes");
  }

  return {
    artifact: ".AppImage",
    path: appImagePath,
    sizeBytes: stat.size,
    ok: errors.length === 0,
    errors,
  };
}

function main(): void {
  const platformInfo = detectPlatform();
  const projectRoot = path.resolve(__dirname, "..", "..", "..", "..");
  const config = resolveBuildConfig(platformInfo.platform, projectRoot);
  const artifacts = resolveArtifacts(config);

  const results: VerificationResult[] = [];

  if (platformInfo.platform === "linux") {
    if (!artifacts.deb) {
      console.error("[verify] ERROR: .deb artifact not found");
      process.exit(1);
    }
    if (!artifacts.appimage) {
      console.error("[verify] ERROR: .AppImage artifact not found");
      process.exit(1);
    }
    results.push(verifyDeb(artifacts.deb));
    results.push(verifyAppImage(artifacts.appimage));
  }

  let allOk = true;
  for (const r of results) {
    const kb = Math.round(r.sizeBytes / 1024);
    if (r.ok) {
      console.log(`[verify] ✓ ${r.artifact} — ${r.path} (${kb} KB)`);
    } else {
      allOk = false;
      console.error(`[verify] ✗ ${r.artifact} — ${r.path}`);
      for (const err of r.errors) {
        console.error(`         ${err}`);
      }
    }
  }

  if (!allOk) {
    process.exit(1);
  }

  console.log("\n[verify] All artifacts verified successfully.");
}

main();
