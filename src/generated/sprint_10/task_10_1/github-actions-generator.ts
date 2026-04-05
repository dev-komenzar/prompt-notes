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
// Design refs: design:system-design §2.7, governance:adr_tech_stack ADR-006
// Convention: platform:linux, platform:macos — CI must build and test both

import { generateBuildMatrix, getLinuxSystemDeps } from "./build-matrix";
import type { Platform } from "./types";

export interface WorkflowDefinition {
  readonly name: string;
  readonly on: Record<string, unknown>;
  readonly jobs: Record<string, unknown>;
}

export function generateCIWorkflow(): WorkflowDefinition {
  const matrix = generateBuildMatrix();
  const linuxDeps = getLinuxSystemDeps();

  return {
    name: "CI — Build & Test (Linux + macOS)",
    on: {
      push: { branches: ["main", "develop"] },
      pull_request: { branches: ["main"] },
    },
    jobs: {
      "release-blocker-check": {
        "runs-on": "ubuntu-latest",
        steps: [
          { uses: "actions/checkout@v4" },
          {
            name: "Setup Node.js",
            uses: "actions/setup-node@v4",
            with: { "node-version": "20" },
          },
          {
            name: "Install dependencies",
            run: "npm ci",
          },
          {
            name: "Run release blocker checks",
            run: "npx ts-node src/generated/sprint_10/task_10_1/cli.ts release-check",
          },
        ],
      },
      "build-and-test": {
        "needs": "release-blocker-check",
        strategy: {
          "fail-fast": false,
          matrix: {
            include: matrix.map((entry) => ({
              os: entry.runner,
              platform: entry.platform,
              tauri_args: entry.tauriArgs.join(" "),
            })),
          },
        },
        "runs-on": "${{ matrix.os }}",
        steps: [
          { uses: "actions/checkout@v4" },
          {
            name: "Install Linux system dependencies",
            if: "matrix.platform == 'linux'",
            run: `sudo apt-get update && sudo apt-get install -y ${linuxDeps.join(" ")}`,
          },
          {
            name: "Setup Rust",
            uses: "dtolnay/rust-toolchain@stable",
          },
          {
            name: "Rust cache",
            uses: "swatinem/rust-cache@v2",
            with: { workspaces: "src-tauri -> target" },
          },
          {
            name: "Setup Node.js",
            uses: "actions/setup-node@v4",
            with: { "node-version": "20" },
          },
          {
            name: "Install frontend dependencies",
            run: "npm ci",
          },
          {
            name: "Run Rust tests",
            run: "cd src-tauri && cargo test",
          },
          {
            name: "Run frontend tests",
            run: "npx vitest run",
          },
          {
            name: "Install Tauri CLI",
            run: "cargo install tauri-cli",
          },
          {
            name: "Build Tauri app",
            run: "cargo tauri build ${{ matrix.tauri_args }}",
            env: {
              TAURI_SIGNING_PRIVATE_KEY:
                "${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}",
            },
          },
          {
            name: "Upload artifacts",
            uses: "actions/upload-artifact@v4",
            with: {
              name: "promptnotes-${{ matrix.platform }}",
              path: "src-tauri/target/release/bundle/**/*",
              "retention-days": 7,
            },
          },
        ],
      },
    },
  };
}

export function generateReleaseWorkflow(): WorkflowDefinition {
  const matrix = generateBuildMatrix();
  const linuxDeps = getLinuxSystemDeps();

  return {
    name: "Release — Build & Publish",
    on: {
      push: { tags: ["v*"] },
    },
    jobs: {
      "build-release": {
        strategy: {
          "fail-fast": true,
          matrix: {
            include: matrix.map((entry) => ({
              os: entry.runner,
              platform: entry.platform,
              tauri_args: entry.tauriArgs.join(" "),
            })),
          },
        },
        "runs-on": "${{ matrix.os }}",
        permissions: { contents: "write" },
        steps: [
          { uses: "actions/checkout@v4" },
          {
            name: "Install Linux system dependencies",
            if: "matrix.platform == 'linux'",
            run: `sudo apt-get update && sudo apt-get install -y ${linuxDeps.join(" ")}`,
          },
          {
            name: "Setup Rust",
            uses: "dtolnay/rust-toolchain@stable",
          },
          {
            name: "Rust cache",
            uses: "swatinem/rust-cache@v2",
            with: { workspaces: "src-tauri -> target" },
          },
          {
            name: "Setup Node.js",
            uses: "actions/setup-node@v4",
            with: { "node-version": "20" },
          },
          {
            name: "Install frontend dependencies",
            run: "npm ci",
          },
          {
            name: "Run all tests",
            run: "cd src-tauri && cargo test && cd .. && npx vitest run",
          },
          {
            name: "Install Tauri CLI",
            run: "cargo install tauri-cli",
          },
          {
            name: "Build release",
            run: "cargo tauri build ${{ matrix.tauri_args }}",
            env: {
              TAURI_SIGNING_PRIVATE_KEY:
                "${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}",
            },
          },
          {
            name: "Upload release artifacts",
            uses: "softprops/action-gh-release@v2",
            with: {
              files: "src-tauri/target/release/bundle/**/*",
              "fail_on_unmatched_files": false,
            },
          },
        ],
      },
    },
  };
}

export function serializeWorkflow(workflow: WorkflowDefinition): string {
  return toYamlString(workflow);
}

function toYamlString(obj: unknown, indent: number = 0): string {
  const pad = " ".repeat(indent);
  if (obj === null || obj === undefined) return `${pad}null\n`;
  if (typeof obj === "string") {
    if (obj.includes("${{") || obj.includes("\n") || obj.includes(": ") || obj.startsWith("-")) {
      return `"${obj.replace(/"/g, '\\"')}"`;
    }
    return obj;
  }
  if (typeof obj === "number" || typeof obj === "boolean") return String(obj);
  if (Array.isArray(obj)) {
    if (obj.length === 0) return "[]";
    const lines: string[] = [];
    for (const item of obj) {
      if (typeof item === "object" && item !== null) {
        const entries = Object.entries(item);
        if (entries.length > 0) {
          const [firstKey, firstVal] = entries[0];
          lines.push(`${pad}- ${firstKey}: ${toYamlString(firstVal, indent + 4).trimStart()}`);
          for (const [key, val] of entries.slice(1)) {
            lines.push(`${pad}  ${key}: ${toYamlString(val, indent + 4).trimStart()}`);
          }
        }
      } else {
        lines.push(`${pad}- ${toYamlString(item, indent + 2).trimStart()}`);
      }
    }
    return lines.join("\n");
  }
  if (typeof obj === "object") {
    const entries = Object.entries(obj as Record<string, unknown>);
    if (entries.length === 0) return "{}";
    const lines: string[] = [];
    for (const [key, val] of entries) {
      if (typeof val === "object" && val !== null && !Array.isArray(val)) {
        lines.push(`${pad}${key}:`);
        lines.push(toYamlString(val, indent + 2));
      } else if (Array.isArray(val)) {
        lines.push(`${pad}${key}:`);
        lines.push(toYamlString(val, indent + 2));
      } else {
        lines.push(`${pad}${key}: ${toYamlString(val, indent)}`);
      }
    }
    return lines.join("\n");
  }
  return String(obj);
}
