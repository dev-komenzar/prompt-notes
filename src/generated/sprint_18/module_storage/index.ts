// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 18-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:18 task:18-1 module:storage
// Public API barrel export for module:storage TypeScript layer.

// --- Types ---
export type {
  NoteEntry,
  Config,
  ListNotesParams,
  SearchNotesParams,
  CreateNoteResponse,
  ReadNoteResponse,
  SaveNoteParams,
  ReadNoteParams,
  DeleteNoteParams,
  SetConfigParams,
} from './types';

// --- IPC wrapper functions ---
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

// --- Utilities ---
export {
  formatDateParam,
  getDefaultDateRange,
  parseCreatedAt,
  formatCreatedAtDisplay,
} from './date-utils';

export {
  FILENAME_PATTERN,
  isValidNoteFilename,
  parseFilenameTimestamp,
} from './filename';

export { debounce } from './debounce';
export type { DebouncedFn } from './debounce';

export {
  StorageError,
  StorageErrorCode,
  toStorageError,
} from './errors';
