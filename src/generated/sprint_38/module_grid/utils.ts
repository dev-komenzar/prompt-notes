// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 38-1
// @task-title: `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:38 task:38-1 module:grid — Date formatting and tag extraction utilities

import type { NoteEntry } from './types';

/**
 * Formats a Date object to "YYYY-MM-DD" string for IPC date parameters.
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns the default 7-day date range (CONV-GRID-1).
 * from_date = today − 7 days, to_date = today.
 */
export function getDefaultDateRange(): { fromDate: string; toDate: string } {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  return {
    fromDate: formatDate(sevenDaysAgo),
    toDate: formatDate(now),
  };
}

/**
 * Formats created_at from NoteEntry for display.
 * Input: "2026-04-04T14:30:52"  →  Output: "2026-04-04 14:30"
 */
export function formatCreatedAt(createdAt: string): string {
  if (createdAt.length >= 16) {
    return createdAt.substring(0, 16).replace('T', ' ');
  }
  return createdAt;
}

/**
 * Extracts a sorted array of unique tags from a list of NoteEntry objects.
 * Used to populate TagFilter options from IPC responses.
 */
export function extractUniqueTags(notes: NoteEntry[]): string[] {
  const tagSet = new Set<string>();
  for (const note of notes) {
    for (const tag of note.tags) {
      tagSet.add(tag);
    }
  }
  return Array.from(tagSet).sort();
}
