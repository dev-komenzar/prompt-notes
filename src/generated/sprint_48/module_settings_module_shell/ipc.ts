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

// @codd-trace: detail:component_architecture § 4.4, § 4.7 (RBC constraint: no @tauri-apps/plugin-fs)
// ALL config persistence goes through Rust commands.  Direct fs access from the frontend is
// structurally prohibited by the Tauri v2 capability system (fs plugin disabled).

import { invoke } from '@tauri-apps/api/core';
// IMPORTANT: @tauri-apps/plugin-fs is intentionally NOT imported here.
// The fs plugin is disabled in tauri.conf.json capabilities to enforce the IPC boundary.
// Directory selection uses @tauri-apps/plugin-dialog (open), which works independently of the fs plugin.
import type { AppConfig } from './types';

export const getConfig = (): Promise<AppConfig> =>
  invoke<AppConfig>('get_config');

export const setConfig = (config: AppConfig): Promise<void> =>
  invoke<void>('set_config', { config });
