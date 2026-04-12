// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 48-1
// @task-title: `module:settings` + `module:shell`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd-trace: detail:component_architecture § 4.1, § 4.7
// Tauri v2 capability configuration reference for Sprint 48 verification.
//
// The actual JSON files must be placed at:
//   src-tauri/capabilities/default.json      (app-level capability)
//   src-tauri/capabilities/dialog.json       (dialog plugin capability)
//
// Sprint 48 verification assertion:
//   - @tauri-apps/plugin-dialog `open({ directory: true })` resolves successfully.
//   - @tauri-apps/plugin-fs is NOT in the capability set and therefore NOT importable.
//   - All note CRUD and config persistence go exclusively through invoke() IPC commands.

/**
 * Represents the Tauri v2 capability JSON for the main window.
 * Place as src-tauri/capabilities/default.json.
 */
export const DEFAULT_CAPABILITY = {
  $schema: '../gen/schemas/desktop-schema.json',
  identifier: 'default',
  description: 'Default capability for PromptNotes main window',
  windows: ['main'],
  permissions: [
    'core:default',
    // dialog:open is permitted; dialog:save is not needed.
    'dialog:allow-open',
    // fs plugin is intentionally omitted — enforces IPC-only file access.
  ],
} as const;

/**
 * Type guard: asserts that a given permission string does NOT grant fs access.
 * Used in tests to verify Sprint 48 constraints at the type level.
 */
type FsPermission = `fs:${string}` | `path:${string}`;

export function assertNoFsPermission(
  permissions: readonly string[],
): asserts permissions is Exclude<(typeof permissions)[number], FsPermission>[] {
  for (const p of permissions) {
    if (p.startsWith('fs:') || p.startsWith('path:')) {
      throw new Error(
        `[shell-boundary] fs/path plugin permission detected: "${p}". ` +
          'Frontend direct filesystem access is prohibited (module:shell RBC).',
      );
    }
  }
}

// Verify the default capability at module load time (catches misconfigurations early).
assertNoFsPermission(DEFAULT_CAPABILITY.permissions);
