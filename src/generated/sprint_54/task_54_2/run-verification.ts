// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 54-2
// @task-title: 動作確認済み
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/plan/implementation_plan.md
// @generated-by: codd implement --sprint 54

import { runDmgWorkflowVerification } from './verify-dmg-workflow';

const result = runDmgWorkflowVerification();

for (const c of result.checks) {
  const icon = c.passed ? '✓' : '✗';
  console.log(`  ${icon} ${c.name}`);
  if (!c.passed) {
    console.log(`      → ${c.detail}`);
  }
}

console.log('');
console.log(result.passed ? `PASS: ${result.summary}` : `FAIL: ${result.summary}`);

if (!result.passed) {
  process.exit(1);
}
