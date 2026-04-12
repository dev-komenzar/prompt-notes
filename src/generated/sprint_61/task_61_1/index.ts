// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 61-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/plan/implementation_plan.md sprint:61 task:61-1
// @codd-sprint: 61
// @codd-task: 61-1

/**
 * Sprint 61: Release-Blocking Constraint Checklist — All Modules
 *
 * This module aggregates all constraint validators and the checklist runner.
 * Import from this entry point to access the full constraint verification suite.
 *
 * Usage example (in tests or CI):
 *
 *   import { buildConstraintReport, formatReport } from '@/generated/sprint_61/task_61_1';
 *   const report = buildConstraintReport({ ... });
 *   if (!report.allPassed) throw new Error(formatReport(report));
 */

export {
  RELEASE_BLOCKING_CONSTRAINTS,
  buildConstraintReport,
  formatReport,
  type CheckResult,
  type ConstraintChecklistReport,
} from './constraint_checklist';

export {
  assertNoAiCall,
  assertNoCloudSync,
  assertNoMarkdownPreview,
  assertNoTitleInput,
  assertNoMobileSupport,
  assertNoDirectFsAccess,
  assertNoBrowserStorageForConfig,
  assertCodeMirror6,
} from './scope_guard';

export {
  createNote,
  saveNote,
  readNote,
  deleteNote,
  listNotes,
  searchNotes,
  getConfig,
  setConfig,
  type NoteMetadata,
  type Note,
  type NoteFilter,
  type AppConfig,
} from './ipc_boundary';

export {
  detectSupportedPlatform,
  getNewNoteModifierLabel,
  isNewNoteShortcut,
  PLATFORM_DEFAULTS,
  type SupportedPlatform,
  type PlatformInfo,
} from './platform_guard';

export {
  validateNoteFilename,
  validateNoteId,
  assertValidNoteFilename,
  assertValidNoteId,
  assertValidFrontmatter,
  parseNoteIdToDate,
  assertDefaultNotesDirMatchesPlatform,
  EXPECTED_DEFAULT_NOTES_DIRS,
  type ValidatedFrontmatter,
} from './storage_constraints';

export {
  isCodeMirror6EditorView,
  assertCodeMirror6EditorView,
  assertNoMarkdownRenderingLibrary,
  assertNoTitleInputInDOM,
  assertCopyButtonPresent,
  assertFrontmatterBarHasDistinctBackground,
  buildNewNoteKeydownEvent,
  AUTO_SAVE_DEBOUNCE_MS,
  SEARCH_DEBOUNCE_MS,
  NEW_NOTE_LATENCY_TARGET_MS,
  type NewNoteShortcutHandler,
} from './editor_constraints';

export {
  buildDefaultGridFilter,
  assertDefaultFilterIsSevenDays,
  assertMasonryLayout,
  assertCardsHaveBreakInsideAvoid,
  assertFilterBarElements,
  assertCardNavigatesToEditor,
  assertBackendSearchStrategy,
  type SearchStrategy,
} from './grid_constraints';
