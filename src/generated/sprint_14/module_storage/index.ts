// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 14-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:14 task:14-1 module:storage
// Barrel exports for module:storage TypeScript layer.

// --- Types ---
export type {
  NoteEntry,
  CreateNoteResponse,
  ReadNoteResponse,
  SaveNoteArgs,
  ReadNoteArgs,
  DeleteNoteArgs,
  ListNotesArgs,
  SearchNotesArgs,
  Config,
  SetConfigArgs,
} from './types';

// --- IPC API (single invoke entry point) ---
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

// --- Debounce ---
export type { Debounced } from './debounce';
export { debounce } from './debounce';

// --- Frontmatter ---
export type { FrontmatterRange } from './frontmatter';
export {
  createFrontmatterTemplate,
  detectFrontmatter,
  extractBody,
  getBodyStartOffset,
} from './frontmatter';

// --- Validators ---
export { isValidFilename, assertValidFilename } from './validators';

// --- Date Utilities ---
export {
  formatDateForFilter,
  getDefaultDateRange,
  parseDateFromFilename,
} from './date-utils';

// --- Constants ---
export {
  AUTOSAVE_DEBOUNCE_MS,
  SEARCH_DEBOUNCE_MS,
  BODY_PREVIEW_MAX_LENGTH,
  DEFAULT_FILTER_DAYS,
  FILENAME_PATTERN,
  FRONTMATTER_DELIMITER,
} from './constants';
