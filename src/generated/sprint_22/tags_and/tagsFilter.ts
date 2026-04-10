// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 22-3
// @task-title: `tags`（AND 条件完全一致）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd-traceability: sprint=22, task=22-3, module=storage/search, feature=tags-and-filter

import type { NoteMetadata, SearchParams } from '../query/types';

/**
 * Returns true if the note contains ALL specified tags (AND condition, exact match).
 * Tag comparison is case-sensitive to match frontmatter YAML values exactly.
 */
export function matchesAllTags(noteTags: string[], requiredTags: string[]): boolean {
  if (requiredTags.length === 0) return true;
  return requiredTags.every((tag) => noteTags.includes(tag));
}

/**
 * Filters a list of NoteMetadata by the tags AND condition from SearchParams.
 * Notes must contain every tag in params.tags to pass.
 */
export function filterByTags(notes: NoteMetadata[], params: Pick<SearchParams, 'tags'>): NoteMetadata[] {
  const tags = params.tags;
  if (!tags || tags.length === 0) return notes;
  return notes.filter((note) => matchesAllTags(note.tags, tags));
}
