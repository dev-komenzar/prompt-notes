// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 28-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// Sprint 28 | Task 28-1 | module:editor
// Barrel export for module:editor public API.

export type {
  NoteEntry,
  Config,
  CreateNoteResult,
  ReadNoteResult,
  ListNotesParams,
  SearchNotesParams,
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

export { debounce, type DebouncedFn } from './debounce';

export {
  detectFrontmatterRange,
  extractBodyText,
  createFrontmatterTemplate,
  getBodyStartOffset,
  type FrontmatterRange,
} from './frontmatter-utils';

export { frontmatterDecorationField } from './frontmatter-decoration';
export { frontmatterTheme } from './frontmatter-theme';

export { copyBodyToClipboard, copyFullDocumentToClipboard } from './clipboard';

export { newNoteKeymap, type OnNoteCreated } from './editor-keymap';

export {
  createAutosave,
  type AutosaveHandle,
} from './editor-autosave';

export {
  createEditorSetup,
  type EditorSetupOptions,
  type EditorSetupResult,
} from './editor-setup';
