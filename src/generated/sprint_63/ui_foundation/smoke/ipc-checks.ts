// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 63-1
// @task-title: Linux, macOS
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated Sprint 63 — Task 63-1 — Linux, macOS smoke test UI foundation
// trace: plan:implementation_plan > detail:component_architecture — CONV-1 IPC boundary

import type { SmokeCheckResult } from './smoke-types';
import { runCheck, assert, assertDefined } from './check-helpers';
import { getConfig } from '../ipc-client';

/**
 * Smoke checks that verify the Tauri IPC boundary is operational.
 * These checks confirm that the Rust backend is reachable and responding
 * to IPC commands — essential for ALL distribution formats.
 */
export async function runIpcChecks(): Promise<SmokeCheckResult[]> {
  const results: SmokeCheckResult[] = [];

  // IPC-01: Basic IPC connectivity — get_config must respond
  results.push(
    await runCheck(
      'IPC-01',
      'ipc',
      'Tauri IPC invoke is operational (get_config responds)',
      async () => {
        const config = await getConfig();
        assertDefined(config, 'config');
        assert(typeof config.notes_dir === 'string', 'config.notes_dir must be a string');
        assert(config.notes_dir.length > 0, 'config.notes_dir must not be empty');
      },
    ),
  );

  return results;
}
