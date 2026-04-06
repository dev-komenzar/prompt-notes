// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 59-1
// @task-title: Linux
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// Generated from Sprint 59 — Task 59-1 (Linux Flatpak パッケージ作成)
// CoDD trace: plan:implementation_plan > detail:component_architecture > detail:storage_fileformat
// Module: ui_foundation | Platform: linux
// Convention: module:shell, framework:tauri — IPC boundary enforced; no direct FS from frontend

import type { FlatpakPermission } from './types';

/**
 * Core permissions required by PromptNotes in the Flatpak sandbox.
 *
 * Permissions are kept minimal following the principle of least privilege:
 * - ipc + fallback-x11 + wayland: Required for GUI display (GTK WebKitGTK)
 * - dri: GPU acceleration for WebView rendering
 * - xdg-documents: User may configure notes dir inside ~/Documents
 * - host filesystem read/write for user-configured notes directories
 * - dbus talk for desktop integration (notifications, file dialogs via XDG portal)
 */
export const REQUIRED_PERMISSIONS: readonly FlatpakPermission[] = [
  { type: 'share', value: 'ipc' },
  { type: 'socket', value: 'fallback-x11' },
  { type: 'socket', value: 'wayland' },
  { type: 'device', value: 'dri' },
  { type: 'filesystem', value: 'xdg-data/promptnotes:create' },
  { type: 'filesystem', value: 'home:rw' },
  { type: 'talk-name', value: 'org.freedesktop.portal.Desktop' },
  { type: 'talk-name', value: 'org.freedesktop.portal.FileChooser' },
  { type: 'talk-name', value: 'org.freedesktop.Notifications' },
  { type: 'system-talk-name', value: 'org.freedesktop.login1' },
];

/**
 * Convert FlatpakPermission entries to finish-args format strings.
 * finish-args use the format: --<type>=<value>
 */
export function permissionToFinishArg(permission: FlatpakPermission): string {
  return `--${permission.type}=${permission.value}`;
}

/**
 * Build the complete finish-args array for the Flatpak manifest.
 * Includes all required permissions for PromptNotes to function
 * correctly within the Flatpak sandbox.
 */
export function buildFlatpakFinishArgs(): readonly string[] {
  return REQUIRED_PERMISSIONS.map(permissionToFinishArg);
}

/**
 * Validate that a set of finish-args contains all required permissions.
 * Returns missing permissions if any.
 */
export function validateFinishArgs(
  finishArgs: readonly string[]
): { valid: boolean; missing: readonly string[] } {
  const required = buildFlatpakFinishArgs();
  const argSet = new Set(finishArgs);
  const missing = required.filter((arg) => !argSet.has(arg));

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Check if a given filesystem path is accessible within the declared
 * Flatpak permissions. This is a client-side heuristic; actual access
 * control is enforced by the Flatpak sandbox at the OS level.
 */
export function isPathAllowedByPermissions(
  path: string,
  permissions: readonly FlatpakPermission[]
): boolean {
  const fsPermissions = permissions.filter((p) => p.type === 'filesystem');

  for (const perm of fsPermissions) {
    const permPath = perm.value.split(':')[0];

    if (permPath === 'home' || permPath === 'host') {
      return true;
    }

    if (permPath.startsWith('xdg-')) {
      const xdgDir = permPath.replace('xdg-', '');
      if (path.includes(`/.local/share/${xdgDir}`) || path.includes(`/${xdgDir}/`)) {
        return true;
      }
    }

    if (path.startsWith(permPath) || path === permPath) {
      return true;
    }
  }

  return false;
}
