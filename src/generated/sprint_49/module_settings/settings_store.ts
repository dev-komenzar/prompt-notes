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
// @trace detail:component_architecture §4.6
// @convention CONV-2: config changes persisted via Rust IPC exclusively

import { writable, get } from 'svelte/store';
import type { Config } from './types';
import { getConfig, setConfig, selectDirectory } from './api';

/** Current persisted configuration from Rust backend. */
export const config = writable<Config | null>(null);

/** True while loading config from backend. */
export const loading = writable<boolean>(false);

/** True while saving config to backend. */
export const saving = writable<boolean>(false);

/** Error message from the most recent operation, or null. */
export const error = writable<string | null>(null);

/** Transient flag indicating a successful save. Auto-clears after timeout. */
export const saveSuccess = writable<boolean>(false);

/** User-edited notes_dir value, may differ from persisted config. */
export const pendingNotesDir = writable<string>('');

let saveSuccessTimer: ReturnType<typeof setTimeout> | null = null;

function clearSaveSuccessTimer(): void {
  if (saveSuccessTimer !== null) {
    clearTimeout(saveSuccessTimer);
    saveSuccessTimer = null;
  }
}

/**
 * Loads the current configuration from Rust backend via get_config IPC.
 * Updates both `config` and `pendingNotesDir` stores on success.
 */
export async function loadConfig(): Promise<void> {
  loading.set(true);
  error.set(null);

  try {
    const cfg = await getConfig();
    config.set(cfg);
    pendingNotesDir.set(cfg.notes_dir);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    error.set(`設定の読み込みに失敗しました: ${message}`);
  } finally {
    loading.set(false);
  }
}

/**
 * Persists the pending notes_dir to Rust backend via set_config IPC.
 *
 * The Rust backend validates:
 * - Directory existence
 * - Write permissions
 *
 * On success, updates the `config` store and shows a transient success indicator.
 * On failure, sets the `error` store with a user-facing message.
 *
 * After config change, new notes are saved to the new directory.
 * Existing notes are NOT moved automatically.
 */
export async function saveConfig(): Promise<void> {
  const dir = get(pendingNotesDir).trim();

  if (!dir) {
    error.set('保存ディレクトリのパスを入力してください。');
    return;
  }

  saving.set(true);
  error.set(null);
  saveSuccess.set(false);
  clearSaveSuccessTimer();

  try {
    // CONV-2: Path validation and persistence handled by Rust backend
    await setConfig({ notes_dir: dir });
    config.set({ notes_dir: dir });
    pendingNotesDir.set(dir);
    saveSuccess.set(true);

    saveSuccessTimer = setTimeout(() => {
      saveSuccess.set(false);
      saveSuccessTimer = null;
    }, 2000);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    error.set(`設定の保存に失敗しました: ${message}`);
  } finally {
    saving.set(false);
  }
}

/**
 * Opens the native OS directory picker dialog and updates pendingNotesDir
 * with the selected path.
 *
 * Does not persist the selection — user must explicitly save.
 * If user cancels the dialog, no changes are made.
 */
export async function browseDirectory(): Promise<void> {
  error.set(null);

  try {
    const currentDir = get(pendingNotesDir) || undefined;
    const selected = await selectDirectory(currentDir);

    if (selected !== null) {
      pendingNotesDir.set(selected);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    error.set(`ディレクトリの選択に失敗しました: ${message}`);
  }
}

/**
 * Resets pendingNotesDir to the last persisted value and clears
 * error/success indicators.
 */
export function resetPendingDir(): void {
  const cfg = get(config);
  if (cfg) {
    pendingNotesDir.set(cfg.notes_dir);
  }
  error.set(null);
  saveSuccess.set(false);
  clearSaveSuccessTimer();
}

/**
 * Cleanup function to clear timers. Call from component onDestroy.
 */
export function destroySettingsStore(): void {
  clearSaveSuccessTimer();
}
