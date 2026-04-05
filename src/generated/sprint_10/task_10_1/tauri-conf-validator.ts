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
// Design refs: detail:component_architecture §4.1, governance:adr_tech_stack ADR-001
// Convention: framework:tauri, module:shell — Tauri config must enforce IPC boundary

import { readFileSync, existsSync } from "fs";
import { join } from "path";

export interface TauriConfValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

interface TauriConf {
  productName?: string;
  version?: string;
  build?: { beforeBuildCommand?: string; beforeDevCommand?: string };
  app?: {
    windows?: Array<{ title?: string; width?: number; height?: number }>;
    security?: {
      csp?: string;
      capabilities?: unknown[];
    };
  };
  bundle?: {
    active?: boolean;
    targets?: string[] | string;
    identifier?: string;
    icon?: string[];
    linux?: { deb?: unknown; appimage?: unknown };
    macOS?: { dmg?: unknown };
  };
}

export function validateTauriConf(projectRoot: string): TauriConfValidationResult {
  const confPath = join(projectRoot, "src-tauri", "tauri.conf.json");
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!existsSync(confPath)) {
    return {
      valid: false,
      errors: [`tauri.conf.json not found at ${confPath}`],
      warnings: [],
    };
  }

  let conf: TauriConf;
  try {
    const raw = readFileSync(confPath, "utf-8");
    conf = JSON.parse(raw);
  } catch (err) {
    return {
      valid: false,
      errors: [`Failed to parse tauri.conf.json: ${(err as Error).message}`],
      warnings: [],
    };
  }

  // Validate productName
  if (!conf.productName) {
    errors.push("productName is not set in tauri.conf.json");
  }

  // Validate bundle configuration
  if (!conf.bundle) {
    errors.push("bundle section is missing in tauri.conf.json");
  } else {
    if (!conf.bundle.identifier) {
      errors.push("bundle.identifier is not set");
    }
    if (!conf.bundle.icon || conf.bundle.icon.length === 0) {
      warnings.push("bundle.icon is empty — application will use default icon");
    }
  }

  // Check for prohibited filesystem access in Tauri v2 capabilities
  const capabilities = conf.app?.security?.capabilities;
  if (Array.isArray(capabilities)) {
    for (const cap of capabilities) {
      const capStr = JSON.stringify(cap);
      if (capStr.includes("fs:") && !capStr.includes("fs:deny")) {
        warnings.push(
          "Filesystem capability detected. Ensure fs access is restricted to IPC commands only (CONV: module:shell)."
        );
      }
    }
  }

  // CSP check
  if (conf.app?.security?.csp) {
    const csp = conf.app.security.csp;
    if (!csp.includes("default-src")) {
      warnings.push("CSP does not include default-src directive");
    }
  } else {
    warnings.push(
      "No CSP defined in app.security.csp. Consider adding a restrictive CSP."
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateCargoToml(projectRoot: string): TauriConfValidationResult {
  const cargoPath = join(projectRoot, "src-tauri", "Cargo.toml");
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!existsSync(cargoPath)) {
    return {
      valid: false,
      errors: [`Cargo.toml not found at ${cargoPath}`],
      warnings: [],
    };
  }

  const content = readFileSync(cargoPath, "utf-8");

  // Must depend on tauri
  if (!content.includes("tauri")) {
    errors.push("Cargo.toml does not include tauri dependency");
  }

  // Required crates for module:storage
  const requiredCrates = ["serde", "serde_yaml", "serde_json", "chrono", "dirs"];
  for (const crate of requiredCrates) {
    if (!content.includes(crate)) {
      warnings.push(
        `Cargo.toml may be missing ${crate} dependency (required for module:storage)`
      );
    }
  }

  // Should not include prohibited crates
  const prohibitedCrates = ["reqwest", "hyper"];
  for (const crate of prohibitedCrates) {
    if (content.includes(`"${crate}"`)) {
      warnings.push(
        `Cargo.toml includes ${crate} — verify it's not used for cloud sync (prohibited)`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function formatValidationResult(
  label: string,
  result: TauriConfValidationResult
): string {
  const lines: string[] = [
    `${label}: ${result.valid ? "✓ VALID" : "✗ INVALID"}`,
  ];
  for (const err of result.errors) {
    lines.push(`  ✗ ERROR: ${err}`);
  }
  for (const warn of result.warnings) {
    lines.push(`  ⚠ WARNING: ${warn}`);
  }
  return lines.join("\n");
}
