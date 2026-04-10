// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 51-1
// @task-title: GitHub Actions で自動生成
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/plan/implementation_plan.md (sprint 51)
// Assembles the full release workflow definition from per-platform job specs.
// Run `npx ts-node generate.ts` to emit .github/workflows/release.yml

import type { Workflow } from './types';
import { linuxBuildJob } from './workflows/linux';
import { macosBuildJob } from './workflows/macos';

export const releaseWorkflow: Workflow = {
  name: 'Release',

  on: {
    push: {
      tags: ['v*'],
    },
    workflow_dispatch: {},
  },

  jobs: {
    'build-linux': linuxBuildJob,
    'build-macos': macosBuildJob,
  },
};
