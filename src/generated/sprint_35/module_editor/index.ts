// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 35-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// module:editor — Public API barrel export.
// Re-exports all types, utilities, and the main EditorController
// needed by Svelte components (Editor.svelte, CopyButton.svelte).

export { EditorController } from './editor-controller';
export type { EditorControllerOptions } from './editor-controller';

export { AutoSaveManager } from './auto-save';
export type { AutoSaveStatusListener } from './auto-save';

export { createDebounce } from './debounce';
export type { DebouncedHandle } from './debounce';

export { createEditorExtensions } from './editor-extensions';
export type { EditorCallbacks } from './editor-extensions';

export { frontmatterDecorationPlugin, frontmatterTheme } from './frontmatter-decoration';

export {
  FRONTMATTER_TEMPLATE,
  extractBody,
  extractFrontmatterBlock,
  cursorPositionAfterFrontmatter,
  detectFrontmatterLines,
} from './frontmatter';

export { copyBodyToClipboard, copyTextToClipboard } from './clipboard';

export {
  createNote,
  saveNote,
  readNote,
  deleteNote,
  listNotes,
  searchNotes,
  getConfig,
  setConfig,
} from './ipc';

export type {
  NoteEntry,
  Config,
  CreateNoteResult,
  ReadNoteResult,
  SaveNoteParams,
  ReadNoteParams,
  DeleteNoteParams,
  ListNotesParams,
  SearchNotesParams,
  AutoSaveStatus,
} from './types';

export { AUTO_SAVE_DEBOUNCE_MS } from './types';
