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

// trace: sprint_4 > task_4-2 > shell_deny > shell-execution-guard
// description: Runtime guard that intercepts and blocks any attempt to execute
// shell commands or spawn external processes from the frontend context.
// Enforces NNC-1: all operations must go through Tauri IPC #[tauri::command] handlers.

import type { PluginName } from '../fs_deny/tauri-plugin-policy';

export interface ShellViolation {
  readonly timestamp: string;
  readonly method: string;
  readonly args: ReadonlyArray<string>;
  readonly blocked: true;
}

const violations: ShellViolation[] = [];
let installed = false;

const BLOCKED_SHELL_METHODS = [
  'open',
  'execute',
  'Command',
  'Child',
  'spawn',
] as const;

function recordViolation(method: string, args: ReadonlyArray<string>): void {
  violations.push({
    timestamp: new Date().toISOString(),
    method,
    args,
    blocked: true,
  });
}

function blockTauriShellPlugin(): void {
  const win = globalThis as unknown as Record<string, unknown>;
  const tauri = win.__TAURI__ as Record<string, unknown> | undefined;
  if (!tauri) return;

  const shellModule = tauri.shell as Record<string, unknown> | undefined;
  if (shellModule) {
    for (const method of BLOCKED_SHELL_METHODS) {
      if (method in shellModule) {
        Object.defineProperty(shellModule, method, {
          value: (...args: unknown[]) => {
            const strArgs = args.map(String);
            recordViolation(`shell.${method}`, strArgs);
            throw new Error(
              `[PromptNotes] shell.${method}() is denied. ` +
              'External process execution is blocked by security policy. ' +
              'All operations must use Tauri IPC #[tauri::command] handlers.'
            );
          },
          writable: false,
          configurable: false,
        });
      }
    }
  }
}

function blockDynamicImportShell(): void {
  const win = globalThis as unknown as Record<string, unknown>;
  const tauri = win.__TAURI__ as Record<string, unknown> | undefined;
  if (!tauri) return;

  const originalInvoke = tauri.invoke as ((...args: unknown[]) => Promise<unknown>) | undefined;
  if (typeof originalInvoke !== 'function') return;

  Object.defineProperty(tauri, 'invoke', {
    value: (cmd: string, ...rest: unknown[]) => {
      const shellCommandPrefixes = ['plugin:shell|', 'plugin:shell-'];
      for (const prefix of shellCommandPrefixes) {
        if (typeof cmd === 'string' && cmd.startsWith(prefix)) {
          recordViolation(`invoke(${cmd})`, rest.map(String));
          return Promise.reject(
            new Error(
              `[PromptNotes] Shell plugin command "${cmd}" is denied. ` +
              'External process execution is blocked by security policy.'
            )
          );
        }
      }
      return originalInvoke(cmd, ...rest);
    },
    writable: false,
    configurable: false,
  });
}

export function installShellExecutionGuard(): void {
  if (installed) return;
  blockTauriShellPlugin();
  blockDynamicImportShell();
  installed = true;
}

export function isShellExecutionGuardInstalled(): boolean {
  return installed;
}

export function getShellViolations(): ReadonlyArray<ShellViolation> {
  return [...violations];
}

export function clearShellViolations(): void {
  violations.length = 0;
}
