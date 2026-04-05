// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 1-1
// @task-title: 対象モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD trace: plan:implementation_plan > sprint:1 > task:1-1
// Barrel exports for shared library modules.
// All frontend components import from this entry point or from individual modules.

// ─── Type definitions (Rust-canonical, TS follows) ──────────
export type {
  NoteEntry,
  Config,
  CreateNoteResult,
  ReadNoteResult,
  ListNotesParams,
  SearchNotesParams,
  SaveNoteParams,
  NoteFileParams,
  SetConfigParams,
  ViewName,
  NavigationState,
} from './types';

// ─── IPC API wrappers (single invoke entry point) ───────────
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

// ─── Debounce utility ───────────────────────────────────────
export type { DebouncedFn } from './debounce';
export { createDebouncedFn } from './debounce';

// ─── Frontmatter utilities ──────────────────────────────────
export type { FrontmatterRange } from './frontmatter';
export {
  createNoteTemplate,
  detectFrontmatterRange,
  detectFrontmatterLineRange,
  extractBody,
  extractFullContent,
} from './frontmatter';

// ─── Date utilities ─────────────────────────────────────────
export {
  formatDateParam,
  getDefault7DayRange,
  formatDisplayDate,
  parseFilenameDate,
} from './date-utils';
