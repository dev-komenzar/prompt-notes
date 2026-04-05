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
// Design refs: design:system-design, governance:adr_tech_stack
// Entry point for CI pipeline commands

import { resolve } from "path";
import {
  runCIPipeline,
  formatPipelineResult,
  createDefaultPipelineConfig,
} from "./ci-pipeline";
import { runEnvironmentCheck, formatEnvironmentReport } from "./env-check";
import { runAllReleaseBlockerChecks } from "./release-blocker-check";
import {
  validateTauriConf,
  validateCargoToml,
  formatValidationResult,
} from "./tauri-conf-validator";
import {
  generateCIWorkflow,
  generateReleaseWorkflow,
  serializeWorkflow,
} from "./github-actions-generator";

type Command =
  | "pipeline"
  | "env-check"
  | "release-check"
  | "validate-config"
  | "generate-workflow";

function getProjectRoot(): string {
  return process.env.PROJECT_ROOT || resolve(process.cwd());
}

function getVersion(): string {
  return process.env.APP_VERSION || "0.0.0-dev";
}

function usage(): string {
  return `PromptNotes CI Pipeline CLI

Usage: ts-node cli.ts <command>

Commands:
  pipeline          Run full CI pipeline (env check → release blockers → tests → build)
  env-check         Check CI environment prerequisites
  release-check     Run release-blocking constraint checks
  validate-config   Validate Tauri and Cargo configuration
  generate-workflow Print GitHub Actions workflow definitions

Environment:
  PROJECT_ROOT      Project root directory (default: cwd)
  APP_VERSION       Application version (default: 0.0.0-dev)
  CI                Set to "true" for verbose CI output
`;
}

async function runCommand(command: Command): Promise<number> {
  const projectRoot = getProjectRoot();

  switch (command) {
    case "pipeline": {
      const config = createDefaultPipelineConfig(projectRoot, getVersion());
      const result = await runCIPipeline({ ...config, verbose: true });
      process.stdout.write(formatPipelineResult(result) + "\n");
      return result.overallSuccess ? 0 : 1;
    }

    case "env-check": {
      const report = runEnvironmentCheck(projectRoot);
      process.stdout.write(formatEnvironmentReport(report) + "\n");
      return report.allRequiredAvailable ? 0 : 1;
    }

    case "release-check": {
      const { passed, results } = await runAllReleaseBlockerChecks(projectRoot);
      for (const r of results) {
        const icon = r.passed ? "✓" : "✗";
        process.stdout.write(`${icon} ${r.id}: ${r.message}\n`);
      }
      process.stdout.write(
        `\n${passed ? "✓ All release blockers passed." : "✗ Release blocker violations detected."}\n`
      );
      return passed ? 0 : 1;
    }

    case "validate-config": {
      const tauriResult = validateTauriConf(projectRoot);
      process.stdout.write(
        formatValidationResult("tauri.conf.json", tauriResult) + "\n\n"
      );

      const cargoResult = validateCargoToml(projectRoot);
      process.stdout.write(
        formatValidationResult("Cargo.toml", cargoResult) + "\n"
      );

      return tauriResult.valid && cargoResult.valid ? 0 : 1;
    }

    case "generate-workflow": {
      process.stdout.write("# CI Workflow\n");
      process.stdout.write(serializeWorkflow(generateCIWorkflow()) + "\n\n");
      process.stdout.write("# Release Workflow\n");
      process.stdout.write(serializeWorkflow(generateReleaseWorkflow()) + "\n");
      return 0;
    }

    default:
      process.stderr.write(`Unknown command: ${command}\n\n`);
      process.stderr.write(usage());
      return 2;
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    process.stdout.write(usage());
    process.exit(0);
  }

  const command = args[0] as Command;
  const validCommands: Command[] = [
    "pipeline",
    "env-check",
    "release-check",
    "validate-config",
    "generate-workflow",
  ];

  if (!validCommands.includes(command)) {
    process.stderr.write(`Unknown command: ${command}\n\n`);
    process.stderr.write(usage());
    process.exit(2);
  }

  try {
    const exitCode = await runCommand(command);
    process.exit(exitCode);
  } catch (err) {
    process.stderr.write(`Fatal error: ${(err as Error).message}\n`);
    process.exit(1);
  }
}

main();
