// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 5-1
// @task-title: `module:storage`, `module:settings`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=5, task=5-1, modules=[storage,settings]
// Barrel export for module:storage and module:settings TypeScript layer.

// Types
export type {
  NoteEntry,
  Config,
  CreateNoteResponse,
  ReadNoteResponse,
  SaveNoteParams,
  ReadNoteParams,
  DeleteNoteParams,
  ListNotesParams,
  SearchNotesParams,
  SetConfigParams,
  StorageError,
  ViewId,
} from './types';

// Constants
export {
  FILENAME_PATTERN,
  AUTOSAVE_DEBOUNCE_MS,
  SEARCH_DEBOUNCE_MS,
  DEFAULT_FILTER_DAYS,
  PREVIEW_MAX_LENGTH,
  COPY_FEEDBACK_DURATION_MS,
  FRONTMATTER_DELIMITER,
} from './constants';

// IPC API (single entry point for all Tauri invoke calls)
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

// Debounce utility
export { createDebounce } from './debounce';
export type { DebouncedFn } from './debounce';

// Date utilities
export {
  formatDateForIpc,
  getDefaultDateRange,
  formatCreatedAtForDisplay,
  isDateInRange,
} from './date-utils';
export type { DateRange } from './date-utils';

// Frontmatter utilities
export {
  generateFrontmatterTemplate,
  extractBodyWithoutFrontmatter,
  findFrontmatterRange,
  getCharOffsetForLine,
  getEndCharOffsetForLine,
} from './frontmatter';
export type { FrontmatterRange } from './frontmatter';

// Service layers
export {
  createNewNote,
  persistNoteContent,
  loadNoteContent,
  removeNote,
  fetchDefaultNotes,
  fetchFilteredNotes,
  searchNotesByQuery,
  collectUniqueTags,
} from './storage-service';

export {
  loadCurrentConfig,
  updateNotesDirectory,
} from './settings-service';
export type { UpdateResult } from './settings-service';
