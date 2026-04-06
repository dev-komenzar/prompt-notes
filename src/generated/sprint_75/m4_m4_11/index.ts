// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 75-1
// @task-title: M4（M4-11）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Trace: sprint_75 / task 75-1 / M4-11
// Public barrel export for sprint_75 search debounce module.

export { SEARCH_DEBOUNCE_MS, AUTOSAVE_DEBOUNCE_MS, DEFAULT_FILTER_DAYS, BODY_PREVIEW_MAX_LENGTH } from './constants';
export { debounce } from './debounce';
export type { DebouncedFn } from './debounce';
export { formatDateISO, computeDefaultDateRange, parseCreatedAt } from './dateUtils';
export {
  setInvokeFunction,
  createNote,
  saveNote,
  readNote,
  deleteNote,
  listNotes,
  searchNotes,
  getConfig,
  setConfig,
} from './api';
export { createSearchController } from './searchController';
export type { SearchController, SearchResultCallback } from './searchController';
export { createGridStateStore } from './gridFilterState';
export type { GridState, GridStateSubscriber, GridStateStore } from './gridFilterState';
export type {
  NoteEntry,
  ListNotesParams,
  SearchNotesParams,
  ReadNoteParams,
  ReadNoteResult,
  SaveNoteParams,
  CreateNoteResult,
  DeleteNoteParams,
  Config,
  SetConfigParams,
  GridFilterState,
} from './types';
