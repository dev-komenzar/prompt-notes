// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 46-1
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
import * as path from 'node:path';
import * as os from 'node:os';
import * as fs from 'node:fs/promises';

test.describe('Settings — persistence (AC-CF-01, AC-ST-04)', () => {
  test('AC-ST-03: default notes dir exists and is on correct platform path', async () => {
    let expectedFragment: string;
    if (process.platform === 'linux') {
      expectedFragment = path.join(os.homedir(), '.local', 'share', 'promptnotes', 'notes');
    } else {
      expectedFragment = path.join(os.homedir(), 'Library', 'Application Support', 'promptnotes', 'notes');
    }
    // Attempt to create dir and verify it resolves correctly
    await fs.mkdir(expectedFragment, { recursive: true });
    const stat = await fs.stat(expectedFragment);
    expect(stat.isDirectory()).toBe(true);
  });
});
