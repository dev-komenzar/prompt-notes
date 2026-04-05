// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 4-1
// @task-title: `module:shell`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Trace: sprint:4 task:4-1 module:shell file:capability.ts
// Tauri v2 capability definition for PromptNotes.
// Exported as a typed object for use in build tooling / CI validation.
// The corresponding JSON is written to src-tauri/capabilities/main.json.
//
// SECURITY: WebView direct filesystem access is BLOCKED.
// All file operations route through #[tauri::command] IPC handlers in Rust.

/**
 * Tauri v2 capability schema (subset relevant to PromptNotes).
 */
export interface TauriCapability {
  readonly identifier: string;
  readonly description: string;
  readonly windows: readonly string[];
  readonly permissions: readonly string[];
}

/**
 * The main (and only) capability for the PromptNotes WebView window.
 *
 * Permitted:
 *   - core:default        → basic IPC invoke for #[tauri::command] handlers
 *   - dialog:allow-open   → native directory picker (module:settings)
 *
 * Explicitly EXCLUDED (blocks direct WebView filesystem access):
 *   - fs:*                → no direct file read/write/stat/exists/mkdir/remove
 *   - shell:*             → no command/script execution from WebView
 *   - process:*           → no process spawn/exit from WebView
 *   - http:*              → no outbound HTTP (no cloud sync, no AI calls)
 */
export const MAIN_CAPABILITY: TauriCapability = {
  identifier: 'promptnotes-main',
  description:
    'Main capability for PromptNotes. Grants IPC invoke and dialog access only. ' +
    'Filesystem, shell, process, and HTTP access from the WebView are denied.',
  windows: ['main'],
  permissions: [
    'core:default',
    'dialog:allow-open',
  ],
} as const;

/**
 * Exhaustive list of Tauri v2 plugin permission prefixes that MUST NOT
 * appear in any capability granting access to the main window.
 * Used by CI / build validation to assert the security boundary.
 */
export const DENIED_PERMISSION_PREFIXES: readonly string[] = [
  'fs:',
  'shell:',
  'process:',
  'http:',
  'global-shortcut:',
  'clipboard-manager:',
  'notification:',
] as const;

/**
 * Validate that a capability does not contain any denied permission prefixes.
 * Intended for CI pipeline integration.
 *
 * @returns Array of violation descriptions (empty = pass)
 */
export function validateCapability(
  capability: TauriCapability,
): string[] {
  const violations: string[] = [];

  for (const perm of capability.permissions) {
    for (const denied of DENIED_PERMISSION_PREFIXES) {
      if (perm.startsWith(denied)) {
        violations.push(
          `Permission "${perm}" is denied. ` +
            `Prefix "${denied}" violates the IPC-only filesystem access policy.`,
        );
      }
    }
  }

  return violations;
}
