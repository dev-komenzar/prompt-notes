// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 41-1
// @task-title: `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:41 task:41-1 module:grid
// Public surface of module:grid.

export { default as GridView } from './GridView.svelte';
export { default as NoteCard } from './NoteCard.svelte';
export { default as TagFilter } from './TagFilter.svelte';
export { default as DateFilter } from './DateFilter.svelte';
export type { NoteEntry, ListNotesParams, SearchNotesParams } from './types';
export { listNotes, searchNotes, deleteNote } from './api';
export { collectUniqueTags } from './tag-utils';
export { formatDateParam, getDefaultDateRange, formatDisplayDate } from './date-utils';
export { debounce } from './debounce';
