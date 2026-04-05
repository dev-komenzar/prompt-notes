// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 37-1
// @task-title: `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:37 task:37-1 module:grid — View navigation helpers
// CONV-GRID-3: Card click → editor screen transition.
// Navigation is via App.svelte's currentView state variable
// (conditional rendering, no SPA router).
// module:grid only passes filename; module:editor performs read_note IPC.

import type { ViewName, NavigateToEditorEvent, CardClickEvent } from './types';

/**
 * Callback type for view navigation.
 * App.svelte provides this callback to GridView.svelte.
 */
export type NavigateCallback = (view: ViewName, filename?: string) => void;

/**
 * Handles a card click event by triggering navigation to the editor.
 * module:grid does NOT call read_note — that is module:editor's responsibility.
 *
 * @param navigate - Callback provided by App.svelte for view switching
 * @param event - Card click event containing the filename
 */
export function handleCardClick(navigate: NavigateCallback, event: CardClickEvent): void {
  navigate('editor', event.filename);
}

/**
 * Creates a NavigateToEditorEvent from a filename.
 * Used for Svelte custom event dispatching from NoteCard.svelte.
 */
export function createNavigateEvent(filename: string): NavigateToEditorEvent {
  return {
    type: 'navigate-to-editor',
    filename,
  };
}

/**
 * Navigates back to the grid view.
 * Called from module:editor when user wants to return to the grid.
 */
export function navigateToGrid(navigate: NavigateCallback): void {
  navigate('grid');
}

/**
 * Navigates to the settings view.
 */
export function navigateToSettings(navigate: NavigateCallback): void {
  navigate('settings');
}
