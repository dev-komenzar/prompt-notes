// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 3-1
// @task-title: `direnv allow` 後に Rust ツールチェイン・Node.js・Tauri CLI がすべて利用可能
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/plan/implementation_plan.md
// @sprint: 3
// @task: 3-1
// @description: Environment checker that validates all required tools are available after `direnv allow`

import { execSync } from 'node:child_process';
import { platform } from 'node:os';
import type {
  ToolRequirement,
  EnvironmentCheckResult,
  EnvironmentReport,
} from './env-requirements';
import { REQUIRED_TOOLS, TARGET_PLATFORMS } from './env-requirements';
import { meetsMinimumVersion } from './version-compare';

function checkTool(tool: ToolRequirement): EnvironmentCheckResult {
  try {
    const output = execSync(`${tool.command} ${tool.versionFlag}`, {
      encoding: 'utf-8',
      timeout: 10_000,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();

    const match = output.match(tool.versionPattern);
    const version = match ? match[1] : null;

    const meets = tool.minVersion && version
      ? meetsMinimumVersion(version, tool.minVersion)
      : true;

    return {
      tool: tool.name,
      available: true,
      version,
      meetsMinVersion: meets,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      tool: tool.name,
      available: false,
      version: null,
      meetsMinVersion: false,
      error: `Command '${tool.command}' not found or failed: ${message}`,
    };
  }
}

export function checkEnvironment(): EnvironmentReport {
  const currentPlatform = platform();
  const results = REQUIRED_TOOLS.map(checkTool);
  const allPassed = results.every((r) => r.available && r.meetsMinVersion);

  return {
    platform: currentPlatform,
    timestamp: new Date().toISOString(),
    results,
    allPassed,
  };
}

export function validatePlatform(): { valid: boolean; platform: string } {
  const current = platform();
  const valid = (TARGET_PLATFORMS as readonly string[]).includes(current);
  return { valid, platform: current };
}

export function formatReport(report: EnvironmentReport): string {
  const lines: string[] = [
    `PromptNotes Development Environment Check`,
    `Platform: ${report.platform}`,
    `Timestamp: ${report.timestamp}`,
    ``,
  ];

  for (const result of report.results) {
    const status = result.available && result.meetsMinVersion ? '✓' : '✗';
    const version = result.version ?? 'not found';
    lines.push(`  ${status} ${result.tool}: ${version}`);
    if (result.error) {
      lines.push(`    Error: ${result.error}`);
    }
    if (result.available && !result.meetsMinVersion) {
      lines.push(`    Warning: version does not meet minimum requirement`);
    }
  }

  lines.push('');
  lines.push(report.allPassed ? 'All checks passed.' : 'Some checks failed. Run `direnv allow` and ensure flake.nix is up to date.');

  return lines.join('\n');
}
