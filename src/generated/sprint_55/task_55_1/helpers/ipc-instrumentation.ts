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

// trace: sprint_55/task_55_1 — CI E2E テスト構築 — IPC 計装スクリプト (WebView注入用)

/**
 * Returns JavaScript code to inject into the WebView for IPC call instrumentation.
 * When PROMPTNOTES_E2E=1, the app should inject this to enable IPC call logging.
 *
 * This instruments the Tauri invoke function to log all IPC calls
 * for E2E test assertions (command name, arguments, timing).
 */
export function getIPCInstrumentationScript(): string {
  return `
(function() {
  if (typeof window.__PROMPTNOTES_IPC_LOG !== 'undefined') return;

  window.__PROMPTNOTES_IPC_LOG = [];

  // Intercept Tauri's invoke function
  const originalInvoke = window.__TAURI__?.invoke
    ?? window.__TAURI_INTERNALS__?.invoke;

  if (!originalInvoke) {
    console.warn('[E2E] Tauri invoke not found — IPC instrumentation skipped');
    return;
  }

  const instrumentedInvoke = function(command, args) {
    const entry = {
      command: command,
      args: args ?? {},
      timestamp: Date.now(),
    };
    window.__PROMPTNOTES_IPC_LOG.push(entry);
    console.log('[E2E IPC]', command, JSON.stringify(args ?? {}));
    return originalInvoke.call(this, command, args);
  };

  if (window.__TAURI__?.invoke) {
    window.__TAURI__.invoke = instrumentedInvoke;
  }
  if (window.__TAURI_INTERNALS__?.invoke) {
    window.__TAURI_INTERNALS__.invoke = instrumentedInvoke;
  }

  console.log('[E2E] IPC instrumentation active');
})();
`;
}

/**
 * TypeScript interface for the IPC log entries stored in window.__PROMPTNOTES_IPC_LOG.
 */
export interface IPCLogEntry {
  command: string;
  args: Record<string, unknown>;
  timestamp: number;
}

/**
 * Returns JavaScript code to reset the IPC log.
 */
export function getIPCLogResetScript(): string {
  return `window.__PROMPTNOTES_IPC_LOG = [];`;
}

/**
 * Returns JavaScript code to retrieve and return the IPC log.
 */
export function getIPCLogRetrievalScript(): string {
  return `JSON.parse(JSON.stringify(window.__PROMPTNOTES_IPC_LOG || []))`;
}
