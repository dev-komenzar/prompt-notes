// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 55-1
// @task-title: `brew install --cask promptnotes` でインストール・起動可能
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/test/acceptance_criteria.md AC-DI-02

import { execSync } from "node:child_process";

/**
 * Runs brew audit and brew style on the installed/tapped cask to verify
 * it passes Homebrew linting before submitting a PR.
 * Must run on macOS with Homebrew installed.
 */
export interface AuditResult {
  passed: boolean;
  auditOutput: string;
  styleOutput: string;
}

function exec(cmd: string): { stdout: string; exitCode: number } {
  try {
    const stdout = execSync(cmd, { encoding: "utf-8" });
    return { stdout, exitCode: 0 };
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; status?: number };
    return {
      stdout: [e.stdout, e.stderr].filter(Boolean).join("\n"),
      exitCode: e.status ?? 1,
    };
  }
}

export function auditCask(caskName: string): AuditResult {
  if (process.platform !== "darwin") {
    throw new Error("brew audit must run on macOS");
  }

  const audit = exec(`brew audit --cask ${caskName}`);
  const style = exec(`brew style --cask ${caskName}`);

  const passed = audit.exitCode === 0 && style.exitCode === 0;

  return {
    passed,
    auditOutput: audit.stdout,
    styleOutput: style.stdout,
  };
}

export function installAndVerifyCask(caskName: string): boolean {
  if (process.platform !== "darwin") {
    throw new Error("brew install --cask must run on macOS");
  }

  // Uninstall first if already present (idempotent CI runs)
  exec(`brew uninstall --cask ${caskName} 2>/dev/null || true`);

  const install = exec(`brew install --cask ${caskName}`);
  if (install.exitCode !== 0) {
    console.error("brew install --cask failed:");
    console.error(install.stdout);
    return false;
  }

  // Verify the app is present in /Applications
  const verify = exec(`ls /Applications/PromptNotes.app`);
  if (verify.exitCode !== 0) {
    console.error("PromptNotes.app not found in /Applications after install");
    return false;
  }

  console.log("brew install --cask promptnotes: OK");
  console.log("PromptNotes.app found in /Applications");
  return true;
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const caskName = args[0] ?? "promptnotes";
  const doInstall = args.includes("--install");

  try {
    const result = auditCask(caskName);
    console.log("=== brew audit ===");
    console.log(result.auditOutput || "(no output)");
    console.log("=== brew style ===");
    console.log(result.styleOutput || "(no output)");

    if (!result.passed) {
      process.exit(1);
    }

    if (doInstall) {
      const ok = installAndVerifyCask(caskName);
      process.exit(ok ? 0 : 1);
    }
  } catch (err: unknown) {
    console.error((err as Error).message);
    process.exit(1);
  }
}
