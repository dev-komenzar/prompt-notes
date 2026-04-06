// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 49-1
// @task-title: `module:settings`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated sprint:49 task:49-1 module:settings
// @trace detail:component_architecture §3.3 §4.6
// @convention CONV-1: all file operations via Rust backend IPC
// @convention CONV-2: config persistence exclusively via Rust backend

import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import type { Config } from './types';

/**
 * Retrieves the current application configuration from Rust backend.
 *
 * IPC command: get_config
 * Owner: module:settings (Rust backend)
 * Returns: Config { notes_dir: string }
 */
export async function getConfig(): Promise<Config> {
  return invoke<Config>('get_config');
}

/**
 * Persists updated configuration via Rust backend.
 *
 * The Rust backend performs:
 * - Path existence check
 * - Write permission verification
 * - config.json atomic write
 *
 * Frontend MUST NOT write to config.json directly (CONV-2).
 * Path validation is performed exclusively by the Rust backend.
 *
 * IPC command: set_config
 * Owner: module:settings (Rust backend)
 *
 * @throws Error if path validation fails on Rust side
 *         (e.g., directory does not exist, insufficient permissions)
 */
export async function setConfig(params: { notes_dir: string }): Promise<void> {
  return invoke<void>('set_config', params);
}

/**
 * Opens a native OS directory picker dialog via Tauri dialog API.
 *
 * Uses Tauri's native dialog integration:
 * - Linux: GTK file chooser
 * - macOS: NSOpenPanel
 *
 * This does NOT access the filesystem directly from the frontend.
 * The dialog is managed by the Tauri runtime (Rust side).
 *
 * @param currentDir - Optional current directory to open the dialog at
 * @returns Selected directory absolute path, or null if user cancelled
 */
export async function selectDirectory(currentDir?: string): Promise<string | null> {
  const selected = await open({
    directory: true,
    multiple: false,
    defaultPath: currentDir,
  });

  if (typeof selected === 'string') {
    return selected;
  }

  // User cancelled the dialog or unexpected return type
  return null;
}
