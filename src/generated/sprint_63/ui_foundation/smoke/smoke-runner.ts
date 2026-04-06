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
// trace: plan:implementation_plan — Sprint 63: 全配布形式でのスモークテスト

import type { SmokeReport, SmokeCheckResult, SmokeRunConfig } from './smoke-types';
import { runIpcChecks } from './ipc-checks';
import { runStorageChecks } from './storage-checks';
import { runEditorChecks } from './editor-checks';
import { runGridChecks } from './grid-checks';
import { runSettingsChecks } from './settings-checks';
import { runPlatformChecks } from './platform-checks';

/**
 * Orchestrates a full smoke test run across all modules.
 * This is the top-level entry point invoked after app launch to verify
 * that a specific distribution format on a specific platform is functional.
 *
 * Execution order is intentional:
 *   1. Platform checks — verify we're on the right OS and Tauri is present
 *   2. IPC checks — verify Rust backend is reachable
 *   3. Storage checks — verify CRUD through IPC
 *   4. Editor checks — verify DOM-level editor constraints
 *   5. Grid checks — verify grid IPC and DOM
 *   6. Settings checks — verify config read
 */
export async function runSmokeTests(config: SmokeRunConfig): Promise<SmokeReport> {
  const startTime = performance.now();
  const allChecks: SmokeCheckResult[] = [];

  // Phase 1: Platform & Distribution
  const platformResults = await runPlatformChecks(config.platform, config.distributionFormat);
  allChecks.push(...platformResults);

  // Phase 2: IPC Connectivity
  const ipcResults = await runIpcChecks();
  allChecks.push(...ipcResults);

  // Bail early if IPC is non-functional — subsequent checks would all fail
  const ipcOperational = ipcResults.every((r) => r.passed);
  if (!ipcOperational) {
    return buildReport(config, allChecks, startTime);
  }

  // Phase 3: Storage CRUD
  const storageResults = await runStorageChecks();
  allChecks.push(...storageResults);

  // Phase 4: Editor DOM
  const editorResults = await runEditorChecks();
  allChecks.push(...editorResults);

  // Phase 5: Grid IPC + DOM
  const gridResults = await runGridChecks();
  allChecks.push(...gridResults);

  // Phase 6: Settings
  const settingsResults = await runSettingsChecks(config.platform);
  allChecks.push(...settingsResults);

  return buildReport(config, allChecks, startTime);
}

function buildReport(
  config: SmokeRunConfig,
  checks: SmokeCheckResult[],
  startTime: number,
): SmokeReport {
  const totalPassed = checks.filter((c) => c.passed).length;
  const totalFailed = checks.filter((c) => !c.passed).length;

  // Determine if any release-blocking check failed
  const releaseBlockingIds = new Set([
    // RBC-1: Cmd+N / Ctrl+N, copy button
    'ED-04',
    // RBC-2: CodeMirror 6, no title, no preview
    'ED-01', 'ED-02', 'ED-03',
    // RBC-3: Filename pattern, auto-save
    'ST-01', 'ST-02',
    // RBC-4: Grid filters, search
    'GR-01', 'GR-02', 'GR-03', 'GR-04',
    // Platform: Tauri present, correct OS
    'PL-01', 'PL-02',
    // IPC: must be operational
    'IPC-01',
  ]);

  const releaseBlocking = checks.some(
    (c) => !c.passed && releaseBlockingIds.has(c.id),
  );

  return {
    platform: config.platform,
    distributionFormat: config.distributionFormat,
    timestamp: new Date().toISOString(),
    checks,
    totalPassed,
    totalFailed,
    totalDurationMs: performance.now() - startTime,
    releaseBlocking,
  };
}
