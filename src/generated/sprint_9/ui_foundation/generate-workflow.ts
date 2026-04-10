// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 9-1
// @task-title: Linux と macOS の両ターゲットで `cargo build` + `npm run build` が通る
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/plan/implementation_plan.md
// @sprint: 9
// @task: 9-1
// @deliverable: Linux と macOS の両ターゲットで cargo build + npm run build が通る

/**
 * Script entry point for generating .github/workflows/build.yml.
 *
 * Usage:
 *   npx ts-node src/generated/sprint_9/ui_foundation/generate-workflow.ts
 *
 * This writes the canonical CI workflow YAML to stdout.
 * Redirect to .github/workflows/build.yml to persist.
 */

import { generateWorkflowDefinition, serializeWorkflowToYaml } from './build-workflow';
import { validateCiCoverage } from './build-validation';
import { SUPPORTED_PLATFORMS } from './ci-config';

function main(): void {
  const coverage = validateCiCoverage([...SUPPORTED_PLATFORMS]);
  if (!coverage.valid) {
    for (const err of coverage.errors) {
      process.stderr.write(`ERROR: ${err}\n`);
    }
    process.exit(1);
  }

  const definition = generateWorkflowDefinition();
  const yaml = serializeWorkflowToYaml(definition);

  process.stdout.write(yaml);
}

main();
