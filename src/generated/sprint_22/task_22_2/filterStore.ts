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

// @traceability sprint:22 task:22-2 module:grid
// Manages search filter state with default 7-day window.
// Imports types from task 22-1; does NOT re-define them.

import type { SearchParams } from '../query/types';

export interface FilterStore {
  params: SearchParams;
  setQuery: (query: string) => void;
  setTags: (tags: string[]) => void;
  setDateRange: (from: string | undefined, to: string | undefined) => void;
  reset: () => void;
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function buildDefault7DayParams(): SearchParams {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 7);
  return {
    query: '',
    tags: [],
    date_from: toISODate(from),
    date_to: toISODate(to),
  };
}

/**
 * Plain-object filter store (framework-agnostic).
 * Wire into Svelte writable() or React useState at the call site.
 */
export function createFilterStore(initial?: Partial<SearchParams>): FilterStore {
  let params: SearchParams = { ...buildDefault7DayParams(), ...initial };

  return {
    get params() {
      return params;
    },
    setQuery(query: string) {
      params = { ...params, query };
    },
    setTags(tags: string[]) {
      params = { ...params, tags };
    },
    setDateRange(from: string | undefined, to: string | undefined) {
      params = { ...params, date_from: from, date_to: to };
    },
    reset() {
      params = buildDefault7DayParams();
    },
  };
}
