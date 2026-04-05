// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 2-1
// @task-title: `module:shell`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint:2 task:2-1 module:shell node:detail:component_architecture
// Barrel re-export for module:shell public surface.

// --- Types ---
export type {
  NoteEntry,
  CreateNoteResponse,
  ReadNoteResponse,
  Config,
  ListNotesParams,
  SearchNotesParams,
  SaveNoteParams,
  FilenameParams,
  SetConfigParams,
  AppView,
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

// --- IPC command constants ---
export {
  CMD_CREATE_NOTE,
  CMD_SAVE_NOTE,
  CMD_READ_NOTE,
  CMD_DELETE_NOTE,
  CMD_LIST_NOTES,
  CMD_SEARCH_NOTES,
  CMD_GET_CONFIG,
  CMD_SET_CONFIG,
} from './ipc-commands';

// --- Application state ---
export {
  currentView,
  selectedFilename,
  navigateToEditor,
  navigateToNewNote,
  navigateToGrid,
  navigateToSettings,
  isEditingExistingNote,
} from './app-state';

// --- Utilities ---
export { debounce, type DebouncedFn } from './debounce';
export {
  createEmptyTemplate,
  detectFrontmatterRange,
  extractBody,
} from './frontmatter';
export { writeToClipboard } from './clipboard';
export {
  formatDateParam,
  defaultGridDateRange,
  filenameToDisplayDate,
} from './date-utils';
export {
  getPlatform,
  modKeyLabel,
  newNoteShortcutLabel,
  type SupportedPlatform,
} from './platform';
