// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 12-1
// @task-title: 対象モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=12 task=12-1 module=index
// Public barrel export for all shared modules used by Svelte components.
// Svelte components import from this index or from individual modules.

// --- Types ---
export type {
  NoteEntry,
  Config,
  CreateNoteResult,
  ReadNoteResult,
  ListNotesArgs,
  SearchNotesArgs,
  SaveNoteArgs,
  FileTargetArgs,
  SetConfigArgs,
  ViewType,
  NavigationState,
} from './types';

// --- IPC API (single entry point for all Tauri invoke calls) ---
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
export { debounce } from './debounce';
export type { DebouncedFn } from './debounce';

export {
  formatDateParam,
  getDefaultDateRange,
  formatCreatedAt,
  parseFilenameTimestamp,
} from './date-utils';

export {
  detectFrontmatterRange,
  extractBody,
  getFrontmatterTemplate,
  getFrontmatterCharRange,
} from './frontmatter';
export type { FrontmatterRange } from './frontmatter';

export { writeToClipboard } from './clipboard';
export type { ClipboardWriteResult } from './clipboard';

export { navigationStore } from './navigation';

export {
  isValidNoteFilename,
  filenameToDisplayDate,
  filenameToDateString,
} from './filename-utils';

// --- Constants ---
export {
  AUTOSAVE_DEBOUNCE_MS,
  SEARCH_DEBOUNCE_MS,
  DEFAULT_GRID_DAYS,
  BODY_PREVIEW_MAX_CHARS,
  COPY_FEEDBACK_DURATION_MS,
  FILENAME_PATTERN,
  FRONTMATTER_DELIMITER,
  FRONTMATTER_TEMPLATE,
  FRONTMATTER_BG_CSS_VAR,
  FRONTMATTER_BG_DEFAULT,
} from './constants';
