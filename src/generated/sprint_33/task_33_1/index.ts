// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 33-1
// @task-title: 共有層
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=33, task=33-1, module=shared
// Barrel re-export for the shared layer consumed by module:editor, module:grid,
// and module:settings UI components.

export type {
  NoteEntry,
  CreateNoteResult,
  ReadNoteResult,
  Config,
  ListNotesParams,
  SearchNotesParams,
  SaveNoteParams,
  SetConfigParams,
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

export { createDebounce } from './debounce';

export { formatDateParam, defaultDateRange } from './date_utils';

export {
  FRONTMATTER_TEMPLATE,
  extractBody,
  detectFrontmatterRange,
} from './frontmatter';
