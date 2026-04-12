// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 45-1
// @task-title: 担当モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd-traceability: detail:grid_search § 4.4, § 4.5

import { listNotes, searchNotes } from '../ipc';
import type { NoteMetadata } from '../types';
import type { GridFilters } from '../stores/filters';

export async function fetchNotesForFilters(
  filters: GridFilters,
): Promise<NoteMetadata[]> {
  const filter = {
    tags: filters.tags && filters.tags.length > 0 ? filters.tags : undefined,
    date_from: filters.date_from,
    date_to: filters.date_to,
  };

  if (filters.query.trim().length > 0) {
    return searchNotes(filters.query.trim(), filter);
  }
  return listNotes(filter);
}

export function createSearchDebounce(
  callback: (filters: GridFilters) => void,
  delayMs = 300,
) {
  let timer: ReturnType<typeof setTimeout> | null = null;

  function trigger(filters: GridFilters): void {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      callback(filters);
    }, delayMs);
  }

  function cancel(): void {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  return { trigger, cancel };
}
