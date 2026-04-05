// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 47-1
// @task-title: `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:47 task:47-1 module:grid
// Extracts unique tags from the current NoteEntry result set.
// Tag candidates are dynamically collected per the grid_search_design spec.

import type { NoteEntry } from './types';

/**
 * Collect unique tags from a set of notes, sorted alphabetically.
 *
 * This function is the sole source of tag filter candidates in the grid UI.
 * Client-side filtering by tag is NOT performed — the tag value is forwarded
 * to module:storage via list_notes / search_notes IPC params.
 */
export function collectUniqueTags(
  notes: readonly NoteEntry[],
): readonly string[] {
  const tagSet = new Set<string>();
  for (const note of notes) {
    for (const tag of note.tags) {
      if (tag.length > 0) {
        tagSet.add(tag);
      }
    }
  }
  return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
}
