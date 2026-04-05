// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 46-1
// @task-title: 共有層
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=46 task=46-1 node=detail:component_architecture
// Barrel export for the shared layer consumed by module:editor, module:grid, module:settings UI.

export type {
  NoteEntry,
  Config,
  CreateNoteResult,
  SaveNoteArgs,
  ReadNoteArgs,
  ReadNoteResult,
  DeleteNoteArgs,
  ListNotesArgs,
  SearchNotesArgs,
  SetConfigArgs,
} from './types';

export {
  createNote,
  saveNote,
  readNote,
  deleteNote,
  listNotes,
  searchNotes,
  getConfig,
  setConfig,
} from './api';

export { debounce } from './debounce';
export type { DebouncedFn } from './debounce';

export {
  formatDateForFilter,
  getDefault7DayRange,
  formatCreatedAtForDisplay,
} from './date-utils';
