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

// trace: sprint_4 > task_4-2 > shell_deny > install-all-guards
// description: Single entry point to install all security guards for denied plugins
// (fs, shell, http, clipboard-manager) and the network/IPC boundary guards from task 4-1.

import { installIpcBoundaryGuard } from '../fs_deny/ipc-boundary-guard';
import { installNetworkGuard } from '../fs_deny/network-guard';
import { installShellExecutionGuard } from './shell-execution-guard';
import { installHttpPluginGuard } from './http-plugin-guard';
import { installClipboardManagerDeny } from './clipboard-manager-deny';

let allGuardsInstalled = false;

export function installAllSecurityGuards(): void {
  if (allGuardsInstalled) return;

  installIpcBoundaryGuard();
  installNetworkGuard();
  installShellExecutionGuard();
  installHttpPluginGuard();
  installClipboardManagerDeny();

  allGuardsInstalled = true;
}

export function areAllSecurityGuardsInstalled(): boolean {
  return allGuardsInstalled;
}
