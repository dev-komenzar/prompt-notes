// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 2-1
// @task-title: `module:shell`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint:2 task:2-1 module:shell node:detail:component_architecture
// Application-level view state for SPA routing (no router library — 3 screens).
// Svelte writable stores drive conditional rendering in App.svelte.

import { writable, derived, type Readable, type Writable } from 'svelte/store';
import type { AppView } from './types';

// ---------------------------------------------------------------------------
// Current view
// ---------------------------------------------------------------------------

/** Active screen. Drives {#if} blocks in App.svelte. */
export const currentView: Writable<AppView> = writable<AppView>('grid');

// ---------------------------------------------------------------------------
// Selected note (grid → editor transition)
// ---------------------------------------------------------------------------

/**
 * Filename of the note selected in the grid view.
 * Set before switching currentView to 'editor'.
 * Null when creating a brand-new note via Cmd+N / Ctrl+N.
 */
export const selectedFilename: Writable<string | null> = writable<string | null>(null);

// ---------------------------------------------------------------------------
// Navigation helpers
// ---------------------------------------------------------------------------

/**
 * Navigate to the editor with an existing note.
 * Called by GridView when a NoteCard is clicked (CONV-GRID-3).
 */
export function navigateToEditor(filename: string): void {
  selectedFilename.set(filename);
  currentView.set('editor');
}

/**
 * Navigate to the editor for a brand-new note.
 * Called after Cmd+N / Ctrl+N creates a file via IPC.
 */
export function navigateToNewNote(): void {
  selectedFilename.set(null);
  currentView.set('editor');
}

/**
 * Navigate back to the grid view.
 */
export function navigateToGrid(): void {
  selectedFilename.set(null);
  currentView.set('grid');
}

/**
 * Navigate to the settings screen.
 */
export function navigateToSettings(): void {
  currentView.set('settings');
}

// ---------------------------------------------------------------------------
// Derived helpers
// ---------------------------------------------------------------------------

/** True when the editor is showing an existing note (not a new one). */
export const isEditingExistingNote: Readable<boolean> = derived(
  [currentView, selectedFilename],
  ([$view, $filename]) => $view === 'editor' && $filename !== null,
);
