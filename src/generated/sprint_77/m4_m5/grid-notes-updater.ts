// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 77-1
// @task-title: M4 または M5
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

/**
 * Utility for updating the grid's note list after deletion.
 *
 * Provides a pure function to remove a deleted note from the display list.
 * Used by GridView.svelte in the onDeleteSuccess callback to update
 * the reactive notes array without re-fetching from module:storage.
 */

/**
 * Remove a deleted note from the notes array by filename.
 * Returns a new array — does not mutate the input.
 *
 * Generic over any type with a `filename` property, so it works
 * with NoteEntry from lib/types.ts or any compatible shape.
 *
 * @param notes - Current array of notes displayed in the grid
 * @param deletedFilename - Filename of the successfully deleted note
 */
export function removeDeletedNote<T extends { readonly filename: string }>(
  notes: readonly T[],
  deletedFilename: string
): T[] {
  return notes.filter((note) => note.filename !== deletedFilename);
}

/**
 * Check whether a notes array contains a specific filename.
 * Useful for guards before attempting operations on a note.
 */
export function hasNote<T extends { readonly filename: string }>(
  notes: readonly T[],
  filename: string
): boolean {
  return notes.some((note) => note.filename === filename);
}
