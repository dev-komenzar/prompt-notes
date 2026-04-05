// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 17-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// module:storage — Public API barrel export

export type {
  NoteEntry,
  Config,
  CreateNoteResponse,
  ReadNoteResponse,
  ListNotesParams,
  SearchNotesParams,
} from './types';

export type {
  FrontmatterData,
  ParsedNote,
  FrontmatterRange,
} from './frontmatter';

export {
  detectFrontmatterRange,
  parseFrontmatter,
  extractBody,
  extractTags,
  serializeFrontmatter,
  createNoteTemplate,
} from './frontmatter';

export {
  isValidNoteFilename,
  parseCreatedAt,
  parseCreatedAtISO,
  formatDateParam,
  getDefaultFromDate,
  getDefaultToDate,
  formatCreatedAtDisplay,
} from './filename';

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

export type { DebouncedFn } from './debounce';
export { debounce } from './debounce';
