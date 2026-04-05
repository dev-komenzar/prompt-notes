// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 11-1
// @task-title: `module:storage`, `module:settings`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=11, task=11-1, modules=[storage,settings]
// Barrel export for module:storage and module:settings TypeScript layer.

// --- Core types (mirrors Rust canonical definitions) ---
export type {
  NoteEntry,
  Config,
  CreateNoteResponse,
  SaveNoteParams,
  ReadNoteParams,
  ReadNoteResponse,
  DeleteNoteParams,
  ListNotesParams,
  SearchNotesParams,
  SetConfigParams,
} from './types';

// --- IPC API wrappers (single entry-point; no direct invoke elsewhere) ---
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

// --- Utilities ---
export { debounce } from './debounce';
export type { DebouncedFn } from './debounce';

export {
  isValidNoteFilename,
  parseCreatedAtFromFilename,
  FILENAME_PATTERN,
} from './validators';

export {
  formatDateParam,
  getDefaultDateRange,
  formatCreatedAtDisplay,
} from './date-utils';
export type { DateRange } from './date-utils';

export {
  detectFrontmatter,
  extractBody,
  newNoteFrontmatter,
} from './frontmatter';
export type { FrontmatterBounds } from './frontmatter';

export { wrapIpcCall, StorageErrorKind } from './errors';
export type { StorageError, IpcResult } from './errors';
