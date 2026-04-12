// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 65-1
// @task-title: 5 週
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd-sprint: 65 | task: 65-1 | module: editor
// Cmd+N (macOS) / Ctrl+N (Linux) global keybinding for new note creation.
// Release-blocking requirement: RB-1.

export function isNewNoteShortcut(e: KeyboardEvent): boolean {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac');
  return (isMac ? e.metaKey : e.ctrlKey) && e.key === 'n';
}

export function registerNewNoteKeybinding(
  handler: () => void
): () => void {
  function onKeydown(e: KeyboardEvent) {
    if (isNewNoteShortcut(e)) {
      e.preventDefault();
      handler();
    }
  }
  window.addEventListener('keydown', onKeydown);
  return () => window.removeEventListener('keydown', onKeydown);
}
