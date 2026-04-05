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
// Svelte-compatible reactive store for settings state management.
//
// Responsibilities:
//   - Load config from Rust backend on initialisation
//   - Coordinate directory picker → set_config → state update
//   - Expose a readable store for UI binding
//
// Ownership:
//   Settings state is owned by this store.
//   UI components (Settings.svelte) bind to the readable store and
//   dispatch actions via exported functions.

import { writable, readonly, type Readable } from 'svelte/store';
import type { Config, SettingsState } from './types';
import { getConfig, setConfig } from './api';
import { openDirectoryPicker } from './dialog';
import { DirectoryPickerCancelledError, SettingsError } from './errors';

// ---------------------------------------------------------------------------
// Internal writable store
// ---------------------------------------------------------------------------

const _state = writable<SettingsState>({ status: 'idle' });

// ---------------------------------------------------------------------------
// Public readable store (prevents external mutation)
// ---------------------------------------------------------------------------

/**
 * Reactive settings state.
 * Subscribe from Svelte components: `$settingsState`.
 */
export const settingsState: Readable<SettingsState> = readonly(_state);

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/**
 * Load the current configuration from the Rust backend.
 * Call this in `onMount` of the settings screen.
 */
export async function loadConfig(): Promise<void> {
  _state.set({ status: 'loading' });
  try {
    const config = await getConfig();
    _state.set({ status: 'loaded', config });
  } catch (err: unknown) {
    const message =
      err instanceof SettingsError
        ? err.message
        : 'An unexpected error occurred while loading settings.';
    _state.set({ status: 'error', message });
  }
}

/**
 * Open the native directory picker and, if the user selects a directory,
 * persist the new `notes_dir` via `set_config` IPC command.
 *
 * Flow (component_architecture §4.6):
 *   1. Show OS directory dialog (Tauri dialog API)
 *   2. On selection → invoke `set_config` (Rust validates path & writes config.json)
 *   3. On success  → update store with new config
 *   4. On cancel   → no-op (stay on current state)
 *   5. On error    → surface error message in store
 */
export async function changeNotesDirectory(): Promise<void> {
  // Determine current directory to pre-select in dialog
  let currentDir: string | undefined;
  const unsubscribe = _state.subscribe((s) => {
    if (s.status === 'loaded') {
      currentDir = s.config.notes_dir;
    }
  });
  unsubscribe();

  let selectedDir: string;
  try {
    selectedDir = await openDirectoryPicker(currentDir);
  } catch (err: unknown) {
    if (err instanceof DirectoryPickerCancelledError) {
      // User cancelled — no-op
      return;
    }
    throw err;
  }

  _state.set({ status: 'saving' });
  try {
    await setConfig({ notes_dir: selectedDir });
    _state.set({
      status: 'loaded',
      config: { notes_dir: selectedDir },
    });
  } catch (err: unknown) {
    const message =
      err instanceof SettingsError
        ? err.message
        : 'Failed to save the new notes directory.';
    _state.set({ status: 'error', message });
  }
}

/**
 * Programmatically set the notes directory without opening a picker.
 * Useful when the path is already known (e.g. from a text input field).
 *
 * Path validation and persistence are handled by the Rust backend.
 */
export async function setNotesDirectory(notesDir: string): Promise<void> {
  _state.set({ status: 'saving' });
  try {
    await setConfig({ notes_dir: notesDir });
    _state.set({
      status: 'loaded',
      config: { notes_dir: notesDir },
    });
  } catch (err: unknown) {
    const message =
      err instanceof SettingsError
        ? err.message
        : 'Failed to save the new notes directory.';
    _state.set({ status: 'error', message });
  }
}

/**
 * Reset the store to idle state. Useful when navigating away from settings.
 */
export function resetSettingsState(): void {
  _state.set({ status: 'idle' });
}
