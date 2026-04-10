// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 44-1
// @task-title: `SearchParams` 型のリアクティブストア。デフォルトフィルタ値の初期化。エディタからの戻り遷移時にフィルタ状態保持。
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd-sprint: 44
// @task: 44-1
// @deliverable: SearchParams 型のリアクティブストア。デフォルトフィルタ値の初期化。エディタからの戻り遷移時にフィルタ状態保持。

import { writable } from 'svelte/store';
import type { SearchParams } from '$lib/types/search';

function getDefaultDateFrom(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}

function getDefaultDateTo(): string {
  return new Date().toISOString().slice(0, 10);
}

export const DEFAULT_FILTER: SearchParams = {
  query: '',
  tags: [],
  date_from: getDefaultDateFrom(),
  date_to: getDefaultDateTo(),
};

export const gridFilter = writable<SearchParams>({ ...DEFAULT_FILTER });

export function resetToDefault(): void {
  gridFilter.set({
    query: '',
    tags: [],
    date_from: getDefaultDateFrom(),
    date_to: getDefaultDateTo(),
  });
}
