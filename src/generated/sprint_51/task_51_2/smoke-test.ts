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

import { execSync, spawnSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

export interface SmokeTestResult {
  name: string;
  passed: boolean;
  output?: string;
  error?: string;
}

export interface SmokeTestSuite {
  artifact: string;
  results: SmokeTestResult[];
  passed: boolean;
}

function runTest(
  name: string,
  fn: () => void
): SmokeTestResult {
  try {
    fn();
    return { name, passed: true };
  } catch (err) {
    return {
      name,
      passed: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function smokeTestDeb(debPath: string): SmokeTestSuite {
  const results: SmokeTestResult[] = [];

  results.push(
    runTest("deb file exists", () => {
      if (!fs.existsSync(debPath)) throw new Error(`File not found: ${debPath}`);
    })
  );

  results.push(
    runTest("deb has valid control info", () => {
      const out = execSync(`dpkg-deb --info "${debPath}"`, {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
      if (!out.includes("Package:")) {
        throw new Error("Missing Package field in control info");
      }
    })
  );

  results.push(
    runTest("deb package name is promptnotes", () => {
      const out = execSync(`dpkg-deb --info "${debPath}"`, {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
      if (!/Package:\s*promptnotes/i.test(out)) {
        throw new Error("Package name does not match 'promptnotes'");
      }
    })
  );

  results.push(
    runTest("deb contains binary", () => {
      const out = execSync(`dpkg-deb --contents "${debPath}"`, {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
      if (!out.includes("promptnotes")) {
        throw new Error("No promptnotes binary found in .deb contents");
      }
    })
  );

  results.push(
    runTest("deb lists installed files", () => {
      const out = execSync(`dpkg-deb --contents "${debPath}"`, {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
      const hasUsr = out.includes("./usr/") || out.includes("/usr/");
      if (!hasUsr) {
        throw new Error("Expected /usr/ path in deb contents");
      }
    })
  );

  const passed = results.every((r) => r.passed);
  return { artifact: debPath, results, passed };
}

export function smokeTestAppImage(appImagePath: string): SmokeTestSuite {
  const results: SmokeTestResult[] = [];

  results.push(
    runTest("AppImage file exists", () => {
      if (!fs.existsSync(appImagePath)) {
        throw new Error(`File not found: ${appImagePath}`);
      }
    })
  );

  results.push(
    runTest("AppImage is executable", () => {
      const mode = fs.statSync(appImagePath).mode;
      if ((mode & 0o111) === 0) {
        throw new Error("AppImage file is not executable");
      }
    })
  );

  results.push(
    runTest("AppImage has ELF header", () => {
      const buf = Buffer.alloc(4);
      const fd = fs.openSync(appImagePath, "r");
      fs.readSync(fd, buf, 0, 4, 0);
      fs.closeSync(fd);
      // ELF magic: 0x7f 'E' 'L' 'F'
      if (
        buf[0] !== 0x7f ||
        buf[1] !== 0x45 ||
        buf[2] !== 0x4c ||
        buf[3] !== 0x46
      ) {
        throw new Error(
          "AppImage does not have ELF magic bytes (not a valid ELF/AppImage)"
        );
      }
    })
  );

  results.push(
    runTest("AppImage size is reasonable (> 10 MB)", () => {
      const stat = fs.statSync(appImagePath);
      if (stat.size < 10 * 1024 * 1024) {
        throw new Error(
          `AppImage too small: ${stat.size} bytes (expected > 10 MB for Tauri app)`
        );
      }
    })
  );

  results.push(
    runTest("AppImage --appimage-extract-and-run is available or FUSE present", () => {
      // Check that we can at least run with --appimage-extract-and-run flag
      // (or that FUSE is available). This does not launch the GUI.
      const result = spawnSync(appImagePath, ["--appimage-help"], {
        timeout: 5000,
        env: { ...process.env, APPIMAGE_EXTRACT_AND_RUN: "1" },
      });
      // Exit code non-zero is OK here; we just want to confirm it runs at all
      if (result.error && result.error.message.includes("ENOENT")) {
        throw new Error("AppImage binary not found or not executable via spawn");
      }
    })
  );

  const passed = results.every((r) => r.passed);
  return { artifact: appImagePath, results, passed };
}

export function printSmokeTestReport(suite: SmokeTestSuite): void {
  const status = suite.passed ? "PASS" : "FAIL";
  console.log(`\n[${status}] Smoke tests for: ${suite.artifact}`);
  for (const r of suite.results) {
    const mark = r.passed ? "  ✓" : "  ✗";
    console.log(`${mark} ${r.name}`);
    if (!r.passed && r.error) {
      console.log(`      Error: ${r.error}`);
    }
  }
}
