// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 12-1
// @task-title: `#[cfg(target_os = "linux")]` で `~
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/plan/implementation_plan.md
// @sprint: 12
// @task: 12-1
// @trace: detail:component_architecture §3.3, detail:storage_fileformat §4.3

import { resolveNotesDir } from './resolve-notes-dir';
import type { ResolvedNotesDir } from './storage-paths';

/**
 * Reactive state holder for the resolved notes directory.
 * Designed for use in Svelte components via import + await.
 *
 * Usage in a Svelte component:
 *   const dirInfo = await loadNotesDir();
 */

let cached: ResolvedNotesDir | null = null;

/**
 * Loads and caches the resolved notes directory.
 * Calls the Rust backend once; subsequent calls return the cached value
 * until invalidateNotesDirCache() is called.
 */
export async function loadNotesDir(): Promise<ResolvedNotesDir> {
  if (cached) {
    return cached;
  }
  cached = await resolveNotesDir();
  return cached;
}

/**
 * Invalidates the cached directory info.
 * Call after the user changes the notes directory in settings.
 */
export function invalidateNotesDirCache(): void {
  cached = null;
}
