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

// trace: sprint_4 > task_4-2 > shell_deny > clipboard-manager-deny
// description: Ensures the Tauri clipboard-manager plugin is not used.
// Clipboard operations use the browser-standard Clipboard API
// (navigator.clipboard.writeText) instead, as specified in the design.
// Re-exports the clipboard adapter from task 4-1 for convenience.

export { writeTextToClipboard, extractBodyFromDocument, copyNoteBodyToClipboard } from '../fs_deny/clipboard-api-adapter';
export type { ClipboardWriteResult } from '../fs_deny/clipboard-api-adapter';

let installed = false;

export interface ClipboardManagerViolation {
  readonly timestamp: string;
  readonly method: string;
  readonly blocked: true;
}

const violations: ClipboardManagerViolation[] = [];

function recordViolation(method: string): void {
  violations.push({
    timestamp: new Date().toISOString(),
    method,
    blocked: true,
  });
}

export function installClipboardManagerDeny(): void {
  if (installed) return;

  const win = globalThis as unknown as Record<string, unknown>;
  const tauri = win.__TAURI__ as Record<string, unknown> | undefined;
  if (!tauri) return;

  const clipboardModule = tauri.clipboardManager as Record<string, unknown> | undefined;
  if (clipboardModule) {
    const methods = ['writeText', 'readText'] as const;
    for (const method of methods) {
      if (method in clipboardModule) {
        Object.defineProperty(clipboardModule, method, {
          value: (..._args: unknown[]) => {
            recordViolation(`clipboardManager.${method}`);
            throw new Error(
              `[PromptNotes] clipboardManager.${method}() is denied. ` +
              'Use navigator.clipboard (browser standard Clipboard API) instead. ' +
              'The Tauri clipboard-manager plugin is not used in this application.'
            );
          },
          writable: false,
          configurable: false,
        });
      }
    }
  }

  installed = true;
}

export function isClipboardManagerDenyInstalled(): boolean {
  return installed;
}

export function getClipboardManagerViolations(): ReadonlyArray<ClipboardManagerViolation> {
  return [...violations];
}

export function clearClipboardManagerViolations(): void {
  violations.length = 0;
}
