// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 19-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=19, task=19-1, module=storage
// Public API barrel export for module:storage TypeScript layer.

// Types
export type {
  NoteEntry,
  Config,
  CreateNoteResponse,
  ReadNoteResponse,
  SaveNoteParams,
  NoteFileParams,
  ListNotesParams,
  SearchNotesParams,
  StorageError,
} from './types';

export { FILENAME_PATTERN } from './types';

// IPC API wrappers
export {
  createNote,
  saveNote,
  readNote,
  deleteNote,
  listNotes,
  searchNotes,
} from './api';

// Date utilities
export {
  formatDateParam,
  getDefault7DayRange,
  parseFilenameTimestamp,
  isValidDateParam,
} from './date-utils';

// Search parameter builders
export {
  buildListParams,
  buildSearchParams,
  shouldUseSearch,
} from './search-params';

// Debounce utility
export {
  debounce,
  AUTO_SAVE_DEBOUNCE_MS,
  SEARCH_DEBOUNCE_MS,
} from './debounce';
export type { DebouncedFn } from './debounce';
