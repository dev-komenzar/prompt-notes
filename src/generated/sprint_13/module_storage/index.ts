// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 13-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:13 task:13-1 module:storage
// Barrel re-exports for the module:storage TypeScript client library.

export type {
  NoteEntry,
  Config,
  CreateNoteResponse,
  ReadNoteResponse,
  ListNotesParams,
  SearchNotesParams,
  SaveNoteParams,
  ReadNoteParams,
  DeleteNoteParams,
  SetConfigParams,
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
export type { DebouncedFunction } from './debounce';

export {
  AUTOSAVE_DEBOUNCE_MS,
  SEARCH_DEBOUNCE_MS,
  BODY_PREVIEW_LENGTH,
  DEFAULT_FILTER_DAYS,
  FILENAME_PATTERN,
} from './constants';

export { isValidNoteFilename, parseCreatedAtFromFilename } from './validation';

export { formatDateParam, getDefaultDateRange } from './date_utils';

export {
  createFrontmatterTemplate,
  extractBody,
  getFrontmatterLineRange,
  getBodyStartOffset,
} from './frontmatter';
