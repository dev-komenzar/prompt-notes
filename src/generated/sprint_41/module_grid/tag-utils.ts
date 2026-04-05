// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 41-1
// @task-title: `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:41 task:41-1 module:grid
// Tag extraction from NoteEntry arrays for TagFilter population.

import type { NoteEntry } from './types';

/**
 * Collect unique tags from an array of NoteEntry, sorted alphabetically.
 */
export function collectUniqueTags(notes: NoteEntry[]): string[] {
  const set = new Set<string>();
  for (const note of notes) {
    for (const tag of note.tags) {
      set.add(tag);
    }
  }
  return Array.from(set).sort();
}
