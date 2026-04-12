// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 35-2
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
// Public API surface for module:storage frontend utilities.
// IPC functions (createNote, saveNote, etc.) are owned by module_grid/ipc.ts — import from there.

export { AutoSaveManager } from './autosave';
export type { AutoSaveState, AutoSaveStateListener } from './autosave';

export {
  extractBody,
  parseTags,
  parseTagInput,
  tagsToInputValue,
  buildFileContent,
} from './frontmatter';

export {
  parseNoteDate,
  formatNoteDate,
  formatNoteDateTime,
  isWithinLastDays,
  sortIdsDesc,
  dateToNoteId,
  isoDateToStartId,
  isoDateToEndId,
} from './note_utils';

export {
  loadConfig,
  updateNotesDir,
  defaultNotesDirHint,
} from './config_service';
