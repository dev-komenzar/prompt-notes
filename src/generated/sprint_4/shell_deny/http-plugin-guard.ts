// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 4-2
// @task-title: `shell` プラグイン `deny`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// trace: sprint_4 > task_4-2 > shell_deny > http-plugin-guard
// description: Runtime guard that intercepts and blocks any attempt to use
// the Tauri HTTP plugin from the frontend. PromptNotes performs zero network
// communication (privacy constraint). Complements the network-guard from task 4-1
// which blocks fetch/XMLHttpRequest; this module blocks the Tauri-specific HTTP plugin.

export interface HttpPluginViolation {
  readonly timestamp: string;
  readonly method: string;
  readonly url: string;
  readonly blocked: true;
}

const violations: HttpPluginViolation[] = [];
let installed = false;

const BLOCKED_HTTP_METHODS = [
  'fetch',
  'request',
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'head',
  'options',
] as const;

function recordViolation(method: string, url: string): void {
  violations.push({
    timestamp: new Date().toISOString(),
    method,
    url,
    blocked: true,
  });
}

function blockTauriHttpPlugin(): void {
  const win = globalThis as unknown as Record<string, unknown>;
  const tauri = win.__TAURI__ as Record<string, unknown> | undefined;
  if (!tauri) return;

  const httpModule = tauri.http as Record<string, unknown> | undefined;
  if (httpModule) {
    for (const method of BLOCKED_HTTP_METHODS) {
      if (method in httpModule) {
        Object.defineProperty(httpModule, method, {
          value: (url: unknown, ..._args: unknown[]) => {
            const urlStr = String(url ?? '<unknown>');
            recordViolation(`http.${method}`, urlStr);
            return Promise.reject(
              new Error(
                `[PromptNotes] http.${method}() is denied. ` +
                'Network communication is blocked by security policy. ' +
                'PromptNotes performs zero network requests.'
              )
            );
          },
          writable: false,
          configurable: false,
        });
      }
    }
  }
}

function blockHttpPluginInvoke(): void {
  const win = globalThis as unknown as Record<string, unknown>;
  const tauri = win.__TAURI__ as Record<string, unknown> | undefined;
  if (!tauri) return;

  const currentInvoke = tauri.invoke as ((...args: unknown[]) => Promise<unknown>) | undefined;
  if (typeof currentInvoke !== 'function') return;

  const wrappedInvoke = (cmd: string, ...rest: unknown[]) => {
    const httpPrefixes = ['plugin:http|', 'plugin:http-'];
    for (const prefix of httpPrefixes) {
      if (typeof cmd === 'string' && cmd.startsWith(prefix)) {
        recordViolation(`invoke(${cmd})`, rest.length > 0 ? String(rest[0]) : '<no-args>');
        return Promise.reject(
          new Error(
            `[PromptNotes] HTTP plugin command "${cmd}" is denied. ` +
            'Network communication is blocked by security policy.'
          )
        );
      }
    }
    return currentInvoke(cmd, ...rest);
  };

  Object.defineProperty(tauri, 'invoke', {
    value: wrappedInvoke,
    writable: false,
    configurable: false,
  });
}

export function installHttpPluginGuard(): void {
  if (installed) return;
  blockTauriHttpPlugin();
  blockHttpPluginInvoke();
  installed = true;
}

export function isHttpPluginGuardInstalled(): boolean {
  return installed;
}

export function getHttpPluginViolations(): ReadonlyArray<HttpPluginViolation> {
  return [...violations];
}

export function clearHttpPluginViolations(): void {
  violations.length = 0;
}
