// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 1-1
// @task-title: 完了条件
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/test/acceptance_criteria.md
// @generated-by: codd generate --sprint 1 --task 1-1

/**
 * Sprint 1 Task 1-1: 完了条件 (Acceptance Criteria)
 *
 * This module exports all type definitions, validation utilities, constants,
 * and scope guard checks that enforce the non-negotiable conventions and
 * acceptance criteria for PromptNotes.
 */

// Types
export type { NoteMetadata, Frontmatter, NoteData, CreateNoteResult, SaveResult, DeleteResult } from './types/note';
export type { SearchParams, ListNotesParams } from './types/search';
export type { Settings, UpdateSettingsResult } from './types/settings';
export { IPC_COMMANDS } from './types/commands';
export type { IpcCommandName } from './types/commands';

// Constants
export {
  FILENAME_REGEX,
  ALLOWED_FRONTMATTER_FIELDS,
  DEFAULT_FILTER_DAYS,
  FRONTMATTER_BG_CLASS,
  AUTOSAVE_DEBOUNCE_DEFAULT_MS,
  SEARCH_DEBOUNCE_MS,
  COPY_FEEDBACK_DURATION_MS,
  DEFAULT_NOTES_DIR,
  FRONTMATTER_REGEX,
  PERFORMANCE_TARGETS,
} from './constants/conventions';
export { PROHIBITED_FEATURES, PROHIBITED_DOM_SELECTORS } from './constants/scope-guard';

// Validation — Filename
export { isValidNoteFilename, parseCreatedAtFromFilename, isSafeFilename } from './validation/filename';

// Validation — Frontmatter
export {
  extractBody,
  extractFrontmatterYaml,
  parseTagsFromYaml,
  serializeFrontmatter,
  validateFrontmatterSchema,
} from './validation/frontmatter';

// Validation — Scope Guard
export {
  assertNoTitleInput,
  assertNoMarkdownRendering,
  assertCodeMirror6Present,
  assertFrontmatterBackgroundPresent,
  assertCopyButtonPresent,
} from './validation/scope-guard';

// Validation — Acceptance Criteria
export {
  ACCEPTANCE_CRITERIA,
  FAILURE_CRITERIA,
  computeDefaultDateRange,
} from './validation/acceptance';

// Platform
export { detectPlatform, getPlatformModifierKey, isPlatformModifierPressed } from './platform/detect';
