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

// @codd-traceability: sprint=22, task=22-3, module=storage/search, feature=tags-and-search

import { searchNotes } from '../query/searchNotes';
import type { SearchParams, SearchNotesResult } from '../query/types';
import { filterByTags } from './tagsFilter';

/**
 * Executes searchNotes and applies the tags AND filter as a post-processing step.
 * This reflects the Rust-side behavior: all filter conditions are combined with AND.
 */
export async function searchNotesWithTags(params: SearchParams): Promise<SearchNotesResult> {
  const result = await searchNotes(params);
  if (!params.tags || params.tags.length === 0) return result;
  return {
    notes: filterByTags(result.notes, params),
  };
}
