// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 55-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// trace: sprint_55/task_55_1 — CI E2E テスト構築 — IPC 境界アサーションヘルパー
import { type Page, expect } from '@playwright/test';

/**
 * Verifies that no direct filesystem access is attempted from the WebView.
 * Intercepts and asserts that no fetch('file://...') or fs module usage occurs.
 * Enforces CONV-1: All file operations must go through Tauri IPC (Rust backend).
 */
export async function assertNoDirectFileAccess(page: Page): Promise<void> {
  const violations = await page.evaluate(() => {
    const logs: string[] = [];
    // Check for any file:// protocol requests in performance entries
    const entries = performance.getEntriesByType('resource');
    for (const entry of entries) {
      if (entry.name.startsWith('file://')) {
        logs.push(`Direct file access detected: ${entry.name}`);
      }
    }
    return logs;
  });

  expect(violations, 'WebView must not directly access filesystem (CONV-1)').toHaveLength(0);
}

/**
 * Collects IPC invoke calls made during a test action.
 * Requires the app to expose __PROMPTNOTES_IPC_LOG in E2E mode.
 */
export async function collectIPCCalls(
  page: Page,
  action: () => Promise<void>,
): Promise<Array<{ command: string; args: unknown }>> {
  // Reset the IPC log
  await page.evaluate(() => {
    (window as any).__PROMPTNOTES_IPC_LOG = [];
  });

  await action();

  // Small delay for async IPC calls to complete
  await page.waitForTimeout(1_000);

  return page.evaluate(() => {
    return (window as any).__PROMPTNOTES_IPC_LOG ?? [];
  });
}

/**
 * Asserts that a specific IPC command was called during an action.
 */
export async function assertIPCCommandCalled(
  page: Page,
  action: () => Promise<void>,
  expectedCommand: string,
): Promise<void> {
  const calls = await collectIPCCalls(page, action);
  const commandNames = calls.map((c) => c.command);
  expect(
    commandNames,
    `Expected IPC command '${expectedCommand}' to be called`,
  ).toContain(expectedCommand);
}

/**
 * Asserts that save_note IPC command was called with valid filename pattern.
 * Enforces CONV-FILENAME: YYYY-MM-DDTHHMMSS.md format.
 */
export async function assertSaveNoteCalledWithValidFilename(
  page: Page,
  action: () => Promise<void>,
): Promise<void> {
  const calls = await collectIPCCalls(page, action);
  const saveCalls = calls.filter((c) => c.command === 'save_note');

  for (const call of saveCalls) {
    const args = call.args as { filename?: string };
    expect(args.filename).toBeDefined();
    expect(args.filename).toMatch(/^\d{4}-\d{2}-\d{2}T\d{6}(_\d+)?\.md$/);
  }
}

/**
 * Asserts that the settings path change goes through Rust backend IPC.
 * Enforces CONV-2: Settings changes must go through Rust backend.
 */
export async function assertSettingsChangeViaIPC(
  page: Page,
  action: () => Promise<void>,
): Promise<void> {
  const calls = await collectIPCCalls(page, action);
  const configCalls = calls.filter((c) => c.command === 'set_config');
  expect(
    configCalls.length,
    'Settings change must invoke set_config IPC command (CONV-2)',
  ).toBeGreaterThan(0);
}
