// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 37-1
// @task-title: 完了条件
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/acceptance_criteria.md
// @generated-by: codd propagate
import { test, expect } from '@playwright/test';
import { waitForApp } from './helpers/app-launch';
import { getDefaultNotesDir } from './helpers/test-data';
import * as path from 'path';
import * as os from 'os';

test.beforeAll(async () => {
  await waitForApp();
});

test.describe('AC-CF-01 / AC-ST-03: settings and default directory', () => {
  test('default notes directory is platform-appropriate', () => {
    const dir = getDefaultNotesDir();
    const home = os.homedir();
    if (process.platform === 'linux') {
      expect(dir).toContain(path.join(home, '.local', 'share', 'promptnotes', 'notes'));
    } else if (process.platform === 'darwin') {
      expect(dir).toContain(path.join(home, 'Library', 'Application Support', 'promptnotes', 'notes'));
    }
  });
});
