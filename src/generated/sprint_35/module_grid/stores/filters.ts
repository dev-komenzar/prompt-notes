// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 35-1
// @task-title: `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd-trace: detail:grid_search §3.2, RBC-GRID-1
// filtersStore: デフォルト直近7日間フィルタを構造的に強制する。

import { writable } from 'svelte/store';
import type { NoteFilter } from '../types';

export interface GridFilters extends NoteFilter {
  query: string; // 全文検索クエリ（NoteFilter には含まれない）
}

export function getDefaultFilters(): GridFilters {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return {
    tags: [],
    date_from: sevenDaysAgo.toISOString().slice(0, 10),
    date_to: now.toISOString().slice(0, 10),
    query: '',
  };
}

export const filtersStore = writable<GridFilters>(getDefaultFilters());

// resetFilters もデフォルト値（直近7日間）に戻す。RBC-GRID-1 を維持する。
export function resetFilters(): void {
  filtersStore.set(getDefaultFilters());
}
