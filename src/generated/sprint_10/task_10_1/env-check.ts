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
// Design refs: governance:adr_tech_stack ADR-001, detail:component_architecture §4.5

import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import { detectPlatform } from "./platform";
import type { Platform } from "./types";

interface DependencyCheckResult {
  readonly name: string;
  readonly available: boolean;
  readonly version: string;
  readonly required: boolean;
  readonly message: string;
}

interface EnvironmentCheckReport {
  readonly platform: Platform;
  readonly allRequiredAvailable: boolean;
  readonly dependencies: readonly DependencyCheckResult[];
}

function checkCommand(cmd: string): { available: boolean; version: string } {
  try {
    const output = execSync(cmd, {
      encoding: "utf-8",
      timeout: 15_000,
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    return { available: true, version: output };
  } catch {
    return { available: false, version: "" };
  }
}

function checkRust(): DependencyCheckResult {
  const { available, version } = checkCommand("rustc --version");
  return {
    name: "rustc",
    available,
    version: version.replace("rustc ", ""),
    required: true,
    message: available
      ? `Rust compiler found: ${version}`
      : "Rust compiler not found. Install via https://rustup.rs/",
  };
}

function checkCargo(): DependencyCheckResult {
  const { available, version } = checkCommand("cargo --version");
  return {
    name: "cargo",
    available,
    version: version.replace("cargo ", ""),
    required: true,
    message: available
      ? `Cargo found: ${version}`
      : "Cargo not found. Install via https://rustup.rs/",
  };
}

function checkTauriCli(): DependencyCheckResult {
  const { available, version } = checkCommand("cargo tauri --version");
  return {
    name: "tauri-cli",
    available,
    version: version.replace("tauri-cli ", ""),
    required: true,
    message: available
      ? `Tauri CLI found: ${version}`
      : "Tauri CLI not found. Install via: cargo install tauri-cli",
  };
}

function checkNode(): DependencyCheckResult {
  const { available, version } = checkCommand("node --version");
  return {
    name: "node",
    available,
    version,
    required: true,
    message: available
      ? `Node.js found: ${version}`
      : "Node.js not found. Required for frontend build.",
  };
}

function checkPnpmOrNpm(): DependencyCheckResult {
  const pnpm = checkCommand("pnpm --version");
  if (pnpm.available) {
    return {
      name: "pnpm",
      available: true,
      version: pnpm.version,
      required: true,
      message: `pnpm found: ${pnpm.version}`,
    };
  }
  const npm = checkCommand("npm --version");
  return {
    name: "npm",
    available: npm.available,
    version: npm.version,
    required: true,
    message: npm.available
      ? `npm found: ${npm.version}`
      : "Neither pnpm nor npm found. A package manager is required.",
  };
}

function checkWebKitGtk(): DependencyCheckResult {
  const { available } = checkCommand(
    "pkg-config --modversion webkit2gtk-4.1"
  );
  const version = available
    ? execSync("pkg-config --modversion webkit2gtk-4.1", { encoding: "utf-8" }).trim()
    : "";
  return {
    name: "webkit2gtk-4.1",
    available,
    version,
    required: true,
    message: available
      ? `WebKitGTK found: ${version}`
      : "WebKitGTK 4.1 not found. Required for Linux builds: sudo apt install libwebkit2gtk-4.1-dev",
  };
}

function checkGtkDev(): DependencyCheckResult {
  const { available } = checkCommand("pkg-config --modversion gtk+-3.0");
  const version = available
    ? execSync("pkg-config --modversion gtk+-3.0", { encoding: "utf-8" }).trim()
    : "";
  return {
    name: "gtk+-3.0",
    available,
    version,
    required: true,
    message: available
      ? `GTK 3 found: ${version}`
      : "GTK 3 not found. Required for Linux builds: sudo apt install libgtk-3-dev",
  };
}

function checkXcodeBuildTools(): DependencyCheckResult {
  const { available, version } = checkCommand("xcode-select --version");
  return {
    name: "xcode-select",
    available,
    version,
    required: true,
    message: available
      ? `Xcode command line tools found: ${version}`
      : "Xcode CLI tools not found. Install via: xcode-select --install",
  };
}

export function checkProjectStructure(projectRoot: string): DependencyCheckResult {
  const requiredPaths = [
    "src-tauri/Cargo.toml",
    "src-tauri/tauri.conf.json",
    "package.json",
  ];
  const missing = requiredPaths.filter(
    (p) => !existsSync(join(projectRoot, p))
  );
  const available = missing.length === 0;
  return {
    name: "project-structure",
    available,
    version: "",
    required: true,
    message: available
      ? "Tauri project structure validated."
      : `Missing required project files: ${missing.join(", ")}`,
  };
}

export function runEnvironmentCheck(projectRoot: string): EnvironmentCheckReport {
  const platform = detectPlatform();
  const deps: DependencyCheckResult[] = [
    checkRust(),
    checkCargo(),
    checkTauriCli(),
    checkNode(),
    checkPnpmOrNpm(),
    checkProjectStructure(projectRoot),
  ];

  if (platform === "linux") {
    deps.push(checkWebKitGtk());
    deps.push(checkGtkDev());
  }

  if (platform === "macos") {
    deps.push(checkXcodeBuildTools());
  }

  const allRequiredAvailable = deps
    .filter((d) => d.required)
    .every((d) => d.available);

  return {
    platform,
    allRequiredAvailable,
    dependencies: deps,
  };
}

export function formatEnvironmentReport(report: EnvironmentCheckReport): string {
  const lines: string[] = [
    `CI Environment Check — Platform: ${report.platform}`,
    "=".repeat(50),
    "",
  ];

  for (const dep of report.dependencies) {
    const status = dep.available ? "✓" : "✗";
    const req = dep.required ? "[required]" : "[optional]";
    lines.push(`  ${status} ${dep.name} ${req}`);
    lines.push(`    ${dep.message}`);
  }

  lines.push("");
  lines.push(
    report.allRequiredAvailable
      ? "✓ All required dependencies are available."
      : "✗ Some required dependencies are missing. Build will fail."
  );

  return lines.join("\n");
}
