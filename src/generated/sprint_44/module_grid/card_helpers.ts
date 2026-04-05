// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 44-1
// @task-title: `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// trace: sprint_44 / task 44-1 / module:grid
// design-ref: detail:grid_search §4.3, §4.4

import type { NoteEntry } from './types';
import { formatCreatedAtDisplay } from './date_utils';

/**
 * View-model for a single note card in the Masonry grid.
 *
 * NoteCard.svelte receives a NoteEntry from GridView.svelte and
 * transforms it into display-ready values via this helper.
 */
export interface CardViewModel {
  readonly filename: string;
  readonly displayDate: string;
  readonly tags: readonly string[];
  readonly bodyPreview: string;
  readonly hasBody: boolean;
}

export function toCardViewModel(entry: NoteEntry): CardViewModel {
  return {
    filename: entry.filename,
    displayDate: formatCreatedAtDisplay(entry.created_at),
    tags: entry.tags,
    bodyPreview: entry.body_preview,
    hasBody: entry.body_preview.trim().length > 0,
  };
}

/**
 * Build an array of CardViewModels from IPC result.
 * The array order is preserved (module:storage returns created_at desc).
 */
export function toCardViewModels(entries: readonly NoteEntry[]): CardViewModel[] {
  return entries.map(toCardViewModel);
}
