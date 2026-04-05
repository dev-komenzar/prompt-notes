// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 24-1
// @task-title: 対象モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// PromptNotes — Module Barrel Exports
// Re-exports all public APIs from the shared library modules.

// Core types
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
  ViewName,
  AppState,
} from './types';

// Constants
export {
  AUTOSAVE_DEBOUNCE_MS,
  SEARCH_DEBOUNCE_MS,
  DEFAULT_FILTER_DAYS,
  BODY_PREVIEW_MAX_CHARS,
  COPY_FEEDBACK_DURATION_MS,
  FRONTMATTER_DELIMITER,
  FILENAME_PATTERN,
  CM_FRONTMATTER_LINE_CLASS,
  FRONTMATTER_BG_VAR,
  FRONTMATTER_BG_DEFAULT,
} from './constants';

// Tauri IPC wrappers — single entry point for all backend communication
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

// Utilities
export { debounce } from './debounce';
export type { DebouncedFn } from './debounce';

export { copyToClipboard } from './clipboard';

export {
  detectFrontmatterRange,
  extractBody,
  generateFrontmatterTemplate,
  getBodyStartOffset,
} from './frontmatter';
export type { FrontmatterRange } from './frontmatter';

export {
  formatDateParam,
  getDefaultDateRange,
  formatFilenameDate,
  parseCreatedAt,
  formatCreatedAt,
} from './date-utils';

// Editor extensions
export { frontmatterDecorationPlugin } from './editor/frontmatter-decoration';
export { promptnotesTheme } from './editor/theme';
export { createAutosaveExtension } from './editor/autosave-extension';
export type { AutosaveCallbacks } from './editor/autosave-extension';
export { createPromptnotesKeymap } from './editor/keybindings';
export type { KeybindingCallbacks } from './editor/keybindings';
export { createEditorSetup, createEditorView } from './editor/setup';
export type { EditorSetupOptions, EditorSetupResult } from './editor/setup';
