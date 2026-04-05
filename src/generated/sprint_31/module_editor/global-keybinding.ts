// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 31-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd:generated sprint_31 task_31-1 module:editor
// Window-level Cmd+N / Ctrl+N handler for when the CodeMirror editor
// is not focused (e.g., on the grid view).  When CM6 is focused its own
// keymap intercepts the event so this handler skips it.

export interface GlobalKeyBindingOptions {
  onCreateNote: () => void;
}

/**
 * Registers a window-level keydown listener for Cmd+N (macOS) / Ctrl+N (Linux).
 * Returns a cleanup function that removes the listener.
 */
export function setupGlobalKeyBindings(options: GlobalKeyBindingOptions): () => void {
  const isMac = /^Mac/i.test(navigator.platform);

  const handler = (e: KeyboardEvent): void => {
    // When CodeMirror has focus its own keymap handles Mod-n;
    // skip the global handler to avoid double-firing.
    const target = e.target as HTMLElement | null;
    if (target?.closest('.cm-editor')) return;

    const modKeyPressed = isMac ? e.metaKey : e.ctrlKey;
    if (modKeyPressed && e.key === 'n' && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      options.onCreateNote();
    }
  };

  window.addEventListener('keydown', handler, true);

  return () => {
    window.removeEventListener('keydown', handler, true);
  };
}
