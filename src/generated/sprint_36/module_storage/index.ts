// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 36-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/storage_fileformat_design.md
// @sprint: 36 — list_note_files() 共通関数 (module:storage barrel)

export type { Frontmatter, NoteMetadata, Note, NoteFilter, AppConfig } from './types';
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
export { notesStore, setNotes, prependNote, removeNote, updateNote } from './notes-store';
