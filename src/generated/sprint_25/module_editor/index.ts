// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 25-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:25 task:25-1 module:editor – Public API surface

export { EditorController } from './editor-controller';
export type { EditorControllerConfig } from './editor-controller';

export { copyToClipboard } from './clipboard';

export { extractBody, FRONTMATTER_TEMPLATE, findBodyStartPosition } from './frontmatter-utils';

export { createEditorExtensions } from './editor-extensions';
export type { EditorExtensionsConfig } from './editor-extensions';

export { createNote, saveNote, readNote, deleteNote, listNotes, searchNotes, getConfig, setConfig } from './api';

export type {
  NoteEntry,
  Config,
  CreateNoteResult,
  ReadNoteResult,
  ListNotesParams,
  SearchNotesParams,
} from './types';
