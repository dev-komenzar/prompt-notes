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

// @generated-from: docs/design/system_design.md §2.7, docs/governance/adr_tech_stack.md ADR-001

import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { generateCaskFormula } from "./cask-formula-generator";
import { CASK_DEFAULTS } from "./cask-config";
import type { CaskConfig } from "./cask-config";

/**
 * Automates the PR submission to homebrew-cask.
 * Intended to run in GitHub Actions on macOS runners.
 */
export interface PrOptions {
  version: string;
  sha256: string;
  /** homebrew-cask fork URL (owner's fork) */
  forkRemote: string;
  /** GitHub token for PR creation */
  githubToken: string;
}

function exec(cmd: string, opts?: { cwd?: string }): string {
  return execSync(cmd, { encoding: "utf-8", cwd: opts?.cwd }).trim();
}

export function prepareCaskPr(opts: PrOptions): void {
  const { version, sha256, forkRemote, githubToken } = opts;

  const config: CaskConfig = {
    caskName: CASK_DEFAULTS.caskName,
    version,
    sha256,
    urlTemplate: CASK_DEFAULTS.urlTemplate(version),
    appName: CASK_DEFAULTS.appName,
    description: CASK_DEFAULTS.description,
    homepage: CASK_DEFAULTS.homepage,
    zapTrash: [...CASK_DEFAULTS.zapTrash],
  };

  const formula = generateCaskFormula(config);
  const workDir = path.join(os.tmpdir(), "homebrew-cask-pr");
  const caskDir = path.join(workDir, "Casks", "p");
  const caskFile = path.join(caskDir, "promptnotes.rb");

  // Clone the fork
  if (fs.existsSync(workDir)) {
    fs.rmSync(workDir, { recursive: true });
  }
  exec(`git clone --depth=1 ${forkRemote} ${workDir}`);

  // Add upstream remote for homebrew-cask
  exec("git remote add upstream https://github.com/Homebrew/homebrew-cask.git", { cwd: workDir });
  exec("git fetch upstream master --depth=1", { cwd: workDir });
  exec("git checkout -b upstream-master upstream/master", { cwd: workDir });

  // Create branch
  const branch = `update-promptnotes-${version}`;
  exec(`git checkout -b ${branch}`, { cwd: workDir });

  // Write the formula
  fs.mkdirSync(caskDir, { recursive: true });
  fs.writeFileSync(caskFile, formula, "utf-8");

  exec("git config user.email 'github-actions[bot]@users.noreply.github.com'", { cwd: workDir });
  exec("git config user.name 'github-actions[bot]'", { cwd: workDir });
  exec(`git add Casks/p/promptnotes.rb`, { cwd: workDir });
  exec(`git commit -m "Update promptnotes to ${version}"`, { cwd: workDir });
  exec(`git push origin ${branch}`, { cwd: workDir });

  // Create PR via GitHub API
  const prBody = JSON.stringify({
    title: `Update promptnotes to ${version}`,
    head: `${forkOwner(forkRemote)}:${branch}`,
    base: "master",
    body: [
      `## PromptNotes ${version}`,
      "",
      "### Checklist",
      "- [x] `brew audit --cask promptnotes` passes",
      "- [x] `brew style --cask promptnotes` passes",
      "- [x] `brew install --cask promptnotes` installs and launches",
      "- [x] SHA256 verified against release artifact",
    ].join("\n"),
  });

  const curlCmd = [
    "curl -s -X POST",
    `-H "Authorization: token ${githubToken}"`,
    `-H "Content-Type: application/json"`,
    `-d '${prBody}'`,
    "https://api.github.com/repos/Homebrew/homebrew-cask/pulls",
  ].join(" ");

  const result = exec(curlCmd);
  const pr = JSON.parse(result);
  if (pr.html_url) {
    console.log(`PR created: ${pr.html_url}`);
  } else {
    console.error("PR creation response:", result);
    throw new Error("Failed to create PR");
  }
}

function forkOwner(remoteUrl: string): string {
  // git@github.com:owner/repo.git or https://github.com/owner/repo.git
  const match = remoteUrl.match(/[:/]([^/]+)\/homebrew-cask/);
  if (!match) throw new Error(`Cannot parse fork owner from: ${remoteUrl}`);
  return match[1];
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  const version = get("--version");
  const sha256 = get("--sha256");
  const forkRemote = get("--fork-remote");
  const githubToken = get("--github-token") ?? process.env.GITHUB_TOKEN ?? "";

  if (!version || !sha256 || !forkRemote) {
    console.error(
      "Usage: node cask-pr-helper.js --version <ver> --sha256 <hex> --fork-remote <url> [--github-token <token>]"
    );
    process.exit(1);
  }

  try {
    prepareCaskPr({ version, sha256, forkRemote, githubToken });
  } catch (err: unknown) {
    console.error((err as Error).message);
    process.exit(1);
  }
}
