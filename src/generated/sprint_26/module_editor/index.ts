// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 26-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:26 | task:26-1 | module:editor
// Barrel re-exports for module:editor.
// Consumers (e.g. Editor.svelte, CopyButton.svelte) import from this module.

export { EditorController } from './editor-controller';

export {
  copyToClipboard,
} from './clipboard';

export {
  generateFrontmatterTemplate,
  extractBodyText,
  getBodyStartPosition,
} from './frontmatter';

export {
  createNote,
  saveNote,
  readNote,
  deleteNote,
} from './api';

export { debounce } from './debounce';
export type { DebouncedFunction } from './debounce';

export type {
  NoteEntry,
  Config,
  CreateNoteResponse,
  ReadNoteResponse,
} from './types';
