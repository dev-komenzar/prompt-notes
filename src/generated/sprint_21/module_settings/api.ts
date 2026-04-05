// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 21-1
// @task-title: `module:settings`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd:generated sprint=21 task=21-1 module=settings
//
// IPC wrapper functions for module:settings.
// All Tauri `invoke` calls are centralised here so that Svelte components
// never call `invoke` directly (component_architecture §3.4).
//
// CONV-2 (module:storage, module:settings):
//   Settings persistence goes through Rust backend exclusively.
//   Frontend must NOT perform filesystem path operations or writes.

import { invoke } from '@tauri-apps/api/tauri';
import type { Config, SetConfigParams } from './types';
import { GetConfigError, SetConfigError } from './errors';

/**
 * Retrieve the current application configuration from the Rust backend.
 *
 * IPC command: `get_config`
 * Owner:       module:settings (Rust)
 * Arguments:   none
 * Returns:     Config
 *
 * @throws {GetConfigError} when the IPC call fails.
 */
export async function getConfig(): Promise<Config> {
  try {
    return await invoke<Config>('get_config');
  } catch (err: unknown) {
    throw new GetConfigError(err);
  }
}

/**
 * Persist a new notes directory via the Rust backend.
 *
 * The Rust side performs:
 *   1. Path existence check
 *   2. Write-permission check
 *   3. config.json update
 *
 * IPC command: `set_config`
 * Owner:       module:settings (Rust)
 * Arguments:   { notes_dir: string }
 * Returns:     void
 *
 * @throws {SetConfigError} when validation fails or the IPC call errors.
 */
export async function setConfig(params: SetConfigParams): Promise<void> {
  try {
    await invoke<void>('set_config', {
      notes_dir: params.notes_dir,
    });
  } catch (err: unknown) {
    throw new SetConfigError(params.notes_dir, err);
  }
}
