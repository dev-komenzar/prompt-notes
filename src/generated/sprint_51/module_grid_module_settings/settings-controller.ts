// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 51-1
// @task-title: `module:grid`, `module:settings`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:51 | task:51-1 | module:settings
// Settings business logic: config loading, notes_dir update, directory picker.
// Path validation and config persistence are handled exclusively by Rust backend (CONV-2).
// After successful notes_dir change, increments configVersion so grid reloads on next mount.

import { get } from 'svelte/store';
import {
  settingsConfig,
  settingsLoading,
  settingsError,
  settingsSaving,
  settingsDirChanged,
} from './settings-store';
import { getConfig, setConfig } from './ipc-api';
import { incrementConfigVersion, navigateToGrid } from './app-store';
import type { Config } from './types';

/**
 * Load current configuration from Rust backend.
 * Called on settings screen mount.
 */
export async function loadConfig(): Promise<void> {
  settingsLoading.set(true);
  settingsError.set(null);

  try {
    const config = await getConfig();
    settingsConfig.set(config);
    settingsDirChanged.set(false);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    settingsError.set(message);
  } finally {
    settingsLoading.set(false);
  }
}

/**
 * Update notes_dir via Rust backend (set_config IPC command).
 * Rust side performs path existence check and write permission validation.
 * On success, increments configVersion to signal grid view reload.
 * Returns true if the update succeeded.
 */
export async function updateNotesDir(newDir: string): Promise<boolean> {
  if (!newDir.trim()) {
    settingsError.set('ディレクトリパスを入力してください');
    return false;
  }

  settingsSaving.set(true);
  settingsError.set(null);

  try {
    await setConfig(newDir);
    settingsConfig.update((c) =>
      c ? { ...c, notes_dir: newDir } : { notes_dir: newDir },
    );
    settingsDirChanged.set(true);
    incrementConfigVersion();
    return true;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    settingsError.set(message);
    return false;
  } finally {
    settingsSaving.set(false);
  }
}

/**
 * Open native OS directory picker via Tauri dialog plugin.
 * Returns the selected path or null if the user cancelled.
 * No filesystem write occurs here; selection is for UI display only.
 */
export async function openDirectoryPicker(): Promise<string | null> {
  try {
    const { open } = await import('@tauri-apps/plugin-dialog');
    const selected = await open({
      directory: true,
      multiple: false,
      title: 'ノート保存ディレクトリを選択',
    });

    if (typeof selected === 'string') {
      return selected;
    }
    return null;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    settingsError.set(message);
    return null;
  }
}

/**
 * Full flow: open directory picker → update config on backend → signal grid reload.
 * Returns true if the directory was successfully changed.
 */
export async function pickAndUpdateNotesDir(): Promise<boolean> {
  const dir = await openDirectoryPicker();
  if (dir === null) {
    return false;
  }
  return updateNotesDir(dir);
}

/**
 * Navigate back to grid view.
 * If notes_dir was changed, grid will remount and call loadNotes(),
 * which reads from the updated directory via Rust backend.
 */
export function returnToGrid(): void {
  navigateToGrid();
}
