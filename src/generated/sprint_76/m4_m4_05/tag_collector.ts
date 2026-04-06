// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 76-1
// @task-title: M4（M4-05）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

/**
 * Extracts unique tags from NoteEntry arrays for display in TagFilter UI.
 *
 * module:grid — OQ-GRID-002
 *
 * This operates on data already fetched via IPC from module:storage.
 * It does NOT perform any filtering — it only collects tag metadata
 * for rendering the tag selection chips/dropdown.
 */

import type { NoteEntry, TagInfo } from './types';
import { TAG_DISPLAY_LIMIT } from './constants';

/**
 * Collects all unique tags from a list of NoteEntry and returns them
 * sorted by frequency (descending), then alphabetically.
 */
export function collectTags(notes: readonly NoteEntry[]): TagInfo[] {
  const counts = new Map<string, number>();

  for (const note of notes) {
    for (const rawTag of note.tags) {
      const tag = rawTag.trim().toLowerCase();
      if (tag === '') continue;
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  const result: TagInfo[] = [];
  for (const [name, count] of counts) {
    result.push({ name, count });
  }

  result.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.name.localeCompare(b.name);
  });

  return result;
}

/**
 * Returns the tags to display in the UI, respecting TAG_DISPLAY_LIMIT.
 * Returns `{ visible, hiddenCount }` so the UI can render "+N more".
 */
export function getDisplayTags(
  allTags: readonly TagInfo[],
  limit: number = TAG_DISPLAY_LIMIT,
): { visible: readonly TagInfo[]; hiddenCount: number } {
  if (allTags.length <= limit) {
    return { visible: allTags, hiddenCount: 0 };
  }
  return {
    visible: allTags.slice(0, limit),
    hiddenCount: allTags.length - limit,
  };
}

/**
 * Extracts a flat deduplicated list of tag name strings, sorted alphabetically.
 * Useful for simpler UI components (e.g. a <select> dropdown).
 */
export function collectTagNames(notes: readonly NoteEntry[]): string[] {
  const tags = new Set<string>();
  for (const note of notes) {
    for (const rawTag of note.tags) {
      const tag = rawTag.trim().toLowerCase();
      if (tag !== '') tags.add(tag);
    }
  }
  return [...tags].sort();
}

/**
 * Checks whether the given tag exists in the available tag set.
 * Used for validating stale selections after data refresh.
 */
export function isTagAvailable(
  tag: string,
  availableTags: readonly TagInfo[],
): boolean {
  const normalised = tag.trim().toLowerCase();
  return availableTags.some((t) => t.name === normalised);
}

/**
 * Prunes selected tags that no longer exist in the current note set.
 * Returns only the tags that are still present in `availableTags`.
 */
export function pruneStaleSelections(
  selectedTags: readonly string[],
  availableTags: readonly TagInfo[],
): string[] {
  const available = new Set(availableTags.map((t) => t.name));
  return selectedTags.filter((t) => available.has(t));
}
