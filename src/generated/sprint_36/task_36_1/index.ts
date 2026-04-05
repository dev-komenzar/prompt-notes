// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 36-1
// @task-title: 対象モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// PromptNotes — Module Index
// Re-exports for convenient imports from the shared library layer.
// CoDD trace: detail:component_architecture

// Type definitions (Rust-canonical, TypeScript follows)
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
  SetConfigParams,
  ViewName,
  NavigationState,
} from "./types";

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
} from "./api";

// Debounce utility for auto-save and search
export { createDebounce } from "./debounce";
export type { DebouncedFn } from "./debounce";

// Date utilities for grid view filters
export {
  formatDateParam,
  getDefaultFromDate,
  getDefaultToDate,
  parseDateFromFilename,
  formatCreatedAtDisplay,
  getDefaultDateRange,
} from "./date-utils";

// Frontmatter detection and extraction
export {
  detectFrontmatter,
  extractBody,
  extractFrontmatterYaml,
  detectFrontmatterByLine,
} from "./frontmatter";
export type { FrontmatterRange } from "./frontmatter";

// Clipboard operations with fallback
export { writeToClipboard } from "./clipboard";
export type { ClipboardWriteResult } from "./clipboard";

// Application constants
export {
  DEFAULT_FILTER_DAYS,
  AUTOSAVE_DEBOUNCE_MS,
  SEARCH_DEBOUNCE_MS,
  BODY_PREVIEW_MAX_CHARS,
  COPY_FEEDBACK_DURATION_MS,
  FRONTMATTER_DELIMITER,
  FRONTMATTER_TEMPLATE,
  FILENAME_PATTERN,
} from "./constants";
