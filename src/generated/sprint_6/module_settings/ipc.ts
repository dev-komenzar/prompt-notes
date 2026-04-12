// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 6-1
// @task-title: `module:settings`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/component_architecture.md §4.4
// @sprint: 6, task: 6-1, module: settings
// IPC wrappers for config commands — components must NOT import @tauri-apps/api/core directly.

import { invoke } from '@tauri-apps/api/core';
import type { AppConfig } from './types';

export const getConfig = (): Promise<AppConfig> =>
  invoke<AppConfig>('get_config');

export const setConfig = (config: AppConfig): Promise<void> =>
  invoke<void>('set_config', { config });
