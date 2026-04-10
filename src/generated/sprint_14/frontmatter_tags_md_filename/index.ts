// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 14-1
// @task-title: ファイル名生成 → frontmatter テンプレート（空 `tags`）付き `.md` ファイル作成 → `{filename}` 返却
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/storage_fileformat_design.md
// @sprint: 14
// @task: 14-1

export type { Frontmatter, CreateNoteResult, SaveResult, NoteMetadata } from './types';

export {
  isValidNoteFilename,
  parseCreatedAtFromFilename,
  parseDateFromFilename,
} from './filename';

export {
  serializeFrontmatter,
  createEmptyFrontmatter,
  createEmptyNoteContent,
  parseFrontmatterAndBody,
  extractBody,
} from './frontmatter';

export { createNote, readNote, saveNote, deleteNote } from './api';
