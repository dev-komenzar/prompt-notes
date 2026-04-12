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

// @codd-trace: detail:grid_search §4.4, RBC-GRID-2
// SearchInput ロジック: 300ms デバウンスで filtersStore.query を更新する。
// Svelte コンポーネントの <script lang="ts"> として利用する。

import { filtersStore } from '../stores/filters';

export interface SearchInputController {
  handleInput(value: string): void;
  destroy(): void;
}

export function createSearchInputController(): SearchInputController {
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  function handleInput(value: string): void {
    if (debounceTimer !== undefined) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      filtersStore.update(f => ({ ...f, query: value }));
    }, 300);
  }

  function destroy(): void {
    if (debounceTimer !== undefined) clearTimeout(debounceTimer);
  }

  return { handleInput, destroy };
}
