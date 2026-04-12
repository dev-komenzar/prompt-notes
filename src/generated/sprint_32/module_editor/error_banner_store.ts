// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 32-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// Manages the red error banner displayed at the top of the editor.
// Implements the 3-second auto-dismiss behaviour specified in editor_clipboard_design.md §4.7.

import { writable } from 'svelte/store';

export interface ErrorBannerState {
  visible: boolean;
  message: string;
}

const BANNER_DURATION_MS = 3000;

function createErrorBannerStore() {
  const { subscribe, set } = writable<ErrorBannerState>({ visible: false, message: '' });
  let timer: ReturnType<typeof setTimeout> | null = null;

  return {
    subscribe,

    /** Show the red banner with `message` for 3 seconds, then auto-dismiss. */
    show(message: string): void {
      if (timer) clearTimeout(timer);
      set({ visible: true, message });
      timer = setTimeout(() => {
        set({ visible: false, message: '' });
        timer = null;
      }, BANNER_DURATION_MS);
    },

    /** Immediately hide the banner (e.g. on component destroy). */
    dismiss(): void {
      if (timer) { clearTimeout(timer); timer = null; }
      set({ visible: false, message: '' });
    },
  };
}

export const errorBannerStore = createErrorBannerStore();
