// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 20-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd:generated sprint=20 task=20-1 module=storage
// Public barrel export for module:storage frontend layer.
// All storage-related imports should go through this index.

// --- Types ---
export type {
  NoteEntry,
  CreateNoteResponse,
  ReadNoteResponse,
  SaveNoteArgs,
  NoteFilenameArgs,
  ListNotesArgs,
  SearchNotesArgs,
  Config,
  SetConfigArgs,
} from './types';

// --- IPC API (single entry-point for Tauri invoke) ---
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

// --- Constants ---
export {
  APP_NAME,
  NOTES_SUBDIR,
  CONFIG_FILENAME,
  DEFAULT_PATHS,
  FILENAME_PATTERN,
  FRONTMATTER_DELIMITER,
  BODY_PREVIEW_MAX_LENGTH,
  DEFAULT_FILTER_DAYS,
} from './constants';

// --- Filename utilities ---
export {
  isValidNoteFilename,
  parseFilenameToDate,
  formatDateForFilter,
  formatCreatedAtForDisplay,
} from './filename';

// --- Frontmatter utilities ---
export {
  createFrontmatterTemplate,
  extractBody,
  detectFrontmatterRange,
} from './frontmatter';

// --- Date filter helpers ---
export {
  computeDefaultDateRange,
  buildDefaultListArgs,
  buildListArgs,
} from './date-filters';

// --- Debounce utility ---
export { debounce } from './debounce';
export type { DebouncedFn } from './debounce';
