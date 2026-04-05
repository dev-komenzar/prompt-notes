// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 27-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// Sprint 27 – module:editor – Public API surface
// Re-exports all editor module functionality for external consumers.

// Types
export type {
  NoteEntry,
  Config,
  CreateNoteResponse,
  ReadNoteResponse,
  ListNotesParams,
  SearchNotesParams,
} from './types';

// Tauri IPC wrappers
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

// Debounce utility
export { createDebounce } from './debounce';
export type { DebouncedFn } from './debounce';

// Frontmatter detection
export { detectFrontmatterRange, detectFrontmatterFromString } from './frontmatter-detection';
export type { FrontmatterRange } from './frontmatter-detection';

// Frontmatter decoration (OQ-002 resolution: StateField + Decoration)
export { frontmatterDecoration } from './frontmatter-decoration';

// Frontmatter theme
export { frontmatterTheme } from './frontmatter-theme';

// Frontmatter template
export {
  EMPTY_FRONTMATTER_TEMPLATE,
  createFrontmatterTemplate,
  bodyStartOffset,
} from './frontmatter-template';

// Markdown extension
export { markdownExtension } from './markdown-extension';

// Keymap extension (Cmd+N / Ctrl+N)
export { newNoteKeymap } from './keymap-extension';
export type { NewNoteHandler } from './keymap-extension';

// Auto-save extension
export { createAutosave } from './autosave-extension';
export type { SaveContentFn, AutosaveHandle } from './autosave-extension';

// Clipboard
export { copyToClipboard } from './clipboard';

// Body extraction (for copy button)
export { extractBodyFromDoc, extractBodyFromString } from './extract-body';

// Editor setup (aggregated factory)
export { createEditor, initNewNoteInEditor } from './editor-setup';
export type { EditorConfig, EditorHandle } from './editor-setup';
