// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 19-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=19, task=19-1, module=storage, node=detail:grid_search
// Search/list parameter construction and validation for IPC commands.

import type { ListNotesParams, SearchNotesParams } from './types';
import { isValidDateParam } from './date-utils';

/**
 * Builds validated ListNotesParams, stripping undefined/empty values.
 * Ensures date parameters conform to YYYY-MM-DD format before IPC call.
 */
export function buildListParams(options: {
  fromDate?: string;
  toDate?: string;
  tag?: string;
}): ListNotesParams {
  const params: ListNotesParams = {};
  const mutable: Record<string, string | undefined> = {};

  if (options.fromDate && isValidDateParam(options.fromDate)) {
    mutable.from_date = options.fromDate;
  }
  if (options.toDate && isValidDateParam(options.toDate)) {
    mutable.to_date = options.toDate;
  }
  if (options.tag && options.tag.trim().length > 0) {
    mutable.tag = options.tag.trim();
  }

  return mutable as ListNotesParams;
}

/**
 * Builds validated SearchNotesParams for the search_notes IPC command.
 * Requires a non-empty query string. Filter parameters are optional.
 *
 * Per design: when query is empty, caller should use listNotes instead of searchNotes.
 *
 * @throws {Error} if query is empty or whitespace-only
 */
export function buildSearchParams(options: {
  query: string;
  fromDate?: string;
  toDate?: string;
  tag?: string;
}): SearchNotesParams {
  const trimmedQuery = options.query.trim();
  if (trimmedQuery.length === 0) {
    throw new Error(
      'search_notes requires a non-empty query. Use list_notes for unfiltered listing.',
    );
  }

  const params: Record<string, string | undefined> = {
    query: trimmedQuery,
  };

  if (options.fromDate && isValidDateParam(options.fromDate)) {
    params.from_date = options.fromDate;
  }
  if (options.toDate && isValidDateParam(options.toDate)) {
    params.to_date = options.toDate;
  }
  if (options.tag && options.tag.trim().length > 0) {
    params.tag = options.tag.trim();
  }

  return params as SearchNotesParams;
}

/**
 * Determines whether to use search_notes or list_notes IPC command
 * based on whether a query string is present.
 *
 * Per state machine in grid_search_design:
 *   query empty → list_notes
 *   query non-empty → search_notes
 */
export function shouldUseSearch(query: string | undefined | null): boolean {
  return query !== undefined && query !== null && query.trim().length > 0;
}
