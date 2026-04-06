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

// sprint:51 | task:51-1 | module:grid, module:settings
// Integration module for the sprint 51 core feature: grid reload after notes_dir change.
//
// Architecture:
// 1. Settings view calls updateNotesDir() → Rust backend persists new notes_dir
// 2. updateNotesDir() increments configVersion in app-store
// 3. User navigates back to grid → GridView.svelte remounts
// 4. GridView onMount calls initializeGrid() which fetches from the new directory
//
// For Svelte components that remain mounted across view changes (future tab-based UI),
// subscribeToConfigChanges() provides reactive reload via configVersion subscription.

import { get } from 'svelte/store';
import { configVersion } from './app-store';
import { refreshGrid, loadNotes } from './grid-controller';
import type { Unsubscriber } from 'svelte/store';

/**
 * Initialize grid on mount. Resets filters to defaults (last 7 days) and loads notes.
 * This is the primary entry point called from GridView.svelte's onMount.
 */
export async function initializeGrid(): Promise<void> {
  await refreshGrid();
}

/**
 * Subscribe to config version changes for reactive grid reload.
 * Returns an unsubscribe function to be called on component destroy.
 *
 * Usage in GridView.svelte:
 *   onMount(() => { initializeGrid(); });
 *   const unsub = subscribeToConfigChanges();
 *   onDestroy(() => { unsub(); });
 */
export function subscribeToConfigChanges(): Unsubscriber {
  let previousVersion = get(configVersion);

  return configVersion.subscribe((currentVersion) => {
    if (currentVersion > previousVersion) {
      previousVersion = currentVersion;
      refreshGrid();
    }
  });
}
