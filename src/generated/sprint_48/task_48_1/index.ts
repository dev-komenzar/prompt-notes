// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 48-1
// @task-title: 対象モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=48, task=48-1, module=index
// Barrel re-export for all target modules under sprint_48/task_48_1.
// Consumers can import from this single entry point.

// ── Type definitions ─────────────────────────────────────────────────
export type {
  NoteEntry,
  Config,
  CreateNoteResult,
  SaveNoteArgs,
  ReadNoteArgs,
  ReadNoteResult,
  DeleteNoteArgs,
  ListNotesArgs,
  SearchNotesArgs,
  SetConfigArgs,
  ViewName,
  NavigationState,
} from "./types";

// ── Constants ────────────────────────────────────────────────────────
export {
  AUTOSAVE_DEBOUNCE_MS,
  SEARCH_DEBOUNCE_MS,
  DEFAULT_GRID_DAYS,
  BODY_PREVIEW_MAX_CHARS,
  COPY_FEEDBACK_DURATION_MS,
  FRONTMATTER_DELIMITER,
  EMPTY_FRONTMATTER_TEMPLATE,
  FILENAME_PATTERN,
} from "./constants";

// ── IPC API wrappers ─────────────────────────────────────────────────
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

// ── Utilities ────────────────────────────────────────────────────────
export { createDebounce } from "./debounce";
export type { DebouncedFn } from "./debounce";

export {
  formatDateParam,
  defaultDateRange,
  formatCreatedAtDisplay,
  parseFilenameDate,
} from "./date-utils";

export {
  detectFrontmatterRange,
  extractBody,
  emptyFrontmatterTemplate,
  frontmatterCharRange,
} from "./frontmatter";

export { writeToClipboard } from "./clipboard";
