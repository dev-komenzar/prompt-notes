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
// Application-level Svelte stores for view routing and config change signaling.
// currentView drives conditional rendering in App.svelte (3 views: grid | editor | settings).
// configVersion is incremented after notes_dir changes, enabling grid reload on remount.

import { writable } from 'svelte/store';
import type { ViewName } from './types';

export const currentView = writable<ViewName>('grid');

export const selectedFilename = writable<string | null>(null);

export const configVersion = writable<number>(0);

export function navigateToGrid(): void {
  selectedFilename.set(null);
  currentView.set('grid');
}

export function navigateToEditor(filename: string): void {
  selectedFilename.set(filename);
  currentView.set('editor');
}

export function navigateToSettings(): void {
  currentView.set('settings');
}

export function incrementConfigVersion(): void {
  configVersion.update((v) => v + 1);
}
