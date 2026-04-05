// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 5-1
// @task-title: `module:storage`, `module:settings`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=5, task=5-1, modules=[settings]
// Frontend service layer for module:settings.
// All filesystem operations and path validation are performed by Rust backend.
// This module provides typed functions for the Settings.svelte component.

import { getConfig, setConfig } from './api';
import type { Config } from './types';

/**
 * Loads the current application configuration from Rust backend.
 * Called by Settings.svelte on component mount.
 *
 * @returns The current Config, or null if loading fails.
 */
export async function loadCurrentConfig(): Promise<Config | null> {
  try {
    return await getConfig();
  } catch (err: unknown) {
    console.error('[module:settings] Failed to load config:', err);
    return null;
  }
}

/**
 * Updates the notes directory via Rust backend.
 * Rust backend performs:
 *   - Path existence check
 *   - Write permission check
 *   - config.json persistence
 *
 * Frontend must NOT perform any filesystem path validation or writes.
 * After success, new notes are saved to the new directory.
 * Existing notes are NOT moved automatically.
 *
 * @param notesDir - The new notes directory path (selected via Tauri dialog API).
 * @returns True if the update succeeded, false otherwise.
 */
export async function updateNotesDirectory(notesDir: string): Promise<UpdateResult> {
  if (!notesDir || notesDir.trim().length === 0) {
    return { success: false, error: 'Directory path cannot be empty.' };
  }

  try {
    await setConfig({ notes_dir: notesDir.trim() });
    return { success: true, error: null };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to update configuration.';
    console.error('[module:settings] Failed to set config:', err);
    return { success: false, error: message };
  }
}

export interface UpdateResult {
  readonly success: boolean;
  readonly error: string | null;
}
