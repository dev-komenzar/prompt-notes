// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 15-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// module:storage — Barrel exports
// Sprint 15 · M2-03 · read_note IPC コマンド実装

// ── Type definitions (canonical source: Rust module:storage) ──
export type {
  NoteEntry,
  Config,
  CreateNoteResponse,
  ReadNoteParams,
  ReadNoteResponse,
  SaveNoteParams,
  DeleteNoteParams,
  ListNotesParams,
  SearchNotesParams,
  SetConfigParams,
} from './types';

// ── IPC API wrappers ──
export {
  createNote,
  readNote,
  saveNote,
  deleteNote,
  listNotes,
  searchNotes,
  getConfig,
  setConfig,
} from './api';

// ── Debounce utility ──
export { debounce } from './debounce';
export type { DebouncedFn } from './debounce';

// ── Filename validation & date utilities ──
export {
  isValidNoteFilename,
  parseCreatedAtFromFilename,
  formatDateParam,
  getDefaultDateRange,
  formatCreatedAtForDisplay,
} from './validation';

// ── Frontmatter utilities ──
export {
  createFrontmatterTemplate,
  extractBodyWithoutFrontmatter,
  detectFrontmatterRange,
} from './frontmatter';
