// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 12-1
// @task-title: 対象モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=12 task=12-1 module=navigation
// Application view navigation state management.
// SPA routing is done via conditional rendering in App.svelte — no router library.
// This module provides a reactive store for currentView and selectedFilename.

import type { ViewType, NavigationState } from './types';

type NavigationListener = (state: NavigationState) => void;

/**
 * Minimal reactive store for application navigation state.
 * Used by App.svelte for conditional rendering of Editor / GridView / Settings.
 *
 * Pattern: subscribe/set store (compatible with Svelte's store contract).
 */
class NavigationStore {
  private state: NavigationState;
  private listeners: Set<NavigationListener> = new Set();

  constructor() {
    // Default view is grid (initial screen on app launch)
    this.state = {
      currentView: 'grid',
      selectedFilename: null,
    };
  }

  /** Subscribe to state changes. Returns an unsubscribe function. */
  subscribe(listener: NavigationListener): () => void {
    listener(this.state);
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Navigate to the grid view. */
  navigateToGrid(): void {
    this.setState({ currentView: 'grid', selectedFilename: null });
  }

  /**
   * Navigate to the editor view for a specific note.
   * Called by: module:grid (card click → AC-GR-06)
   */
  navigateToEditor(filename: string): void {
    this.setState({ currentView: 'editor', selectedFilename: filename });
  }

  /**
   * Navigate to the editor with a brand-new note (no existing filename yet).
   * Called by: module:editor (Cmd+N / Ctrl+N handler after create_note IPC)
   */
  navigateToNewNote(filename: string): void {
    this.setState({ currentView: 'editor', selectedFilename: filename });
  }

  /** Navigate to the settings view. */
  navigateToSettings(): void {
    this.setState({ currentView: 'settings', selectedFilename: null });
  }

  /** Get the current state snapshot. */
  get(): NavigationState {
    return this.state;
  }

  /** Get current view type. */
  get currentView(): ViewType {
    return this.state.currentView;
  }

  /** Get selected filename (null if none). */
  get selectedFilename(): string | null {
    return this.state.selectedFilename;
  }

  private setState(next: NavigationState): void {
    this.state = next;
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}

/** Singleton navigation store instance for the application. */
export const navigationStore = new NavigationStore();
