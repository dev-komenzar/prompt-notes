// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 65-1
// @task-title: 5 週
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd-sprint: 65 | task: 65-1 | module: grid
// All search/filter is performed by Rust backend via IPC. No client-side filtering. (RBC-GRID-2)

import { listNotes, searchNotes } from '../ipc';
import type { GridFilters, NoteMetadata, NoteFilter } from '../types';

export async function fetchGridNotes(filters: GridFilters): Promise<NoteMetadata[]> {
  const filter: NoteFilter = {};

  if (filters.tags && filters.tags.length > 0) {
    filter.tags = filters.tags;
  }
  if (filters.date_from) filter.date_from = filters.date_from;
  if (filters.date_to) filter.date_to = filters.date_to;

  if (filters.query.trim()) {
    return searchNotes(filters.query.trim(), filter);
  }
  return listNotes(filter);
}

export function formatCardDate(isoDate: string): string {
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return isoDate;
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

export function buildAllTags(notes: NoteMetadata[]): string[] {
  const set = new Set<string>();
  for (const note of notes) {
    for (const tag of note.tags) set.add(tag);
  }
  return [...set].sort();
}
