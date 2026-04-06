// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 69-1
// @task-title: M1（M1-02）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated sprint:69 task:69-1 module:m1_m1_02
// CoDD trace: detail:component_architecture §4.1, governance:adr_tech_stack (ADR-001)
// Tauri v2 — Capability/permission model type definitions
//
// In Tauri v2, security permissions are defined in src-tauri/capabilities/*.json
// This module provides TypeScript types that mirror the capability structure
// for documentation, validation, and tooling purposes.

/**
 * Tauri v2 capability file structure.
 * Placed in src-tauri/capabilities/default.json
 *
 * Replaces Tauri v1's tauri.conf.json > tauri > allowlist
 */
export interface TauriCapability {
  /** Unique identifier for this capability set */
  readonly identifier: string;
  /** Human-readable description */
  readonly description: string;
  /** Windows this capability applies to (["main"] for single-window app) */
  readonly windows: readonly string[];
  /** List of permission strings granted */
  readonly permissions: readonly string[];
}

/**
 * PromptNotes default capability definition.
 *
 * Security model (CONV-1 enforcement):
 *   - NO "fs:default" permission → WebView cannot access filesystem directly
 *   - NO "http:default" permission → No network access (no cloud sync, no AI calls)
 *   - IPC commands (create_note, save_note, etc.) are implicitly permitted
 *     because they are registered via #[tauri::command] and invoked by name.
 *   - Plugin permissions (dialog, os) are explicitly listed.
 *
 * This object can be serialized to JSON and placed at:
 *   src-tauri/capabilities/default.json
 */
export const DEFAULT_CAPABILITY: TauriCapability = {
  identifier: 'default',
  description: 'PromptNotes default capability — IPC commands + required plugins only',
  windows: ['main'],
  permissions: [
    // Core IPC invoke is allowed by default in Tauri v2 for registered commands.
    // Plugin capabilities must be explicitly granted:
    'dialog:default',       // module:settings directory picker
    'dialog:allow-open',    // Specifically allow open-directory dialog
    'os:default',           // Platform detection (linux/macos)
    // Explicitly NOT included:
    // - "fs:default"              (CONV-1: no direct fs access)
    // - "http:default"            (no network, CONV-3)
    // - "clipboard-manager:*"     (using navigator.clipboard instead)
    // - "sql:*"                   (no DB, CONV-3)
  ],
} as const;

/**
 * Validate that a capability set does not include prohibited permissions.
 * Use in CI/build pipeline to enforce CONV-1, CONV-3 constraints.
 */
export function validateCapabilityPermissions(
  permissions: readonly string[]
): { valid: boolean; violations: string[] } {
  const PROHIBITED_PATTERNS = [
    { pattern: /^fs:/,   reason: 'CONV-1: Direct filesystem access from WebView is prohibited' },
    { pattern: /^http:/,  reason: 'CONV-3: No network access (cloud sync / AI calls prohibited)' },
    { pattern: /^sql:/,   reason: 'CONV-3: No database usage (local .md files only)' },
    { pattern: /^shell:/, reason: 'Security: Shell command execution from WebView is prohibited' },
  ];

  const violations: string[] = [];

  for (const perm of permissions) {
    for (const { pattern, reason } of PROHIBITED_PATTERNS) {
      if (pattern.test(perm)) {
        violations.push(`Permission "${perm}" is prohibited: ${reason}`);
      }
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}
