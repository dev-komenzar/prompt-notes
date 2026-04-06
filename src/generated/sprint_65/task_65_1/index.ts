// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 65-1
// @task-title: 解決マイルストーン
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=65, task=65-1
// Public API barrel export for task_65_1 module.
// Consolidates all exports for clean downstream imports.

// Types
export type {
  NoteEntry,
  Config,
  CreateNoteResponse,
  ReadNoteResponse,
  ListNotesArgs,
  SearchNotesArgs,
  SaveNoteArgs,
  NoteFilenameArgs,
  SetConfigArgs,
  ViewName,
  AppState,
} from "./types";

// IPC API wrappers
export {
  createNote,
  saveNote,
  readNote,
  deleteNote,
  listNotes,
  searchNotes,
  getConfig,
  setConfig,
} from "./api";

// Utilities
export { debounce } from "./debounce";
export type { DebouncedFn } from "./debounce";
export { writeToClipboard } from "./clipboard";
export type { ClipboardResult } from "./clipboard";
export {
  createFrontmatterTemplate,
  detectFrontmatterRange,
  extractBody,
  getFrontmatterCharRange,
  FRONTMATTER_DELIMITER,
} from "./frontmatter";
export {
  formatDateISO,
  getDefault7DayRange,
  formatDisplayDate,
  parseFilenameTimestamp,
} from "./date-utils";
export { isValidNoteFilename, assertValidNoteFilename } from "./filename-validator";

// Constants
export {
  AUTOSAVE_DEBOUNCE_MS,
  SEARCH_DEBOUNCE_MS,
  DEFAULT_FILTER_DAYS,
  BODY_PREVIEW_MAX_CHARS,
  COPY_FEEDBACK_DURATION_MS,
  FRONTMATTER_LINE_CLASS,
  FRONTMATTER_BG_VAR,
  FRONTMATTER_BG_DEFAULT,
} from "./constants";

// Error handling
export { withIPCErrorHandling } from "./errors";
export type { IPCError, IPCErrorCategory } from "./errors";

// CodeMirror 6 extensions (module:editor)
export {
  markdownExtension,
  frontmatterDecorationField,
  autoSaveListener,
  newNoteKeymap,
  createEditorExtensions,
} from "./editor-extensions";

// Grid filter orchestration (module:grid)
export {
  createDefaultFilterState,
  fetchFilteredNotes,
  extractUniqueTags,
} from "./grid-filters";
export type { GridFilterState } from "./grid-filters";

// Editor state management (module:editor)
export { EditorNoteManager } from "./editor-state";

// Styles
export {
  FRONTMATTER_STYLES,
  MASONRY_GRID_STYLES,
  COPY_BUTTON_STYLES,
} from "./styles";
