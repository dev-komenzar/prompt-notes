// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 44-1
// @task-title: `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// trace: sprint_44 / task 44-1 / module:grid
// design-ref: detail:grid_search §4.2

import type { NoteEntry } from './types';

/**
 * Collect all unique tags from the current set of notes.
 *
 * Used by TagFilter.svelte to dynamically populate the tag selection UI.
 * Tags are sorted alphabetically for stable display order.
 *
 * Note: tag candidates are derived from the IPC response (NoteEntry[]),
 * NOT from a separate IPC command.  module:grid does not own tag data
 * beyond what module:storage returns.
 */
export function collectUniqueTags(notes: readonly NoteEntry[]): string[] {
  const tagSet = new Set<string>();
  for (const note of notes) {
    for (const tag of note.tags) {
      const trimmed = tag.trim();
      if (trimmed.length > 0) {
        tagSet.add(trimmed);
      }
    }
  }
  return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
}
