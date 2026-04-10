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
// @description: CLI entry point — validates development environment after `direnv allow`

import { checkEnvironment, validatePlatform, formatReport } from './check-env';

function main(): void {
  const platformCheck = validatePlatform();
  if (!platformCheck.valid) {
    console.warn(
      `Warning: platform '${platformCheck.platform}' is not a supported target. ` +
      `PromptNotes targets linux and macos only.`,
    );
  }

  const report = checkEnvironment();
  console.log(formatReport(report));

  if (!report.allPassed) {
    console.error(
      '\nDevelopment environment is incomplete. ' +
      'Ensure you have run `direnv allow` in the project root ' +
      'and that flake.nix provides all required dependencies.',
    );
    process.exit(1);
  }

  process.exit(0);
}

main();
