// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 22-2
// @task-title: 本文のみ対象）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @traceability sprint:22 task:22-2 module:grid module:storage
// High-level facade: combines the IPC call from task 22-1 with the filter store
// and date utilities from this task. Consumers import this instead of wiring
// searchNotes + filterStore + dateUtils themselves.

import { searchNotes, buildDefaultSearchParams } from '../query/searchNotes';
import type { SearchNotesResult, SearchParams } from '../query/types';
import { buildDefault7DayParams } from './filterStore';
import { daysAgoDate, todayDate } from './dateUtils';

export type { SearchParams, SearchNotesResult };
export { buildDefaultSearchParams };

/**
 * Execute a search with an explicit 7-day default applied when date params are absent.
 * query is matched case-insensitively against the note body only (enforced on Rust side).
 * tags uses AND-condition exact match (enforced on Rust side).
 */
export async function searchWithDefaults(
  partial: Partial<SearchParams> = {},
): Promise<SearchNotesResult> {
  const defaults = buildDefault7DayParams();
  const params: SearchParams = {
    ...defaults,
    ...partial,
    // Ensure empty string query is treated as "no query" (pass through as-is;
    // the Rust backend treats empty string as match-all).
    query: partial.query ?? defaults.query,
    tags: partial.tags ?? defaults.tags,
  };
  return searchNotes(params);
}

/**
 * Convenience wrapper: search across all dates (no date filter).
 */
export async function searchAllDates(
  query: string,
  tags: string[] = [],
): Promise<SearchNotesResult> {
  return searchNotes({ query, tags, date_from: undefined, date_to: undefined });
}

/**
 * Convenience wrapper: apply only the default 7-day window without a text query.
 */
export async function listRecentNotes(): Promise<SearchNotesResult> {
  return searchNotes({
    query: '',
    tags: [],
    date_from: daysAgoDate(7),
    date_to: todayDate(),
  });
}
