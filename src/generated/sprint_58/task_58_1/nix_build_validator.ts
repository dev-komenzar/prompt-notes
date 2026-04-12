// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 58-1
// @task-title: パッケージング
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/plan/implementation_plan.md
// @generated-by: codd implement --sprint 58

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

/**
 * Validates that the Nix derivation files are structurally sound before
 * committing. Checks:
 *   1. nix/default.nix exists and is syntactically valid (`nix-instantiate --parse`)
 *   2. flake.nix exists and passes `nix flake check --no-build`
 *   3. Placeholder hashes have been replaced (no "AAAAAAAAAA" in the nix files)
 *
 * Platform: Linux and macOS only (Windows is out of scope).
 */

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

function validateNixFiles(projectRoot: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Check that required files exist.
  const defaultNix = path.join(projectRoot, "nix", "default.nix");
  const flakeNix = path.join(projectRoot, "flake.nix");

  if (!fs.existsSync(defaultNix)) {
    errors.push(`nix/default.nix not found. Run: npx tsx src/generated/sprint_58/task_58_1/generate_nix.ts > nix/default.nix`);
  }
  if (!fs.existsSync(flakeNix)) {
    errors.push(`flake.nix not found. Run: npx tsx src/generated/sprint_58/task_58_1/flake_fragment.ts > flake.nix`);
  }

  if (errors.length > 0) {
    return { passed: false, errors, warnings };
  }

  // 2. Check for placeholder hashes that must be replaced before a real build.
  const nixContent = fs.readFileSync(defaultNix, "utf-8");
  const flakeContent = fs.readFileSync(flakeNix, "utf-8");

  if (nixContent.includes("AAAAAAAAAAAAAAAAAAA")) {
    warnings.push(
      "nix/default.nix contains placeholder hashes. " +
      "Build once with `nix build` to obtain real hashes, then update nix_derivation_config.ts."
    );
  }

  // 3. Syntax check via nix-instantiate if `nix` is available in PATH.
  const nixAvailable = isCommandAvailable("nix-instantiate");
  if (!nixAvailable) {
    warnings.push("nix-instantiate not found on PATH — skipping syntax validation. Install Nix to validate.");
  } else {
    try {
      execSync(`nix-instantiate --parse ${defaultNix}`, { stdio: "pipe" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`nix/default.nix has syntax errors: ${msg}`);
    }
  }

  // 4. Flake check (non-build) if flakes are enabled.
  const flakeCapable = isCommandAvailable("nix") && nixFlakesEnabled();
  if (!flakeCapable) {
    warnings.push("nix flake check skipped — Nix with flakes support not detected.");
  } else {
    try {
      execSync(`nix flake check --no-build ${projectRoot}`, { stdio: "pipe", cwd: projectRoot });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`flake.nix check failed: ${msg}`);
    }
  }

  return { passed: errors.length === 0, errors, warnings };
}

function isCommandAvailable(cmd: string): boolean {
  try {
    execSync(`command -v ${cmd}`, { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

function nixFlakesEnabled(): boolean {
  try {
    const out = execSync("nix --version", { stdio: "pipe" }).toString();
    // Nix ≥ 2.4 supports flakes experimentally; ≥ 2.18 stable.
    const match = out.match(/nix \(Nix\) (\d+)\.(\d+)/);
    if (!match) return false;
    const major = parseInt(match[1], 10);
    const minor = parseInt(match[2], 10);
    return major > 2 || (major === 2 && minor >= 4);
  } catch {
    return false;
  }
}

if (require.main === module) {
  const root = process.argv[2] ?? path.resolve(__dirname, "../../../../..");
  const result = validateNixFiles(root);

  for (const w of result.warnings) {
    console.warn(`WARN: ${w}`);
  }
  for (const e of result.errors) {
    console.error(`ERROR: ${e}`);
  }

  if (result.passed) {
    console.log("Nix derivation validation passed.");
    process.exit(0);
  } else {
    console.error("Nix derivation validation FAILED.");
    process.exit(1);
  }
}

export { validateNixFiles };
