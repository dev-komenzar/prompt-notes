// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 32-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd:generated sprint=32 task=32-1 module=editor
// Traceability: detail:editor_clipboard, detail:component_architecture
// Public API surface for module:editor

// Core controller
export { EditorController } from "./editor-controller";

// Types
export type {
  NoteEntry,
  CreateNoteResponse,
  ReadNoteResponse,
  Config,
  EditorState,
} from "./types";

// IPC API wrappers (all file ops via Tauri IPC — CONV-1)
export { createNote, saveNote, readNote, deleteNote } from "./api";

// Utilities
export { createDebounce } from "./debounce";
export { copyToClipboard } from "./clipboard";
export {
  FRONTMATTER_TEMPLATE,
  getBodyStartPosition,
  extractBody,
} from "./frontmatter-template";

// CodeMirror 6 extensions
export { buildEditorExtensions, createEditorState } from "./editor-extensions";
export {
  frontmatterDecorationPlugin,
  FRONTMATTER_CSS,
} from "./frontmatter-decoration";

// UI state helpers
export {
  createCopyButtonState,
  type CopyButtonState,
} from "./copy-button-state";

// Styles
export { EDITOR_STYLES, injectEditorStyles } from "./editor-styles";
