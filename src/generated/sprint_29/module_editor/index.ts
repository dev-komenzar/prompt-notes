// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 29-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated sprint:29 task:29-1 module:editor
// Public API surface for module:editor

// Core editor factory
export { createEditor } from './editor-setup';
export type { EditorInstance, EditorSetupOptions } from './editor-setup';

// Auto-save (Sprint 29 primary deliverable)
export { createAutoSave, AUTOSAVE_DEBOUNCE_MS } from './auto-save';
export type { AutoSaveCallbacks, AutoSaveHandle } from './auto-save';

// Debounce utility (shared with module:grid search debounce)
export { debounce } from './debounce';
export type { DebouncedFn } from './debounce';

// Clipboard (CONV-7 core UX)
export { copyBodyToClipboard, writeToClipboard } from './clipboard';

// Frontmatter utilities
export {
  createFrontmatterTemplate,
  extractBodyText,
  getBodyStartPosition,
  detectFrontmatterLines,
} from './frontmatter-utils';

// Frontmatter CodeMirror decoration (CONV-5)
export { frontmatterDecoration, frontmatterTheme } from './frontmatter-decoration';

// Keymap (CONV-8)
export { createNewNoteKeymap } from './editor-keymap';
export type { NewNoteKeymapCallbacks } from './editor-keymap';

// Tauri IPC wrappers (single entry-point for all backend calls)
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

// Shared type definitions
export type {
  NoteEntry,
  Config,
  CreateNoteResult,
  ReadNoteResult,
  ListNotesParams,
  SearchNotesParams,
} from './types';
