// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 63-1
// @task-title: Linux, macOS
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated Sprint 63 — Task 63-1 — Linux, macOS smoke test UI foundation
// trace: plan:implementation_plan — Sprint 63: 全配布形式でのスモークテスト
//
// Public API surface for the ui_foundation module.
// Exports shared types, utilities, IPC client, and smoke test runners.

// -- Core types --
export type {
  NoteEntry,
  Config,
  CreateNoteResult,
  ReadNoteResult,
  ListNotesParams,
  SearchNotesParams,
  SaveNoteParams,
  SetConfigParams,
  SupportedPlatform,
  AppView,
} from './types';

export {
  FILENAME_PATTERN,
  BODY_PREVIEW_MAX_CHARS,
  DEFAULT_FILTER_DAYS,
  AUTOSAVE_DEBOUNCE_MS,
  SEARCH_DEBOUNCE_MS,
} from './types';

// -- IPC client (sole invoke entry point — CONV-1) --
export {
  createNote,
  saveNote,
  readNote,
  deleteNote,
  listNotes,
  searchNotes,
  getConfig,
  setConfig,
} from './ipc-client';

// -- Utilities --
export { debounce } from './debounce';
export type { DebouncedFn } from './debounce';
export { formatDateParam, getDefaultDateRange, formatCreatedAt, isValidNoteFilename } from './date-utils';
export { detectPlatform, getExpectedDefaultNotesDir, getExpectedConfigPath, getModifierLabel, getDistributionFormats } from './platform';
export { FRONTMATTER_TEMPLATE, detectFrontmatterRange, getCopyText, extractBodyAfterFrontmatter } from './frontmatter';
export { copyToClipboard } from './clipboard';

// -- Smoke tests --
export { runSmokeTests } from './smoke/smoke-runner';
export { runLinuxSmokeTest } from './smoke/run-linux';
export { runMacOSSmokeTest } from './smoke/run-macos';
export { formatReportText, formatReportJson } from './smoke/report-formatter';
export type { SmokeReport, SmokeCheckResult, SmokeRunConfig, SmokeCategory } from './smoke/smoke-types';
