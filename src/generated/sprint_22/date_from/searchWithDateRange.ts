// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 22-4
// @task-title: `date_from`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @traceability: sprint_22/task_22-4 full search pipeline with date_from/date_to

import { invoke } from '@tauri-apps/api/core';
import type { NoteMetadata, SearchParams, SearchNotesResult } from '../query/types';
import { filterByDateRange } from './dateRangeFilter';
import { filterByTags } from '../tags_and/tagsFilter';

export interface DateRangeSearchParams {
  query?: string;
  tags?: string[];
  date_from?: string;
  date_to?: string;
}

export async function searchNotesWithDateRange(
  params: DateRangeSearchParams,
): Promise<SearchNotesResult> {
  const raw = await invoke<{ notes: NoteMetadata[] }>('search_notes', {
    query: params.query ?? null,
    tags: params.tags && params.tags.length > 0 ? params.tags : null,
    date_from: params.date_from ?? null,
    date_to: params.date_to ?? null,
  });

  let notes = raw.notes;

  if (params.tags && params.tags.length > 0) {
    notes = filterByTags(notes, params.tags);
  }

  notes = filterByDateRange(notes, params.date_from, params.date_to);

  return { notes };
}

export function buildDateRangeParams(date_from?: string, date_to?: string): DateRangeSearchParams {
  return { date_from, date_to };
}
